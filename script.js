"use strict";

// Selezione degli elementi DOM
const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const extractButton = document.querySelector(".Extract");
const checkButton = document.querySelector(".Check");

let extractedReferences = [];

// Controllo se gli elementi esistono nella pagina
if (!DLQtext || !results || !extractButton || !checkButton) {
    console.error("Elements not found in the page.");
} else {
    // Gestione del click sul bottone "Extract References"
    extractButton.addEventListener("click", (e) => {
        e.preventDefault();

        const dlqText = DLQtext.value;

        const patterns = [
            /"internalReference":\s*"([^"]+)"/g,
            /"entityRef":\s*"([^"]+)"/g,
            /"rootEntityRef":\s*"([^"]+)"/g,
            /"ref":\s*"([^"]+)"/g,
            /"asnId":\s*"([^"]+)"/g,
        ];

        let combinedReferences = [];
        patterns.forEach((pattern) => {
            const matches = [...dlqText.matchAll(pattern)];
            combinedReferences.push(...matches.map((match) => match[1]));
        });

        // Filtraggio delle reference per escludere UUID e alcuni pattern specifici
        const filteredReferences = combinedReferences.filter(
            (ref) =>
                !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(ref) &&
                !/^EC0\d{5}-[A-Z]+$/.test(ref)
        );

        // Rimozione dei duplicati e selezione della reference più lunga
        const uniqueReferences = {};
        filteredReferences.forEach((ref) => {
            const baseRef = ref.split("-")[0];
            if (!uniqueReferences[baseRef] || ref.length > uniqueReferences[baseRef].length) {
                uniqueReferences[baseRef] = ref;
            }
        });

        extractedReferences = Object.values(uniqueReferences);

        // Mostra le reference estratte nella sezione dei risultati
        results.innerHTML = `<p>Extracted References (${extractedReferences.length}):</p><ul>${extractedReferences
            .map((ref) => `<li>${ref}</li>`)
            .join("")}</ul>`;
    });

    // Gestione del click sul bottone "Check Reported References"
    checkButton.addEventListener("click", async (e) => {
        e.preventDefault();

        if (extractedReferences.length === 0) {
            results.innerHTML = "Please extract references first.";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/run-script", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ references: extractedReferences }),
            });

            const data = await response.json();
            const { output } = data;

            // Calcolo del numero di reference riportate e non riportate
            const reportedRefs = new Set();
            const nonReportedRefs = new Set(output.non_reported);

            for (const [incident, details] of Object.entries(output.reported)) {
                details.references.forEach((ref) => reportedRefs.add(ref));
            }
            reportedRefs.forEach((ref) => nonReportedRefs.delete(ref));

            // Contatori totali
            const totalReferencesCount = extractedReferences.length;
            const reportedCount = reportedRefs.size;
            const nonReportedCount = nonReportedRefs.size;

            // Mostra i conteggi totali
            let totalReferencesCountText = `<p>Total References Found: ${totalReferencesCount}</p>`;
            totalReferencesCountText += `<p>Non-reported References: ${nonReportedCount}</p>`;
            totalReferencesCountText += `<p>Reported References: ${reportedCount}</p>`;

            // Mostra le reference non riportate
            let nonReportedText = `Non-reported References (${nonReportedCount}):<ul>`;
            console.log("Non-reported references received:", output.non_reported);
            console.log("Reported references received:", Object.keys(output.reported));
            nonReportedRefs.forEach((ref) => {
                nonReportedText += `<li>${ref}</li>`;
            });
            nonReportedText += "</ul>";

            // Mostra le reference riportate
            let reportedText = `Reported References (${reportedCount}):<ul>`;
            for (const [incident, details] of Object.entries(output.reported)) {
                if (details.references_count > 0) {
                    const { task_name, task_link, task_status, status_category, references } = details;
                    reportedText += `<li><strong><a href="${task_link}" target="_blank">${incident} - ${task_name}</a> - Status: ${task_status} (${status_category})</strong><ul>`;
                    references.forEach((ref) => (reportedText += `<li>${ref}</li>`));
                    reportedText += `</ul></li>`;
                }
            }
            reportedText += "</ul>";

            // Mostra i risultati inclusi i conteggi corretti
            results.innerHTML = totalReferencesCountText + nonReportedText + reportedText;
        } catch (error) {
            console.error(error);
            results.innerHTML = "Error: Failed to connect to server.";
        }
    });
}

// Gestione della visibilità del menu
document.addEventListener("DOMContentLoaded", function () {
    const menuButton = document.getElementById("menuButton");
    const menu = document.getElementById("menu");

    menuButton.addEventListener("click", function () {
        console.log("Menu button clicked"); // Debugging line
        if (menu.classList.contains("hidden")) {
            menu.classList.remove("hidden");
            menu.classList.add("show");
        } else {
            menu.classList.remove("show");
            menu.classList.add("hidden");
        }
        console.log("Menu visibility toggled"); // Debugging line
    });
});