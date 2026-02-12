import base64
import hashlib
import json
import os
import re
import ssl
import tempfile
from datetime import datetime, timezone

import requests
from requests.auth import HTTPBasicAuth
from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

app = Flask(__name__)
CORS(app)


def search_text_recursively(content, ref):
    """
    Cerca ricorsivamente la reference nel testo Jira (ADF o stringa plain),
    gestendo dict/list/string in modo case-insensitive.
    """
    ref_lower = (ref or "").lower()
    if not ref_lower:
        return False

    def _search(node):
        if node is None:
            return False
        if isinstance(node, str):
            return ref_lower in node.lower()
        if isinstance(node, list):
            return any(_search(item) for item in node)
        if isinstance(node, dict):
            text_val = node.get("text")
            if isinstance(text_val, str) and ref_lower in text_val.lower():
                return True
            return _search(node.get("content")) or _search(text_val)
        return False

    return _search(content)

@app.route('/run-script', methods=['POST'])
def run_script():
    references = request.json.get('references', [])
    dlq = request.json.get('dlq', '')  # Assumi che la DLQ venga passata dal frontend
    if not references:
        return jsonify(error="No references provided"), 400

    base_url = "https://cap4cloud.atlassian.net/rest/api/3"
    search_url = f"{base_url}/search/jql"
    username = os.getenv('JIRA_USERNAME')
    password = os.getenv('JIRA_PASSWORD')

    if not username or not password:
        return jsonify(error="JIRA_USERNAME and JIRA_PASSWORD environment variables are required"), 500

    results = []

    def _run_jql(jql_query: str):
        """
        Esegue POST /search/jql con paginazione nextPageToken (CHANGE-2046 compliant).
        Ritorna tutte le issue (max ~1000 per safety).
        """
        fields = ["key", "summary", "customfield_10111", "description", "status", "customfield_10124"]
        issues = []
        next_token = None
        max_results = 100
        safety_cap = 1000

        while True:
            payload = {
                "jql": jql_query,
                "maxResults": max_results,
                "fields": fields,
            }
            if next_token:
                payload["nextPageToken"] = next_token

            resp = requests.post(
                search_url,
                headers={"Accept": "application/json"},
                json=payload,
                auth=HTTPBasicAuth(username, password),
            )
            try:
                resp.raise_for_status()
            except requests.exceptions.RequestException:
                break

            data = resp.json() or {}
            batch = data.get("issues") or data.get("searchResults") or []
            # Fallback batch container (responses)
            if not batch and data.get("responses"):
                first = data["responses"][0]
                batch = first.get("issues") or first.get("searchResults") or []
                next_token = first.get("nextPageToken")
            else:
                next_token = data.get("nextPageToken")

            issues.extend(batch or [])

            if not next_token or len(issues) >= safety_cap:
                break

        return issues

    def _queries_for_ref(ref: str):
        """Costruisce una lista di JQL da provare per una reference, includendo varianti tokenizzate (es. split su -/_)."""
        safe_ref = (ref or "").replace('"', '\\"')
        base = [
            f'text ~ "\\"{safe_ref}\\""',
            f'description ~ "\\"{safe_ref}\\""',
            f'summary ~ "\\"{safe_ref}\\""',
            f'comment ~ "\\"{safe_ref}\\""',
        ]

        tokens = [t for t in re.split(r"[^A-Za-z0-9]+", ref or "") if t]
        # AND sui token per agganciare le descrizioni dove Jira indicizza i pezzi separati
        if len(tokens) > 1:
            text_and = " AND ".join([f'text ~ "{t}"' for t in tokens])
            desc_and = " AND ".join([f'description ~ "{t}"' for t in tokens])
            base.insert(0, f"({text_and})")
            base.insert(1, f"({desc_and})")

        # ricerche sui singoli token per aggirare tokenizer Jira
        for tok in tokens:
            if len(tok) < 3:
                continue
            safe_tok = tok.replace('"', '\\"')
            base.append(f'text ~ "{safe_tok}"')
            base.append(f'description ~ "{safe_tok}"')
            base.append(f'summary ~ "{safe_tok}"')
            base.append(f'comment ~ "{safe_tok}"')

        # dedup preservando ordine
        seen = set()
        ordered = []
        for q in base:
            if q in seen:
                continue
            seen.add(q)
            ordered.append(q)
        return ordered

    for ref in references:
        queries = _queries_for_ref(ref)

        issues_found = []
        seen_keys = set()
        for q in queries:
            for issue in _run_jql(q):
                key = issue.get("key")
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                issues_found.append(issue)

        if not issues_found:
            results.append({
                "reference": ref,
                "incident": "NOT REPORTED",
                "task_name": "N/A",
                "task_link": None
            })
            continue

        for issue in issues_found:
            task_name = issue.get("key", "Task Not Found")
            incident_number = issue.get("fields", {}).get("customfield_10111", "")
            task_link = f"https://cap4cloud.atlassian.net/browse/{task_name}"

            status = issue.get("fields", {}).get("status", {}).get("name", "Unknown Status")
            status_category = issue.get("fields", {}).get("status", {}).get("statusCategory", {}).get("name", "Unknown Category")

            summary = issue.get("fields", {}).get("summary", "No Summary")

            customer_field = issue.get("fields", {}).get("customfield_10124", [])
            customer_value = customer_field[0].get("value", "Unknown Customer") if customer_field else "Unknown Customer"

            task_data = {
                "reference": ref,
                "incident": incident_number or task_name,
                "task_name": task_name,
                "summary": summary,
                "task_link": task_link,
                "task_status": status,
                "status_category": status_category,
                "customer": customer_value
            }

            results.append(task_data)

    output = {
        "non_reported": [],
        "reported": {},
        "different_customers": [],  # Per memorizzare i task con customer diverso
        "dlq": dlq,
    }

    for result in results:
        if result["incident"] == "NOT REPORTED":
            output["non_reported"].append(result["reference"])
        else:
            incident_key = result["incident"] or "UNKNOWN_INCIDENT"
            if incident_key not in output["reported"]:
                output["reported"][incident_key] = {
                    "task_name": result["task_name"] or "N/A",
                    "summary": result["summary"] or "No Summary",
                    "task_link": result["task_link"] or "N/A",
                    "task_status": result["task_status"] or "Unknown Status",
                    "status_category": result["status_category"] or "Unknown Category",
                    "references": [],
                    "references_count": 0  # Inizializza references_count
                }
            output["reported"][incident_key]["references"].append(result["reference"])
            output["reported"][incident_key]["references_count"] += 1

        customer = result.get("customer", "Unknown Customer")
        if customer != "DIOR01MMS":
            output["different_customers"].append(result)

    # Rimozione di chiavi con valore None
    output = {k: v for k, v in output.items() if v is not None}

    return jsonify(output=output)


