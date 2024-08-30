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

            // Calculate reported and non-reported counts
            const reportedRefs = new Set();
            const nonReportedRefs = new Set(output.non_reported);

            for (const [incident, details] of Object.entries(output.reported)) {
                details.references.forEach(ref => reportedRefs.add(ref));
            }
            reportedRefs.forEach(ref => nonReportedRefs.delete(ref));

            // Total counts
            const totalReferencesCount = uniqueReferenceValues.length;
            const reportedCount = reportedRefs.size;
            const nonReportedCount = nonReportedRefs.size;

            // Display counts
            let totalReferencesCountText = `<p>Total References Found: ${totalReferencesCount}</p>`;
            totalReferencesCountText += `<p>Non-reported References: ${nonReportedCount}</p>`;
            totalReferencesCountText += `<p>Reported References: ${reportedCount}</p>`;

            // Display non-reported references
            let nonReportedText = `Non-reported References (${nonReportedCount}):<ul>`;
            console.log("Non-reported references received:", output.non_reported);
            console.log("Reported references received:", Object.keys(output.reported));
            nonReportedRefs.forEach(ref => {
                nonReportedText += `<li>${ref}</li>`;
            });
            nonReportedText += "</ul>";

            // Display reported references
            let reportedText = `Reported References (${reportedCount}):<ul>`;
            for (const [incident, details] of Object.entries(output.reported)) {
                if (details.references_count > 0) {
                    const { task_name, task_link, task_status, status_category, references } = details;
                    reportedText += `<li><strong><a href="${task_link}" target="_blank">${incident} - ${task_name}</a> - Status: ${task_status} (${status_category})</strong><ul>`;
                    references.forEach(ref => reportedText += `<li>${ref}</li>`);
                    reportedText += `</ul></li>`;
                }
            }
            reportedText += "</ul>";

            // Display the results including the correct counts
            results.innerHTML = totalReferencesCountText + nonReportedText + reportedText;

        } catch (error) {
            console.error(error);
            results.innerHTML = "Error: Failed to connect to server.";
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const menuButton = document.getElementById('menuButton');
    const menu = document.getElementById('menu');

    menuButton.addEventListener('click', function () {
        console.log('Menu button clicked'); // Debugging line
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            menu.classList.add('show');
        } else {
            menu.classList.remove('show');
            menu.classList.add('hidden');
        }
        console.log('Menu visibility toggled'); // Debugging line
    });
});