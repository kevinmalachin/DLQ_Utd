import requests
from requests.auth import HTTPBasicAuth
from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/run-script', methods=['POST'])
def run_script():
    references = request.json.get('references', [])
    if not references:
        return jsonify(error="No references provided"), 400

    search_url = "https://cap4cloud.atlassian.net/rest/api/3/search"

    # Credenziali: username dovrebbe essere l'email, password l'API token
    username = os.getenv('JIRA_USERNAME')  # L'email dell'utente
    password = os.getenv('JIRA_PASSWORD')  # L'API token

    if not username or not password:
        return jsonify(error="JIRA_USERNAME and JIRA_PASSWORD environment variables are required"), 500

    results = []

    for ref in references:
        # Query JQL per cercare nel campo description
        jql_query = f'description ~ "{ref}"'
        search_params = {
            'jql': jql_query,
            'fields': 'key,summary,customfield_10111,description'
        }

        try:
            # Esecuzione della richiesta GET a Jira con autenticazione
            response = requests.get(
                search_url,
                headers={"Accept": "application/json"},
                params=search_params,
                auth=HTTPBasicAuth(username, password)  # Autenticazione tramite username e API token
            )

            # Stampa per debug
            print(f"Request URL: {response.url}")
            print(f"Response Status Code: {response.status_code}")

            # Contenuto della risposta
            response_json = response.json()
            print(f"Response Content: {response_json}")

            # Gestisci errori specifici nel messaggio
            if response.status_code == 400 and 'Field' in response_json.get('errorMessages', [])[0]:
                return jsonify(error="Error: Ensure the field 'description' exists and is accessible with current permissions."), 400

            response.raise_for_status()  # Lancia un errore per status diversi da 200 OK

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
                found = False

                # Verifica che description sia un dizionario valido e cerca la reference al suo interno
                if isinstance(description, dict):
                    for content in description.get("content", []):
                        if content.get("type") == "paragraph":
                            for item in content.get("content", []):
                                if item.get("type") == "text" and ref in item.get("text", ""):
                                    found = True
                                    break
                        if found:
                            break

                results.append({
                    "reference": ref,
                    "incident": incident_number if found else "NOT REPORTED",
                    "task_name": task_name,
                    "task_link": task_link
                })

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to fetch issues containing reference {ref}: {str(e)}")
            results.append({
                "reference": ref,
                "incident": "NOT REPORTED",
                "task_name": "N/A",
                "task_link": None
            })

    # Preparazione dell'output finale
    output = {
        "non_reported": [],
        "reported": {}
    }

    for result in results:
        if result["incident"] == "NOT REPORTED":
            output["non_reported"].append(result["reference"])
        else:
            incident_key = result["incident"]
            if incident_key not in output["reported"]:
                output["reported"][incident_key] = []
            output["reported"][incident_key].append({
                "reference": result["reference"],
                "task_name": result["task_name"],
                "task_link": result["task_link"]
            })

    return jsonify(output=output)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)