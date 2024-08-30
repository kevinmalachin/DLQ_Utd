from flask import Flask, jsonify, request
from requests.auth import HTTPBasicAuth
import requests
import os
from flask_cors import CORS

app = Flask(__name__)

# Configura CORS in modo più specifico se necessario
CORS(app, resources={r"/*": {"origins": "*"}})  # Permette richieste da qualsiasi origine

@app.route('/run-script', methods=['POST'])
def run_script():
    try:
        references = request.json.get('references', [])
        if not references:
            return jsonify(error="No references provided"), 400

        search_url = "https://cap4cloud.atlassian.net/rest/api/3/search"
        username = os.getenv('JIRA_USERNAME')
        password = os.getenv('JIRA_PASSWORD')

        if not username or not password:
            return jsonify(error="JIRA_USERNAME and JIRA_PASSWORD environment variables are required"), 500

        results = []

        for ref in references:
            jql_query = f'description ~ "{ref}" AND "customfield_10112" = "MMS-ESCALATED-L3"'
            search_params = {
                'jql': jql_query,
                'fields': 'key,summary,customfield_10111,customfield_10112,customfield_10141,customfield_10124,status'
            }

            try:
                response = requests.get(
                    search_url,
                    headers={"Accept": "application/json"},
                    params=search_params,
                    auth=HTTPBasicAuth(username, password)
                )

                # Verifica se la risposta è valida
                if response.status_code != 200:
                    return jsonify(error="Error fetching data from JIRA API", status_code=response.status_code), response.status_code

                issues = response.json().get("issues", [])

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
                    task_link = f"https://cap4cloud.atlassian.net/browse/{task_name}"
                    incident_number = issue.get("fields", {}).get("customfield_10111", "N/A")
                    status = issue.get("fields", {}).get("status", {}).get("name", "Unknown Status")
                    status_category = issue.get("fields", {}).get("status", {}).get("statusCategory", {}).get("name", "Unknown Category")
                    customer_field = issue.get("fields", {}).get("customfield_10124", [])
                    customer_names = [customer.get("value") for customer in customer_field if customer.get("value")]
                    customer_name = customer_names[0] if customer_names else "Unknown Customer"
                    
                    # Aggiungi il controllo per customfield_10141
                    escalation_value = issue.get("fields", {}).get("customfield_10141", {}).get("value", "N/A")

                    # Evidenzia il task se incident_number o escalation_value sono "N/A"
                    highlight = (incident_number == "N/A" or escalation_value == "N/A")

                    results.append({
                        "reference": ref,
                        "incident": incident_number,
                        "task_name": task_name,
                        "task_link": task_link,
                        "task_status": status,
                        "status_category": status_category,
                        "customer_name": customer_name,
                        "highlight": highlight
                    })

            except requests.exceptions.RequestException as e:
                # Gestione dell'errore di richiesta con log dettagliato
                return jsonify(error=f"Failed to fetch issues: {str(e)}"), 500

        output = {
            "reported": [result for result in results if result["highlight"]],
            "non_reported": [result for result in results if not result["highlight"]],
            "non_reported_count": sum(1 for result in results if not result["highlight"]),
            "reported_count": sum(1 for result in results if result["highlight"])
        }

        return jsonify(output=output)

    except Exception as e:
        # Logga errori inaspettati e restituisci un messaggio d'errore al client
        return jsonify(error=f"An unexpected error occurred: {str(e)}"), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)