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
        jql_query = f'description ~ "{ref}"'
        search_params = {
            'jql': jql_query,
            'fields': 'key,summary,customfield_10111,description,status'
        }

        try:
            response = requests.get(
                search_url,
                headers={"Accept": "application/json"},
                params=search_params,
                auth=HTTPBasicAuth(username, password)
            )

            print(f"Request URL: {response.url}")
            print(f"Response Status Code: {response.status_code}")

            response_json = response.json()
            print(f"Response Content: {response_json}")

            if response.status_code == 400 and 'Field' in response_json.get('errorMessages', [])[0]:
                return jsonify(error="Error: Ensure the field 'description' exists and is accessible with current permissions."), 400

            response.raise_for_status()

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
                status = issue.get("fields", {}).get("status", {}).get("name", "Unknown Status")
                status_category = issue.get("fields", {}).get("status", {}).get("statusCategory", {}).get("name", "Unknown Category")

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
                    "task_link": task_link,
                    "task_status": status,
                    "status_category": status_category
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

    reference_count = {}
    for result in results:
        if result["incident"] == "NOT REPORTED":
            print(f"Adding to non_reported: {result['reference']}")
            ref = result['reference']
            reference_count[ref] = reference_count.get(ref, 0) + 1
            output["non_reported"].append(ref)
        else:
            incident_key = result["incident"]
            if incident_key not in output["reported"]:
                output["reported"][incident_key] = {
                    "task_name": result["task_name"],
                    "task_link": result["task_link"],
                    "task_status": result["task_status"],
                    "status_category": result["status_category"],
                    "references": []
                }
            output["reported"][incident_key]["references"].append(result["reference"])

    # Remove duplicates from non-reported references
    reported_refs_set = set()
    for details in output["reported"].values():
        reported_refs_set.update(details["references"])
    
    # Filter non_reported references to ensure they aren't listed as reported
    output["non_reported"] = list(set(output["non_reported"]) - reported_refs_set)
    print(f"Final non-reported references: {output['non_reported']}")

    output["non_reported_count"] = len(output["non_reported"])
    output["reported_count"] = len(output["reported"])

    for incident_key, details in output["reported"].items():
        details["references_count"] = len(details["references"])

    return jsonify(output=output)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)