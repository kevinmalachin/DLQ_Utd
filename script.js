"use strict";

// Selezione degli elementi DOM
const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const extractButton = document.querySelector(".Extract");
const checkButton = document.querySelector(".Check");
const menuButton = document.querySelector("#menuButton");
const menu = document.querySelector("#menu");

if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
        menu.classList.toggle("hidden");
    });
} else {
    console.error("Menu or Menu Button not found in the page.");
}

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

        let patterns = [];
        switch (true) {
            case /fluent\.returns\.creditmemos/.test(currentDLQ):
                patterns = [/\"ref\":\s*\"(CM_[^\"]+)\"/g];
                break;
            case /emea\.eboutique\.deposit\.cancel/.test(currentDLQ):
                patterns = [/\"creditMemoReference\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.eboutique\.return-notices/.test(currentDLQ):
                patterns = [/\"externalReference\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderlifecycle\.sendmailccreminder2/.test(currentDLQ):
            case /emea\.orderlifecycle\.sendmailccreminder1/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderlifecycle\.SendASN/.test(currentDLQ):
                patterns = [/\"entityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderlifecycle\.cdc-route/.test(currentDLQ):
                patterns = [/\"internalReference\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderlifecycle\.returnreshipped/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderlifecycle\.paymentReversals/.test(currentDLQ):
                patterns = [/\"entityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderlifecycle\.cscrtsalert/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orderlifecycle\.alf-route/.test(currentDLQ):
                patterns = [
                    /\"externalReference\":\s*\"([^\"]+)\"/g, 
                    /\"internalReference\":\s*\"([^\"]+)\"/g,
                    /\"entityId\":\s*\"([^\"]+)\"/g,
                    /\"storeCode\":\s*\"([^\"]+)\"/g,
                    /\"orderCountryCode\":\s*\"([^\"]+)\"/g
                ];
                break;
            case /apac\.supply\.notifications\.transfer/.test(currentDLQ):
                patterns = [/\"Number\":\s*\"([^\"]+)\"/g];
                break;
            case /apac\.store-factory\.sapNotice/.test(currentDLQ):
                patterns = [/\"DOCNUM\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderFromStore\.availableCustomerOrders\.sac/.test(currentDLQ):
            case /prod\.emea\.store-factory\.orderFromStore\.availableCustomerOrders\.sac/.test(currentDLQ):
            case /prod\.amer\.store-factory\.orderFromStore\.availableCustomerOrders\.sac/.test(currentDLQ):
            case /prod\.apac\.store-factory\.orderFromStore\.availableCustomerOrders\.sac/.test(currentDLQ):
            case /apac\.orderFromStore\.availableCustomerOrders\.sac/.test(currentDLQ):
                patterns = [/\"internalReference\":\s*\"([^\"]+)\"/g];
                break;
            case /orderlifecycle\.sendpartialrefund/.test(currentDLQ):
                patterns = [/\"entityRef\":\s*\"(CM_[^\"]+)\"/g];
                break;
            case /process\.goods-receptions/.test(currentDLQ):
                patterns = [
                    /\"asnType\":\s*\"([A-Z]+)\"/g, 
                    /\"asnId\":\s*\"(\d+)\"/g,
                    /\"asnInternalReference\":\s*\"(\d+)\"/g
                ];
                break;
            case /process\.generateinvoice/.test(currentDLQ):
                patterns = [/\"internalReference\":\s*\"(EC0[^\"]+)\"/g];
                break;
            case /orderlifecycle\.LTReserveFulfilment/.test(currentDLQ):
            case /orderlifecycle\.LTRejectFulfilment/.test(currentDLQ):
            case /orderlifecycle\.LTValidateFulfilment/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"(FR\d+|EC\d+)\"/g];
                break;
            case /emea\.orderlifecycle\.createLabelSAV/.test(currentDLQ):
            case /orderlifecycle\.sendcodrefundcase/.test(currentDLQ):
                patterns = [/\"entityRef\":\s*\"(EC\d+-R\d+)\"/g];
                break;
            case /emea\.m51au\.process/.test(currentDLQ):
            case /apac\.orderlifecycle\.dhl\.kr\.delivery/.test(currentDLQ): 
                patterns = [/\"REFLIV\":\s*\"(EC\d+-\d+)\"/g];
                break;
            case /prod\.emea\.orderlifecycle\.OrderCreation/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"(EC\d+)\"/g];
                break;
            case /emea\.orderlifecycle\.fullordercancellation/.test(currentDLQ):
            case /prod\.emea\.orderlifecycle\.sendmailccreminder1/.test(currentDLQ):
                patterns = [/\"entityRef\":\s*\"(EC\d+)\"/g];
                break;
            case /prod\.emea\.eboutique\.order/.test(currentDLQ):
                patterns = [/\"externalReference\":\s*\"(EC\d+)\"/g];
                break;
            case /prod\.emea\.storeFactory\.orderFromStore\.sales/.test(currentDLQ):
                patterns = [/\"internalReference\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orderlifecycle\.GenerateInvoice/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orex\.financial-transactions-creation/.test(currentDLQ):
                patterns = [/\"orderRef\":\s*\"([^\"]+)\"/g];
                break;
            default:
                console.error("No matching DLQ pattern found.");
                results.innerHTML = "No matching DLQ pattern found.";
                return;
        }

        let combinedReferences = [];
        patterns.forEach((pattern) => {
            const matches = [...dlqText.matchAll(pattern)];
            combinedReferences.push(...matches.map((match) => match[1]));
        });

        extractedReferences = [...new Set(combinedReferences)];
        results.innerHTML = `<p>Extracted References (${extractedReferences.length}):</p><ul>${extractedReferences.map((ref) => `<li>${ref}</li>`).join("")}</ul>`;

        // Contatore dei duplicati
        const duplicateCounts = {};
        patterns.forEach((pattern) => {
            const matches = [...dlqText.matchAll(pattern)].map(match => match[1]);
            matches.forEach((ref) => {
                duplicateCounts[ref] = (duplicateCounts[ref] || 0) + 1;
            });
        });

        const duplicateReferences = Object.entries(duplicateCounts).filter(([ref, count]) => count > 1);

        // Visualizzazione dei duplicati
        let duplicatesText = `<p><strong>Duplicate References Found:</strong></p><ul>`;
        if (duplicateReferences.length > 0) {
            duplicateReferences.forEach(([ref, count]) => {
                duplicatesText += `<li>${ref} - Duplicated ${count} times</li>`;
            });
            duplicatesText += "</ul>";
        } else {
            duplicatesText += "<li>No duplicates found.</li></ul>";
        }
        results.innerHTML += duplicatesText;
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
                    "Content-Type": "application/json"
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

            let totalReferencesCountText = `<p><strong>Total References Found:</strong> ${totalReferencesCount}</p>`;
            totalReferencesCountText += `<p><strong>Reported References:</strong> ${reportedCount}</p>`;
            totalReferencesCountText += `<p><strong>Non-reported References:</strong> ${nonReportedCount}</p>`;

            let nonReportedText = `<p style="color:red;"><strong>Non-reported References (${nonReportedCount}):</strong></p><ul>`;
            nonReportedRefs.forEach((ref) => {
                nonReportedText += `<li style="color:red;"><strong>${ref}</strong></li>`;
            });
            nonReportedText += "</ul>";

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

            results.innerHTML = totalReferencesCountText + reportedText + nonReportedText;
        } catch (error) {
            console.error(error);
            results.innerHTML = "Error: Failed to connect to server.";
        }
    });
}