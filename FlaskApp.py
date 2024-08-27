from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import os

app = Flask(__name__)
CORS(app)

@app.route('/run-script', methods=['POST'])
def run_script():
    references = request.json.get('references', [])
    if not references:
        return jsonify(error="No references provided"), 400

    jira_url = "https://cap4cloud.atlassian.net/jira/core/projects/IMSL1GEN/list?sortBy=key&direction=ASC"
    
    username = os.getenv('JIRA_USERNAME', 'kevin.malachin@cap4lab.com')
    password = os.getenv('JIRA_PASSWORD', '@Lilier24per')

    try:
        response = requests.get(jira_url, auth=(username, password))
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return jsonify(error=f"Error fetching Jira data: {str(e)}"), 500

    soup = BeautifulSoup(response.text, 'html.parser')
    results = []

    for ref in references:
        # Cerca il div che contiene la reference specificata
        incident_div = soup.find('div', text=ref)
        if incident_div:
            # Trova l'incidente associato, se disponibile
            incident = incident_div.find_next('div', {'data-testid': 'issue.views.field.single-line-text-inline-edit.read-view.customfield_10111'})
            
            # Trova il nome della task Jira associata
            task_name_element = incident_div.find_next('span', class_='css-1gd7hga')
            task_name = task_name_element.text if task_name_element else "Task Not Found"
            
            # Costruisci l'URL della task Jira
            task_link = f"https://cap4cloud.atlassian.net/browse/{task_name}" if task_name != "Task Not Found" else None

            if incident and incident.text.startswith('INC'):
                results.append({
                    "reference": ref,
                    "incident": incident.text,
                    "task_name": task_name,
                    "task_link": task_link
                })
            else:
                results.append({
                    "reference": ref,
                    "incident": "NOT REPORTED",
                    "task_name": "N/A",
                    "task_link": None
                })
        else:
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