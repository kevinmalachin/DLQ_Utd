from flask import Flask, jsonify, request
from requests.auth import HTTPBasicAuth
import requests
import os
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS for all origins
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/run-script', methods=['POST'])
def run_script():
    try:
        # JIRA credentials from environment variables
        search_url = "https://cap4cloud.atlassian.net/rest/api/3/search"
        username = os.getenv('JIRA_USERNAME')
        password = os.getenv('JIRA_PASSWORD')

        if not username or not password:
            return jsonify(error="JIRA_USERNAME and JIRA_PASSWORD environment variables are required"), 500

        # JQL to select all tasks with the escalation field "MMS-ESCALATED-L3"
        jql_query = '"customfield_10112" = "MMS-ESCALATED-L3"'
        search_params = {
            'jql': jql_query,
            'fields': 'key,customfield_10111,customfield_10141',
            'maxResults': 100000  # Retrieve a large number of tasks
        }

        try:
            # Perform the API call to JIRA
            response = requests.get(
                search_url,
                headers={"Accept": "application/json"},
                params=search_params,
                auth=HTTPBasicAuth(username, password)
            )

            if response.status_code != 200:
                return jsonify(error="Error fetching data from JIRA API", status_code=response.status_code), response.status_code

            # Extract the tasks
            issues = response.json().get("issues", [])
            total_tasks_checked = len(issues)
            matched_tasks = []

            # Log how many tasks were checked
            print(f"Total tasks checked in JIRA: {total_tasks_checked}")

            for issue in issues:
                incident_number = issue.get("fields", {}).get("customfield_10111", "N/A")
                escalation_value = issue.get("fields", {}).get("customfield_10141", {}).get("value", "N/A")

                # Add task to matched list if it meets the condition
                if incident_number == "N/A" and escalation_value == "MMS-ESCALATED-L3":
                    task_name = issue.get("key", "Task Not Found")
                    task_link = f"https://cap4cloud.atlassian.net/browse/{task_name}"
                    matched_tasks.append({
                        "task_name": task_name,
                        "task_link": task_link
                    })

            # Return the matched tasks and the total number of tasks checked
            return jsonify(matched_tasks=matched_tasks, total_tasks_checked=total_tasks_checked)

        except requests.exceptions.RequestException as e:
            return jsonify(error=f"Failed to fetch issues: {str(e)}"), 500

    except Exception as e:
        return jsonify(error=f"An unexpected error occurred: {str(e)}"), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
