"use strict";

// Select DOM elements
const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const check = document.querySelector(".Check");

// Check if elements are found
if (!DLQtext || !results || !check) {
    console.error("Elements not found in the page.");
} else {
    check.addEventListener("click", async (e) => {
        e.preventDefault();

        const dlqText = DLQtext.value;

        // Patterns to find references in the DLQ text
        const patterns = [
            /"internalReference":\s*"([^"]+)"/g,
            /"entityRef":\s*"([^"]+)"/g,
            /"rootEntityRef":\s*"([^"]+)"/g,
            /"ref":\s*"([^"]+)"/g,
            /"asnId":\s*"([^"]+)"/g
        ];

        let combinedReferences = [];
        patterns.forEach(pattern => {
            const matches = [...dlqText.matchAll(pattern)];
            combinedReferences.push(...matches.map(match => match[1]));
        });

        // Filter out unwanted references
        const filteredReferences = combinedReferences.filter(ref => 
            !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(ref) &&
            !/^EC0\d{5}-[A-Z]+$/.test(ref)
        );

        // Deduplicate and normalize references
        const uniqueReferences = {};
        filteredReferences.forEach((ref) => {
            const baseRef = ref.split("-")[0];
            if (!uniqueReferences[baseRef] || ref.length > uniqueReferences[baseRef].length) {
                uniqueReferences[baseRef] = ref;
            }
        });

        const uniqueReferenceValues = Object.values(uniqueReferences);

        try {
            // Make a POST request to the Flask server
            const response = await fetch('http://localhost:5000/run-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ references: uniqueReferenceValues }),
            });

            const data = await response.json();
            const { output } = data;

            // Create sets to avoid duplicates
            const reportedRefs = new Set();
            const nonReportedRefs = new Set(output.non_reported);

            // Add reported references to the set and remove them from non-reported
            for (const [incident, details] of Object.entries(output.reported)) {
                details.references.forEach(ref => reportedRefs.add(ref));
            }
            reportedRefs.forEach(ref => nonReportedRefs.delete(ref));

            // Organize the references in the output
            let nonReportedText = `Non-reported References (${output.non_reported_count}):<ul>`;
            nonReportedRefs.forEach(ref => {
                nonReportedText += `<li>${ref}</li>`;
            });
            nonReportedText += "</ul>";

            let reportedText = `Reported References (${output.reported_count}):<ul>`;
            for (const [incident, details] of Object.entries(output.reported)) {
                if (details.references_count > 0) {
                    // Make the task name a clickable link, include status and status category
                    const { task_name, task_link, task_status, status_category } = details;
                    reportedText += `<li><a href="${task_link}" target="_blank"><strong>${task_name} (${incident})</strong></a> - Status: ${task_status} (${status_category}) (${details.references_count})<ul>`;
                    details.references.forEach(ref => {
                        reportedText += `<li>${ref}</li>`;
                    });
                    reportedText += "</ul></li>";
                }
            }
            reportedText += "</ul>";

            // Update the HTML with the results
            results.innerHTML = nonReportedText + reportedText;

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    });
}