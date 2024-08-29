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
            for (const [incident, refs] of Object.entries(output.reported)) {
                refs.forEach(ref => reportedRefs.add(ref.reference));
            }
            reportedRefs.forEach(ref => nonReportedRefs.delete(ref));

            // Organize the references in the output
            let nonReportedText = "Non-reported References:\n";
            nonReportedRefs.forEach(ref => {
                nonReportedText += `- ${ref}\n`;
            });

            let reportedText = "\nReported References:\n";
            for (const [incident, refs] of Object.entries(output.reported)) {
                if (refs.length > 0) {
                    // Add task header and references under the same task
                    reportedText += `**${refs[0].task_name} (${incident})**\n`;
                    refs.forEach(ref => {
                        reportedText += `  - ${ref.reference}\n`;
                    });
                    reportedText += `  <a href="${refs[0].task_link}" target="_blank">Task link</a>\n`;  // Make the task link clickable
                }
            }

            // Display the output
            results.innerHTML = nonReportedText + reportedText;
        } catch (error) {
            console.error('Error during server call:', error);
            results.textContent = "Error during server call.";
        }
    });
}
