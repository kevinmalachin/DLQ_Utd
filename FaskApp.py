from flask import Flask, jsonify, request
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# Funzione per cercare incident per le reference in Jira
def find_incidents_in_jira(references):
    jira_url = "https://cap4cloud.atlassian.net/jira/core/projects/IMSL1GEN/list?sortBy=key&direction=ASC"
    response = requests.get(jira_url, auth=('kevin.malachin@cap4lab.com', '@Lilier24per'))  # Inserisci le credenziali corrette
    soup = BeautifulSoup(response.text, 'html.parser')

    # Dizionario per memorizzare le reference e gli incident associati
    reference_incidents = {}

    # Cerca ogni reference nel contenuto della pagina
    for ref in references:
        incident_div = soup.find("div", text=ref)
        if incident_div:
            # Trova l'incident associato (se presente)
            incident = incident_div.find_next("div", {"data-testid": "issue.views.field.single-line-text-inline-edit.read-view.customfield_10111"})
            if incident and "N/A" not in incident.text:
                reference_incidents[ref] = incident.text.strip()
            else:
                reference_incidents[ref] = "NOT REPORTED"
        else:
            reference_incidents[ref] = "NOT REPORTED"

    return reference_incidents

@app.route('/run-script', methods=['POST'])
def run_script():
    references = request.json.get('references', [])
    if not references:
        return jsonify(error="No references provided"), 400

    # Cerca gli incident associati alle reference
    result = find_incidents_in_jira(references)

    # Raggruppa le reference per incident
    grouped_results = {}
    for ref, incident in result.items():
        if incident not in grouped_results:
            grouped_results[incident] = []
        grouped_results[incident].append(ref)

    # Format the output
    output = []
    for incident, refs in grouped_results.items():
        output.append(f"Incident: {incident} -> References: {', '.join(refs)}")

    return jsonify(output=output)

if __name__ == '__main__':
    app.run(debug=True)