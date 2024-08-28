import requests
from requests.auth import HTTPBasicAuth
from flask import Flask, jsonify, request
from flask_cors import CORS
import os

# Debug per verificare il caricamento delle variabili
os.environ['JIRA_USERNAME'] = 'Kevin.malachin@cap4lab.com'
os.environ['JIRA_PASSWORD'] = '@Lilier24per'

# Stampa di debug per confermare
print(f"DEBUG: JIRA_USERNAME: {os.getenv('JIRA_USERNAME')}")
print(f"DEBUG: JIRA_PASSWORD: {os.getenv('JIRA_PASSWORD')}")


app = Flask(__name__)
CORS(app)

@app.route('/run-script', methods=['POST'])
def run_script():
    references = request.json.get('references', [])
    if not references:
        return jsonify(error="No references provided"), 400

    # URL di base per le API di Jira
    base_url = "https://cap4cloud.atlassian.net/rest/api/3/issue/{key}"
    
    # Usa variabili d'ambiente per le credenziali
    username = os.getenv('JIRA_USERNAME')
    password = os.getenv('JIRA_PASSWORD')

    if not username or not password:
        return jsonify(error="JIRA_USERNAME and JIRA_PASSWORD environment variables are required"), 500

    results = []

    for ref in references:
        issue_key = ref  # Supponiamo che la reference sia una chiave di issue
        url = base_url.format(key=issue_key)  # Costruisci l'URL corretto

        try:
            response = requests.get(url, auth=HTTPBasicAuth(username, password))
            response.raise_for_status()
            data = response.json()

            # Estrazione del nome della task e dell'incident number
            task_name = data.get("key", "Task Not Found")
            incident_number = data.get("fields", {}).get("customfield_10111", "NOT REPORTED")

            # Estrazione della description per trovare le references
            description = data.get("fields", {}).get("description", {})

            # Trova la reference nella descrizione
            found = False
            for content in description.get("content", []):
                if content.get("type") == "paragraph":
                    for item in content.get("content", []):
                        if item.get("type") == "text":
                            text = item.get("text", "")
                            if ref in text:
                                found = True
                                break

            # Costruisci l'URL della task Jira
            task_link = f"https://cap4cloud.atlassian.net/browse/{task_name}" if task_name != "Task Not Found" else None

            results.append({
                "reference": ref,
                "incident": incident_number if found else "NOT REPORTED",
                "task_name": task_name,
                "task_link": task_link
            })

        except requests.exceptions.RequestException as e:
            results.append({
                "reference": ref,
                "incident": "NOT REPORTED",
                "task_name": "N/A",
                "task_link": None
            })

    # Organizza l'output come richiesto
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
    app.run(debug=True)

# Debug finale per assicurarsi che le variabili siano caricate
print(f"DEBUG: Username (outside function): {os.getenv('JIRA_USERNAME')}")
print(f"DEBUG: Password (outside function): {os.getenv('JIRA_PASSWORD')}")