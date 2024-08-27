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
    
    # Usa variabili d'ambiente per le credenziali
    username = os.getenv('JIRA_USERNAME', 'kevin.malachin@cap4lab.com')
    password = os.getenv('JIRA_PASSWORD', '@Lilier24per')

    try:
        response = requests.get(jira_url, auth=(username, password))
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return jsonify(error=f"Error fetching Jira data: {str(e)}"), 500

    soup = BeautifulSoup(response.text, 'html.parser')
    results = []

    # Cerca ogni reference nel contenuto della pagina Jira
    for ref in references:
        incident_div = soup.find('div', text=ref)
        if incident_div:
            incident = incident_div.find_next('div', {'data-testid': 'issue.views.field.single-line-text-inline-edit.read-view.customfield_10111'})
            if incident and incident.text.startswith('INC'):
                results.append({"reference": ref, "incident": incident.text})
            else:
                results.append({"reference": ref, "incident": "NOT REPORTED"})
        else:
            results.append({"reference": ref, "incident": "NOT REPORTED"})

    return jsonify(output=results)

if __name__ == '__main__':
    app.run(debug=True)