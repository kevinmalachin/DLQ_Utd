document.getElementById("checkButton").addEventListener("click", async function () {
    // Disable the button and show the loading indicator
    this.disabled = true;
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("resultsContainer").innerHTML = "";

    try {
        // Make the API call to your Flask backend
        const response = await fetch("http://localhost:5000/run-script", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                references: ["Task 1", "Task 2"] // Example data, replace with actual references
            })
        });

        // Parse the JSON response
        const result = await response.json();
        console.log("API Response:", result); // Debugging log

        // Display the results
        displayResults(result.output);
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("resultsContainer").innerHTML = "<p>Error occurred while checking tasks.</p>";
    } finally {
        // Re-enable the button and hide the loading indicator
        this.disabled = false;
        document.getElementById("loading").classList.add("hidden");
    }
});

function displayResults(data) {
    const resultsContainer = document.getElementById("resultsContainer");

    // Checking and displaying tasks with values other than "N/A"
    if (data.reported_count > 0) {
        data.reported.forEach((incident) => {
            if (incident.incident !== "N/A") {
                const resultItem = document.createElement("div");
                resultItem.className = "result-item";
                resultItem.innerHTML = `
                    <strong>Task Name:</strong> ${incident.task_name}<br>
                    <strong>Incident:</strong> ${incident.incident}<br>
                    <strong>Status:</strong> ${incident.task_status}<br>
                    <strong>Category:</strong> ${incident.status_category}<br>
                    <strong>References:</strong> ${incident.references ? incident.references.join(", ") : "None"}<br>
                    <strong>Link:</strong> <a href="${incident.task_link}" target="_blank">${incident.task_link}</a>
                `;
                resultsContainer.appendChild(resultItem);
            }
        });
    } else {
        resultsContainer.innerHTML = "<p>No tasks found with values other than 'N/A'.</p>";
    }
}