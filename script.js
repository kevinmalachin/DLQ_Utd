"use strict";

// Select DOM elements
const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const check = document.querySelector(".Check");

if (!DLQtext || !results || !check) {
    console.error("Elements not found in the page.");
} else {
    check.addEventListener("click", async (e) => {
        e.preventDefault();

        const dlqText = DLQtext.value;

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

        const filteredReferences = combinedReferences.filter(ref => 
            !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(ref) &&
            !/^EC0\d{5}-[A-Z]+$/.test(ref)
        );

        const uniqueReferences = {};
        filteredReferences.forEach((ref) => {
            const baseRef = ref.split("-")[0];
            if (!uniqueReferences[baseRef] || ref.length > uniqueReferences[baseRef].length) {
                uniqueReferences[baseRef] = ref;
            }
        });

        const uniqueReferenceValues = Object.values(uniqueReferences);

        // Display total count of references found
        let totalReferencesCountText = `<p>Total References Found: ${uniqueReferenceValues.length}</p>`;

        try {
            const response = await fetch('http://localhost:5000/run-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ references: uniqueReferenceValues }),
            });

            const data = await response.json();
            const { output } = data;

            const reportedRefs = new Set();
            const nonReportedRefs = new Set(output.non_reported);

            for (const [incident, details] of Object.entries(output.reported)) {
                details.references.forEach(ref => reportedRefs.add(ref));
            }
            reportedRefs.forEach(ref => nonReportedRefs.delete(ref));

            let nonReportedText = `Non-reported References (${output.non_reported.length}):<ul>`;
            console.log("Non-reported references received:", output.non_reported);
            console.log("Reported references received:", Object.keys(output.reported));
            nonReportedRefs.forEach(ref => {
                nonReportedText += `<li>${ref}</li>`;
            });
            nonReportedText += "</ul>";

            let reportedText = `Reported References (${Object.keys(output.reported).length}):<ul>`;
            for (const [incident, details] of Object.entries(output.reported)) {
                if (details.references_count > 0) {
                    const { task_name, task_link, task_status, status_category, references } = details;
                    reportedText += `<li><strong>${incident} - ${task_name} - Status: ${task_status} (${status_category})</strong><ul>`;
                    references.forEach(ref => reportedText += `<li>${ref}</li>`);
                    reportedText += `</ul></li>`;
                }
            }
            reportedText += "</ul>";

            // Display the results including the total count
            results.innerHTML = totalReferencesCountText + nonReportedText + reportedText;

        } catch (error) {
            console.error(error);
            results.innerHTML = "Error: Failed to connect to server.";
        }
    });
}