def _parse_asn1_time(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _flatten_dn(dn):
    if not dn:
        return ""
    parts = []
    for rdn in dn:
        for item in rdn:
            if isinstance(item, tuple) and len(item) == 2:
                key, val = item
                parts.append(f"{key}={val}")
    return ", ".join(parts)


def _extract_pem_blocks(cert_text):
    block_pattern = re.compile(
        r"-----BEGIN CERTIFICATE-----\s*(.*?)\s*-----END CERTIFICATE-----",
        re.DOTALL,
    )
    matches = block_pattern.findall(cert_text or "")
    blocks = []
    for body in matches:
        compact = re.sub(r"[^A-Za-z0-9+/=]", "", body)
        if compact:
            blocks.append(compact)
    return blocks


def _clone_yaml_tree(value, memo=None):
    if memo is None:
        memo = {}

    node_id = id(value)
    if node_id in memo:
        return memo[node_id]

    if isinstance(value, list):
        cloned_list = []
        memo[node_id] = cloned_list
        cloned_list.extend(_clone_yaml_tree(item, memo) for item in value)
        return cloned_list

    if isinstance(value, dict):
        cloned_dict = {}
        memo[node_id] = cloned_dict
        for key, item in value.items():
            cloned_key = _clone_yaml_tree(key, memo)
            cloned_dict[cloned_key] = _clone_yaml_tree(item, memo)
        return cloned_dict

    return value


def _safe_yaml_dump(payload, indent=2, resolve_aliases=False):
    if not resolve_aliases:
        return yaml.safe_dump(
            payload,
            sort_keys=False,
            allow_unicode=True,
            indent=indent,
            default_flow_style=False,
        )

    class NoAliasSafeDumper(yaml.SafeDumper):
        def ignore_aliases(self, _data):
            return True

    cloned_payload = _clone_yaml_tree(payload)
    return yaml.dump(
        cloned_payload,
        Dumper=NoAliasSafeDumper,
        sort_keys=False,
        allow_unicode=True,
        indent=indent,
        default_flow_style=False,
    )


@app.route('/api/json-yaml/convert', methods=['POST'])
def convert_json_yaml():
    if yaml is None:
        return jsonify(ok=False, error='PyYAML non installato nel virtualenv.'), 500

    payload = request.get_json(silent=True) or {}
    raw_input = payload.get('input', '')
    direction = payload.get('direction', 'json_to_yaml')
    indent = payload.get('indent', 2)

    try:
        indent = int(indent)
    except (TypeError, ValueError):
        indent = 2
    indent = max(1, min(indent, 8))

    if not str(raw_input).strip():
        return jsonify(ok=False, error='Input vuoto.'), 400

    try:
        if direction == 'json_to_yaml':
            parsed = json.loads(raw_input)
            output = _safe_yaml_dump(
                parsed,
                indent=indent,
                resolve_aliases=False,
            )
        elif direction == 'yaml_to_json':
            parsed = yaml.safe_load(raw_input)
            output = json.dumps(parsed, ensure_ascii=False, indent=indent)
        else:
            return jsonify(ok=False, error='Direction non valida.'), 400
    except json.JSONDecodeError as exc:
        return jsonify(ok=False, error=f'JSON non valido: {exc.msg} (linea {exc.lineno})'), 400
    except Exception as exc:
        msg = str(exc) if str(exc) else exc.__class__.__name__
        return jsonify(ok=False, error=f'YAML non valido: {msg}'), 400

    return jsonify(ok=True, output=output)


@app.route('/api/yaml/reformat', methods=['POST'])
def reformat_yaml():
    if yaml is None:
        return jsonify(ok=False, error='PyYAML non installato nel virtualenv.'), 500

    payload = request.get_json(silent=True) or {}
    raw_input = payload.get('input', '')
    indent = payload.get('indent', 2)
    resolve_aliases = payload.get('resolve_aliases', True)

    try:
        indent = int(indent)
    except (TypeError, ValueError):
        indent = 2
    indent = max(1, min(indent, 8))

    if isinstance(resolve_aliases, str):
        resolve_aliases = resolve_aliases.strip().lower() not in {'', '0', 'false', 'no', 'off'}
    else:
        resolve_aliases = bool(resolve_aliases)

    if not str(raw_input).strip():
        return jsonify(ok=False, error='Input YAML vuoto.'), 400

    try:
        parsed = yaml.safe_load(raw_input)
        output = _safe_yaml_dump(
            parsed,
            indent=indent,
            resolve_aliases=resolve_aliases,
        )
    except Exception as exc:
        msg = str(exc) if str(exc) else exc.__class__.__name__
        return jsonify(ok=False, error=f'YAML non valido: {msg}'), 400

    return jsonify(
        ok=True,
        output=output,
        stripped_comments=True,
        resolved_aliases=resolve_aliases,
    )


@app.route('/api/certificate-parse', methods=['POST'])
def parse_certificate():
    payload = request.get_json(silent=True) or {}
    cert_text = payload.get('certificate') or payload.get('certText') or ''

    if not cert_text.strip():
        return jsonify(ok=False, error='Incolla un certificato PEM.'), 400

    blocks = _extract_pem_blocks(cert_text)
    if not blocks:
        return jsonify(ok=False, error='Formato certificato non valido. Usa PEM con BEGIN/END CERTIFICATE.'), 400

    parsed_certs = []
    errors = []

    for idx, body in enumerate(blocks, start=1):
        pem = "-----BEGIN CERTIFICATE-----\n" + body + "\n-----END CERTIFICATE-----\n"
        tmp_path = None

        try:
            with tempfile.NamedTemporaryFile('w', delete=False, suffix='.pem', encoding='utf-8') as tmp:
                tmp.write(pem)
                tmp_path = tmp.name

            decoded = ssl._ssl._test_decode_cert(tmp_path)

            der_bytes = base64.b64decode(body.encode('ascii'), validate=False)
            fingerprint_sha256 = ':'.join(f'{b:02X}' for b in hashlib.sha256(der_bytes).digest())

            not_before_raw = decoded.get('notBefore')
            not_after_raw = decoded.get('notAfter')
            not_before_dt = _parse_asn1_time(not_before_raw)
            not_after_dt = _parse_asn1_time(not_after_raw)
            now = datetime.now(timezone.utc)

            valid_now = False
            days_remaining = None
            if not_before_dt and not_after_dt:
                valid_now = not_before_dt <= now <= not_after_dt
                days_remaining = int((not_after_dt - now).total_seconds() // 86400)

            sans = decoded.get('subjectAltName') or []
            san_values = [f"{item[0]}:{item[1]}" for item in sans if isinstance(item, tuple) and len(item) == 2]

            parsed_certs.append({
                'index': idx,
                'subject': _flatten_dn(decoded.get('subject')),
                'issuer': _flatten_dn(decoded.get('issuer')),
                'serial_number': decoded.get('serialNumber', ''),
                'version': decoded.get('version', ''),
                'not_before': not_before_raw,
                'not_after': not_after_raw,
                'valid_now': valid_now,
                'days_remaining': days_remaining,
                'subject_alt_names': san_values,
                'fingerprint_sha256': fingerprint_sha256,
            })
        except Exception as exc:  # pragma: no cover
            errors.append(f'Certificato #{idx}: {exc}')
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

    if not parsed_certs:
        return jsonify(ok=False, error='Impossibile decodificare il certificato.', details=errors), 400

    return jsonify(ok=True, certificates=parsed_certs, errors=errors)


@app.route('/api/http-request', methods=['POST'])
def http_request_proxy():
    payload = request.get_json(silent=True) or {}

    method = str(payload.get('method', 'GET')).upper().strip()
    url = str(payload.get('url', '')).strip()
    headers = payload.get('headers') or {}
    raw_body = payload.get('body', '')
    timeout = payload.get('timeout', 20)
    as_json = bool(payload.get('as_json', False))
    verify_tls = bool(payload.get('verify_tls', True))

    allowed_methods = {'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'}
    if method not in allowed_methods:
        return jsonify(ok=False, error='Metodo HTTP non supportato.'), 400

    if not url or not re.match(r'^https?://', url, re.IGNORECASE):
        return jsonify(ok=False, error='URL non valido. Usa http:// o https://'), 400

    if not isinstance(headers, dict):
        return jsonify(ok=False, error='Headers devono essere un oggetto JSON.'), 400

    normalized_headers = {
        str(key): '' if value is None else str(value)
        for key, value in headers.items()
    }

    try:
        timeout_val = float(timeout)
    except (TypeError, ValueError):
        timeout_val = 20.0
    timeout_val = max(1.0, min(timeout_val, 120.0))

    request_kwargs = {
        'headers': normalized_headers,
        'timeout': timeout_val,
        'allow_redirects': True,
        'verify': verify_tls,
    }

    body_methods = {'POST', 'PUT', 'PATCH', 'DELETE'}
    if method in body_methods and raw_body not in (None, ''):
        if as_json:
            try:
                json_payload = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
            except Exception as exc:
                return jsonify(ok=False, error=f'Body JSON non valido: {exc}'), 400
            request_kwargs['json'] = json_payload
        else:
            request_kwargs['data'] = raw_body if isinstance(raw_body, (str, bytes)) else json.dumps(raw_body, ensure_ascii=False)

    try:
        response = requests.request(method, url, **request_kwargs)
    except requests.exceptions.RequestException as exc:
        return jsonify(ok=False, error=f'Request fallita: {exc}'), 502

    content_type = (response.headers.get('Content-Type') or '').lower()
    body_text = ''
    if 'application/json' in content_type:
        try:
            body_text = json.dumps(response.json(), ensure_ascii=False, indent=2)
        except Exception:
            body_text = response.text
    else:
        body_text = response.text

    max_chars = 200000
    if len(body_text) > max_chars:
        body_text = body_text[:max_chars] + '\n\n...[output troncato]'

    return jsonify(
        ok=True,
        status_code=response.status_code,
        reason=response.reason,
        headers=dict(response.headers),
        body=body_text,
        elapsed_ms=int(response.elapsed.total_seconds() * 1000),
        final_url=response.url,
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
