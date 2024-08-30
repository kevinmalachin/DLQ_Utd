def run_script():
    references = request.json.get('references', [])
    if not references:
        app.logger.debug("No references provided in the request.")
        return jsonify(error="No references provided"), 400

    app.logger.debug(f"Received references: {references}")
    search_url = "https://cap4cloud.atlassian.net/rest/api/3/search"
    username = credentials['JIRA_USERNAME']
    password = credentials['JIRA_PASSWORD']

    results = []

    # Iterate over each reference to search in Jira
    for ref in references:
        jql_query = f'description ~ "{ref}"'
        app.logger.debug(f"Running JQL query: {jql_query}")

        search_params = {
            'jql': jql_query,
            'fields': 'key,summary,customfield_10111,customfield_10112,status'
        }

        try:
            response = requests.get(
                search_url,
                headers={"Accept": "application/json"},
                params=search_params,
                auth=HTTPBasicAuth(username, password)
            )

            app.logger.debug(f"Response Status Code: {response.status_code}")
            response_json = response.json()
            app.logger.debug(f"Response Content: {response_json}")

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
                customfield_10111 = issue.get("fields", {}).get("customfield_10111", "N/A")
                customfield_10112 = issue.get("fields", {}).get("customfield_10112", {}).get("value", "")
                status = issue.get("fields", {}).get("status", {}).get("name", "Unknown Status")
                status_category = issue.get("fields", {}).get("status", {}).get("statusCategory", {}).get("name", "Unknown Category")

                # Check if `customfield_10111` is "N/A"
                if customfield_10111 == "N/A" and customfield_10112 in ["MMS-ESCALATED-L3", "MMS-E2E", "MMS-CONTRIBUTED"]:
                    task_link = f"https://cap4cloud.atlassian.net/browse/{task_name}"
                    results.append({
                        "reference": ref,
                        "incident": customfield_10111,
                        "task_name": task_name,
                        "task_link": task_link,
                        "task_status": status,
                        "status_category": status_category
                    })

        except requests.exceptions.RequestException as e:
            app.logger.error(f"Request failed: {e}")
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

    # Organize results by incident number
    for result in results:
        if result["incident"] == "N/A":
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

    output["non_reported_count"] = len(output["non_reported"])
    output["reported_count"] = len(output["reported"])

    for incident_key, details in output["reported"].items():
        details["references_count"] = len(details["references"])

    return jsonify(output=output)
