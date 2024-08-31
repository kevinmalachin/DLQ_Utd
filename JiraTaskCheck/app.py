import requests
from requests.auth import HTTPBasicAuth
from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/check-tasks', methods=['GET'])
def check_tasks():
    search_url = "https://cap4cloud.atlassian.net/rest/api/3/search"

    # Recupero delle credenziali da variabili di ambiente
    username = os.getenv('JIRA_USERNAME')
    password = os.getenv('JIRA_PASSWORD')

    if not username or not password:
        return jsonify(error="JIRA_USERNAME and JIRA_PASSWORD environment variables are required"), 500

    # JQL query: sostituire 'IMSL1GEN' con il project key corretto
    jql_query = 'project = IMSL1GEN'  # Assicurati che questa sia la key corretta del progetto

    # Impostazione dei parametri di ricerca
    search_params = {
        'jql': jql_query,
        'fields': 'key,summary,customfield_10111,customfield_10124'  # Aggiunto customfield_10124 per customer
    }

    try:
        # Effettua la chiamata API a JIRA
        response = requests.get(
            search_url,
            headers={"Accept": "application/json"},
            params=search_params,
            auth=HTTPBasicAuth(username, password)
        )

        # Controlla eventuali errori nella risposta
        response.raise_for_status()

        # Recupera le issue dalla risposta
        issues = response.json().get("issues", [])

        # Se non ci sono issue, logghiamo un messaggio per confermare il risultato
        if not issues:
            return jsonify(message="No issues found for the specified project key."), 200

        results = []

        # Controllo della validità dell'incident number in base al customer
        for issue in issues:
            task_key = issue.get("key", "Unknown Task")
            task_link = f"https://cap4cloud.atlassian.net/browse/{task_key}"
            incident_number = issue.get("fields", {}).get("customfield_10111", "N/A")
            summary = issue.get("fields", {}).get("summary", "No Summary Available")

            # Recupera il customer dal campo specifico (non usare il sommario per determinare il customer)
            customer_field = issue.get("fields", {}).get("customfield_10124", [])
            customer = customer_field[0].get("value", "Unknown") if customer_field else "Unknown"

            # Report delle task con incident diverso da "N/A"
            if incident_number != "N/A":
                # Check sulla validità dell'incident number
                if not validate_incident_number(customer, incident_number):
                    results.append({
                        "task_name": task_key,
                        "task_link": task_link,
                        "incident_number": incident_number,
                        "customer": customer
                    })

        # Se nessun task è stato trovato con errori nell'incident number
        if not results:
            return jsonify(message="All tasks are correctly configured."), 200

        return jsonify(results=results)

    except requests.exceptions.HTTPError as http_err:
        # Log del contenuto della risposta per capire cosa sta succedendo
        error_details = response.json().get('errorMessages', ['Unknown error'])
        return jsonify(error=f"HTTP error occurred: {http_err}, Details: {error_details}"), 500
    except requests.exceptions.RequestException as e:
        # Gestione degli errori di connessione e restituzione del messaggio d'errore
        return jsonify(error=f"Failed to connect to JIRA: {e}"), 500


def validate_incident_number(customer, incident_number):
    """
    Valida la lunghezza del numero dell'incidente in base al customer.
    """
    if customer == "DIOR01MMS" and len(incident_number) != 9:
        return False
    elif customer == "TFNY01MMS" and len(incident_number) != 11:
        return False
    elif customer == "FSTR01MMS" and len(incident_number) != 12:
        return False
    return True


def get_project_keys():
    """
    Recupera e stampa i project keys disponibili per il tuo account JIRA.
    """
    project_url = "https://cap4cloud.atlassian.net/rest/api/3/project"
    username = os.getenv('JIRA_USERNAME')
    password = os.getenv('JIRA_PASSWORD')

    try:
        response = requests.get(
            project_url,
            headers={"Accept": "application/json"},
            auth=HTTPBasicAuth(username, password)
        )

        response.raise_for_status()
        projects = response.json()
        print("Available Projects and Keys:")
        for project in projects:
            print(f"Project Name: {project['name']}, Key: {project['key']}")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching project keys: {e}")


if __name__ == '__main__':
    # Puoi chiamare questa funzione per verificare quali project key sono disponibili
    # get_project_keys()

    app.run(host='0.0.0.0', port=5000, debug=True)