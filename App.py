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

    username = os.getenv('JIRA_USERNAME')
    password = os.getenv('JIRA_PASSWORD')

    if not username or not password:
        return jsonify(error="JIRA_USERNAME and JIRA_PASSWORD environment variables are required"), 500

    results = []

    for ref in references:
        jql_query = f"description ~ \"{ref}\""
        search_params = {
            'jql': jql_query,
            'fields': 'key,summary,customfield_10111,description'
        }

        try:
            response = requests.get(search_url, headers={"Accept": "application/json"}, params=search_params, auth=HTTPBasicAuth(username, password))
            response.raise_for_status()
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
                incident_number = issue.get("fields", {}).get("customfield_10111", "NOT REPORTED")
                task_link = f"https://cap4cloud.atlassian.net/browse/{task_name}"
                description = issue.get("fields", {}).get("description", {})
                found = False

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