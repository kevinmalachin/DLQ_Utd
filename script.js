"use strict";

// Selezione degli elementi DOM
const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const extractButton = document.querySelector(".Extract");
const checkButton = document.querySelector(".Check");

let extractedReferences = [];
let currentDLQ = "";

// Controllo se gli elementi esistono nella pagina
if (!DLQtext || !results || !extractButton || !checkButton) {
    console.error("Elements not found in the page.");
} else {
    // Gestione del click sul bottone "Extract References"
    extractButton.addEventListener("click", (e) => {
        e.preventDefault();

        const dlqText = DLQtext.value;

        // Identifica la DLQ dal testo
        const dlqMatch = dlqText.match(/(\S+)\.DLQ/);
        if (dlqMatch) {
            currentDLQ = dlqMatch[1];
            console.log("Identified DLQ:", currentDLQ);
        } else {
            console.error("No DLQ identified.");
            results.innerHTML = "No DLQ identified in the text.";
            return;
        }

        // Patterns di ricerca basati sulla DLQ
        let patterns = [];
        switch (currentDLQ) {
            case "prod.fluent.returns.creditmemos":
                patterns = [/\"ref\":\s*\"(CM_[^\"]+)\"/g];
                break;
            case "prod.orderlifecycle.sendpartialrefund":
                patterns = [/\"entityRef\":\s*\"(CM_[^\"]+)\"/g];
                break;
            case "prod.process.goods-receptions":
                patterns = [/\"asnType\":\s*\"([A-Z]+)\"/g, /\"asnId\":\s*\"(\d+)\"/g];
                break;
            case "prod.process.generateinvoice":
            case "prod.emea.process.generateinvoice":
                patterns = [/\"internalReference\":\s*\"(EC0[^\"]+)\"/g];
                break;
            case "prod.orderlifecycle.LTReserveFulfilment":
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            default:
                console.error("No matching DLQ pattern found.");
                results.innerHTML = "No matching DLQ pattern found.";
                return;
        }

        let combinedReferences = [];
        if (currentDLQ === "prod.process.goods-receptions") {
            const asnTypeMatches = [...dlqText.matchAll(/\"asnType\":\s*\"([A-Z]+)\"/g)];
            const asnIdMatches = [...dlqText.matchAll(/\"asnId\":\s*\"(\d+)\"/g)];

            if (asnTypeMatches.length > 0) {
                for (let i = 0; i < asnIdMatches.length; i++) {
                    combinedReferences.push(`${asnIdMatches[i][1]} [${asnTypeMatches[i] ? asnTypeMatches[i][1] : "asnType not found"}]`);
                }
            } else {
                // Se non c'è `asnType`, riportiamo solo `asnId` e annotiamo che `asnType` non era presente
                combinedReferences = asnIdMatches.map(match => `${match[1]} [asnType not found]`);
            }
        } else {
            patterns.forEach((pattern) => {
                const matches = [...dlqText.matchAll(pattern)];
                combinedReferences.push(...matches.map((match) => match[1]));
            });
        }

        // Escludi referenze con il suffisso "-STD"
        extractedReferences = [...new Set(combinedReferences)].filter(ref => !ref.endsWith("-STD"));

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

            const reportedRefs = new Set();
            const nonReportedRefs = new Set(output.non_reported);

            for (const [incident, details] of Object.entries(output.reported)) {
                details.references.forEach((ref) => reportedRefs.add(ref));
            }
            reportedRefs.forEach((ref) => nonReportedRefs.delete(ref));

            const totalReferencesCount = extractedReferences.length;
            const reportedCount = reportedRefs.size;
            const nonReportedCount = nonReportedRefs.size;

            let totalReferencesCountText = `<p>Total References Found: ${totalReferencesCount}</p>`;
            totalReferencesCountText += `<p>Non-reported References: ${nonReportedCount}</p>`;
            totalReferencesCountText += `<p>Reported References: ${reportedCount}</p>`;

            let nonReportedText = `Non-reported References (${nonReportedCount}):<ul>`;
            nonReportedRefs.forEach((ref) => {
                nonReportedText += `<li>${ref}</li>`;
            });
            nonReportedText += "</ul>";

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

            results.innerHTML = totalReferencesCountText + nonReportedText + reportedText;
        } catch (error) {
            console.error(error);
            results.innerHTML = "Error: Failed to connect to server.";
        }
    });
}
