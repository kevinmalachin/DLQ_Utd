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
            }
        });

        // Parse the JSON response
        const result = await response.json();
        console.log("API Response:", result); // Debugging log

        // Display the total number of tasks checked in the console
        console.log(`Total tasks checked: ${result.total_tasks_checked}`);

        // Display the results in the UI
        displayResults(result.matched_tasks);
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("resultsContainer").innerHTML = "<p>Error occurred while checking tasks.</p>";
    } finally {
        // Re-enable the button and hide the loading indicator
        this.disabled = false;
        document.getElementById("loading").classList.add("hidden");
    }
});

function displayResults(tasks) {
    const resultsContainer = document.getElementById("resultsContainer");

    if (tasks.length > 0) {
        tasks.forEach((task) => {
            const resultItem = document.createElement("div");
            resultItem.className = "result-item";
            resultItem.innerHTML = `
                <strong>Task Name:</strong> ${task.task_name}<br>
                <strong>Link:</strong> <a href="${task.task_link}" target="_blank">${task.task_link}</a>
            `;
            resultsContainer.appendChild(resultItem);
        });
    } else {
        resultsContainer.innerHTML = "<p>No tasks found that meet the condition.</p>";
    }
}
