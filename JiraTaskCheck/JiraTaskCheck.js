document.addEventListener("DOMContentLoaded", () => {
    const checkButton = document.getElementById("checkButton");
    const loading = document.getElementById("loading");
    const resultsContainer = document.getElementById("resultsContainer");

    checkButton.addEventListener("click", async () => {
        loading.classList.remove("hidden");
        resultsContainer.innerHTML = "";

        try {
            // Cambiato l'URL per puntare a /check-tasks e metodo GET
            const response = await fetch('http://localhost:5000/check-tasks', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            const data = await response.json();

            if (data.error) {
                resultsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                if (data.results.length === 0) {
                    resultsContainer.innerHTML = "<p>All tasks are correctly configured.</p>";
                } else {
                    data.results.forEach(task => {
                        const taskBox = document.createElement("div");
                        taskBox.classList.add("task-box");
                        taskBox.innerHTML = `
                            <p><strong>Task:</strong> <a href="${task.task_link}" target="_blank">${task.task_name}</a></p>
                            <p><strong>Incident Number:</strong> ${task.incident_number}</p>
                            <p><strong>Customer:</strong> ${task.customer}</p>
                        `;
                        resultsContainer.appendChild(taskBox);
                    });
                }
            }
        } catch (error) {
            resultsContainer.innerHTML = `<p>Error: Unable to fetch tasks. Please try again later.</p>`;
        } finally {
            loading.classList.add("hidden");
        }
    });
});