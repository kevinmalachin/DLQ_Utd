import requests
from requests.auth import HTTPBasicAuth
from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

def search_text_recursively(content, ref):
    """ Recursive function to search for a reference in the nested content structure """
    if isinstance(content, list):
        for item in content:
            if search_text_recursively(item, ref):
                return True
    elif isinstance(content, dict):
        if content.get("type") == "text" and ref in content.get("text", ""):
            return True
        if "content" in content:
            return search_text_recursively(content["content"], ref)
    return False

@app.route('/run-script', methods=['POST'])
def run_script():
    references = request.json.get('references', [])
    dlq = request.json.get('dlq', '')  # Assumi che la DLQ venga passata dal frontend
    if not references:
        return jsonify(error="No references provided"), 400

    search_url = "https://cap4cloud.atlassian.net/rest/api/3/search"
    username = os.getenv('JIRA_USERNAME')
    password = os.getenv('JIRA_PASSWORD')

    if not username or not password:
        return jsonify(error="JIRA_USERNAME and JIRA_PASSWORD environment variables are required"), 500

    results = []

    for ref in references:
        # Se la coda è goods-receptions, usa asnInternalReference per il controllo
        if 'goods-receptions' in dlq:
            jql_query = f'description ~ "{ref}"'
        else:
            # Per tutte le altre code usa la logica esistente
            jql_query = f'description ~ "{ref}"'

        search_params = {
            'jql': jql_query,
            'fields': 'key,summary,customfield_10111,description,status,customfield_10124'
        }

        try:
            response = requests.get(
                search_url,
                headers={"Accept": "application/json"},
                params=search_params,
                auth=HTTPBasicAuth(username, password)
            )

            response_json = response.json()
            issues = response_json.get("issues", [])

            if not issues:
                results.append({
                    "reference": ref,
                    "incident": "NOT REPORTED",
                    "task_name": "N/A",
                    "task_link": None
                })
                continue

            for issue in issues:
                task_name = issue.get("key", "Task Not Found")
                incident_number = issue.get("fields", {}).get("customfield_10111", "NOT REPORTED")
                task_link = f"https://cap4cloud.atlassian.net/browse/{task_name}"
                description = issue.get("fields", {}).get("description", {})

                # Corretta assegnazione dello stato
                status = issue.get("fields", {}).get("status", {}).get("name", "Unknown Status")
                status_category = issue.get("fields", {}).get("status", {}).get("statusCategory", {}).get("name", "Unknown Category")

                # Assegna il summary della task
                summary = issue.get("fields", {}).get("summary", "No Summary")

                customer_field = issue.get("fields", {}).get("customfield_10124", [])
                customer_value = customer_field[0].get("value", "Unknown Customer") if customer_field else "Unknown Customer"

                found = False
                if isinstance(description, dict):
                    found = search_text_recursively(description.get("content", []), ref)

                task_data = {
                    "reference": ref,
                    "incident": incident_number if found else "NOT REPORTED",
                    "task_name": task_name,
                    "summary": summary,  # Include the summary in the response
                    "task_link": task_link,
                    "task_status": status,  # Usa direttamente il nome dello stato
                    "status_category": status_category,
                    "customer": customer_value
                }

                results.append(task_data)

        except requests.exceptions.RequestException as e:
            results.append({
                "reference": ref,
                "incident": "NOT REPORTED",
                "task_name": "N/A",
                "task_link": None
            })

    output = {
        "non_reported": [],
        "reported": {},
        "different_customers": []  # Per memorizzare i task con customer diverso
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)