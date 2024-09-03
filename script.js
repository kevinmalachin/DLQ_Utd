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

    // Identifica la DLQ dal testo con riconoscimento flessibile degli ambienti
    const dlqMatch = dlqText.match(/(\S+)\.DLQ/);
    if (dlqMatch) {
        currentDLQ = dlqMatch[1];
        console.log("Identified DLQ:", currentDLQ);
    } else {
        console.error("No DLQ identified.");
        results.innerHTML = "No DLQ identified in the text.";
        return;
    }

    // Definizione delle parti comuni delle DLQ per gli ambienti diversi
    const dlqPatterns = {
        "fluent.returns.creditmemos": [/\"ref\":\s*\"(CM_[^\"]+)\"/g],
        "orderlifecycle.sendpartialrefund": [/\"entityRef\":\s*\"(CM_[^\"]+)\"/g],
        "process.goods-receptions": [/\"asnType\":\s*\"([A-Z]+)\"/g, /\"asnId\":\s*\"(\d+)\"/g],
        "process.generateinvoice": [/\"internalReference\":\s*\"(EC0[^\"]+)\"/g],
        "orderlifecycle.LTReserveFulfilment": [/\"rootEntityRef\":\s*\"(FR\d+|EC\d+)\"/g],
        "orderlifecycle.LTRejectFulfilment": [/\"rootEntityRef\":\s*\"(FR\d+|EC\d+)\"/g],
        "orderlifecycle.LTValidateFulfilment": [/\"rootEntityRef\":\s*\"(FR\d+|EC\d+)\"/g],
        "emea.orderlifecycle.createLabelSAV": [/\"entityRef\":\s*\"(EC\d+-R\d+)\"/g],
        "emea.m51au.process": [/\"REFLIV\":\s*\"(EC\d+-\d+)\"/g],
        "emea.eboutique.order": [/\"externalReference\":\s*\"(EC\d+)\"/g],
    };

    // Estrai la parte comune ignorando l'ambiente
    const commonPattern = Object.keys(dlqPatterns).find(pattern => currentDLQ.includes(pattern));

    if (!commonPattern) {
        console.error("No matching DLQ pattern found.");
        results.innerHTML = "No matching DLQ pattern found.";
        return;
    }

    let patterns = dlqPatterns[commonPattern];

    // Logica per combinare riferimenti (modifiche non necessarie qui)
    let combinedReferences = [];
    if (currentDLQ.includes("goods-receptions")) {
        const asnTypeMatches = [...dlqText.matchAll(/\"asnType\":\s*\"([A-Z]+)\"/g)];
        const asnIdMatches = [...dlqText.matchAll(/\"asnId\":\s*\"(\d+)\"/g)];

        if (asnTypeMatches.length > 0) {
            for (let i = 0; i < asnIdMatches.length; i++) {
                combinedReferences.push(`${asnIdMatches[i][1]} [${asnTypeMatches[i] ? asnTypeMatches[i][1] : "asnType not found"}]`);
            }
        } else {
            combinedReferences = asnIdMatches.map(match => `${match[1]} [asnType not found]`);
        }
    } else {
        patterns.forEach((pattern) => {
            const matches = [...dlqText.matchAll(pattern)];
            combinedReferences.push(...matches.map((match) => match[1]));
        });
    }

    // Filtra ed escludi referenze con il suffisso "-STD"
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

            // Conta totale delle referenze
            const totalReferencesCount = extractedReferences.length;
            const reportedCount = reportedRefs.size;
            const nonReportedCount = nonReportedRefs.size;

            // Output delle referenze totali, riportate e non riportate
            let totalReferencesCountText = `<p><strong>Total References Found:</strong> ${totalReferencesCount}</p>`;
            totalReferencesCountText += `<p><strong>Reported References:</strong> ${reportedCount}</p>`;
            totalReferencesCountText += `<p><strong>Non-reported References:</strong> ${nonReportedCount}</p>`;

            // Mostra referenze non riportate in rosso grassetto
            let nonReportedText = `<p style="color:red;"><strong>Non-reported References (${nonReportedCount}):</strong></p><ul>`;
            nonReportedRefs.forEach((ref) => {
                nonReportedText += `<li style="color:red;"><strong>${ref}</strong></li>`;
            });
            nonReportedText += "</ul>";

            // Mostra referenze riportate con i dettagli della task in verde grassetto
            let reportedText = `<p style="color:green;"><strong>Reported References (${reportedCount}):</strong></p><ul>`;
            for (const [incident, details] of Object.entries(output.reported)) {
                if (details.references_count > 0) {
                    reportedText += `<li style="color:green;"><strong><a href="${details.task_link}" target="_blank">${incident} - ${details.task_name}</a></strong>`;
                    reportedText += ` - Summary: ${details.summary} - Status: ${details.task_status} (${details.status_category})<ul>`;
                    details.references.forEach((ref) => {
                        reportedText += `<li style="color:green;"><strong>${ref}</strong></li>`;
                    });
                    reportedText += `</ul></li>`;
                }
            }
            reportedText += "</ul>";

            // Unisci il tutto nel div dei risultati
            results.innerHTML = totalReferencesCountText + reportedText + nonReportedText;
        } catch (error) {
            console.error(error);
            results.innerHTML = "Error: Failed to connect to server.";
        }
    });
}
