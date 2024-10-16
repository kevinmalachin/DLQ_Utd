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

// Funzione per estrarre i dettagli del messaggio per la coda prod.emea.plm.product.DLQ
function extractPLMProductDetails(dlqText) {
    const correlationIdMatch = dlqText.match(/"correlationId":\s*"([^\"]+)"/);
    const styleCodeMatch = dlqText.match(/"styleCode":\s*"([^\"]+)"/);
    const launchIdMatch = dlqText.match(/"Launch ID":\s*"([^\"]+)"/);
    const errorCodeMatch = dlqText.match(/"error code":\s*(\d+)/);
    const messageMatch = dlqText.match(/"message":\s*"([^"]+)"/);
    const detailsMatch = dlqText.match(/"details":\s*"([^"]+)"/);

    // Estrazione dei campi aggiuntivi
    const muleErrorTypeMatch = dlqText.match(/"muleErrorType":\s*"([^\"]+)"/);
    const processStepMatch = dlqText.match(/"processStep":\s*"([^\"]+)"/);
    const plmAckMessageMatch = dlqText.match(/"plmAckMessage":\s*"([^\"]+)"/);
    const muleEncodingMatch = dlqText.match(/"MULE_ENCODING":\s*"([^\"]+)"/);
    const pendingShoesLoopMatch = dlqText.match(/"pendingShoesLoop":\s*(\d+)/);
    const plmAckStatusMatch = dlqText.match(/"plmAckStatus":\s*"([^\"]+)"/);
    const errorCategoryMatch = dlqText.match(/"errorCategory":\s*"([^\"]+)"/);
    const muleErrorDescriptionMatch = dlqText.match(/"muleErrorDescription":\s*"([^"]+)"/);

    return {
        correlationId: correlationIdMatch ? correlationIdMatch[1] : "Not found",
        styleCode: styleCodeMatch ? styleCodeMatch[1] : "Not found",
        launchId: launchIdMatch ? launchIdMatch[1] : "Not found",
        errorCode: errorCodeMatch ? errorCodeMatch[1] : "Not found",
        message: messageMatch ? messageMatch[1] : "Not found",
        details: detailsMatch ? detailsMatch[1] : "Not found",
        muleErrorType: muleErrorTypeMatch ? muleErrorTypeMatch[1] : "Not found",
        processStep: processStepMatch ? processStepMatch[1] : "Not found",
        plmAckMessage: plmAckMessageMatch ? plmAckMessageMatch[1] : "Not found",
        muleEncoding: muleEncodingMatch ? muleEncodingMatch[1] : "Not found",
        pendingShoesLoop: pendingShoesLoopMatch ? pendingShoesLoopMatch[1] : "Not found",
        plmAckStatus: plmAckStatusMatch ? plmAckStatusMatch[1] : "Not found",
        errorCategory: errorCategoryMatch ? errorCategoryMatch[1] : "Not found",
        muleErrorDescription: muleErrorDescriptionMatch ? muleErrorDescriptionMatch[1] : "Not found",
    };
}

// Funzione per estrarre i dettagli di asnType, asnId e asnInternalReference per la coda prod.process.goods-receptions.DLQ
function extractGoodsReceptionDetails(dlqText) {
    const asnInternalReferenceMatches = [...dlqText.matchAll(/"asnInternalReference":\s*"([^\"]+)"/g)];

    let references = [];

    for (let i = 0; i < asnInternalReferenceMatches.length; i++) {
        const asnInternalRef = asnInternalReferenceMatches[i][1];
        references.push(asnInternalRef); // Usa solo asnInternalReference
    }

    return references;
}

// Funzione per estrarre i riferimenti con i pattern
function extractReferences(dlqText, patterns) {
    let references = [];

    patterns.forEach(pattern => {
        const matches = [...dlqText.matchAll(pattern)];
        matches.forEach(match => references.push(match[1]));
    });

    return references;
}

// Funzione per contare i riferimenti duplicati
function countReferences(references) {
    const referenceCounts = references.reduce((acc, ref) => {
        acc[ref] = (acc[ref] || 0) + 1;
        return acc;
    }, {});
    return referenceCounts;
}

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

        let references = [];
        let patterns = [];

        switch (true) {
            case /prod\.emea\.plm\.product/.test(currentDLQ):
                const plmDetails = extractPLMProductDetails(dlqText);

                let plmReferences = [];
                let messageCounts = {};
                let matches = [...dlqText.matchAll(/"styleCode":\s*"([^\"]+)"/g)];

                matches.forEach(match => {
                    const ref = match[1];
                    messageCounts[ref] = (messageCounts[ref] || 0) + 1;
                    plmReferences.push(ref);
                });

                results.innerHTML = `
                    <p><strong>Correlation ID:</strong> ${plmDetails.correlationId}</p>
                    <p><strong>Style Code:</strong> ${plmDetails.styleCode}</p>
                    <p><strong>Launch ID:</strong> ${plmDetails.launchId}</p>
                    <p><strong>Error Code:</strong> ${plmDetails.errorCode}</p>
                    <p><strong>Message:</strong> ${plmDetails.message}</p>
                    <p><strong>Details:</strong> ${plmDetails.details}</p>
                    <p><strong>Mule Error Type:</strong> ${plmDetails.muleErrorType}</p>
                    <p><strong>Process Step:</strong> ${plmDetails.processStep}</p>
                    <p><strong>PLM Ack Message:</strong> ${plmDetails.plmAckMessage}</p>
                    <p><strong>MULE Encoding:</strong> ${plmDetails.muleEncoding}</p>
                    <p><strong>Pending Shoes Loop:</strong> ${plmDetails.pendingShoesLoop}</p>
                    <p><strong>PLM Ack Status:</strong> ${plmDetails.plmAckStatus}</p>
                    <p><strong>Error Category:</strong> ${plmDetails.errorCategory}</p>
                    <p><strong>Mule Error Description:</strong> ${plmDetails.muleErrorDescription}</p>
                    <p><strong>Total Messages:</strong> ${plmReferences.length}</p>
                    <ul>
                        ${plmReferences.map(ref => `<li>${ref} (${messageCounts[ref]}x)</li>`).join('')}
                    </ul>
                `;
                return;
            case /prod\.process\.goods-receptions/.test(currentDLQ):
                references = extractGoodsReceptionDetails(dlqText);
                break;
            case /emea\.orderlifecycle\.returnreshipped/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderlifecycle\.DCFulfilmentwms/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /emea\.orderlifecycle\.paymentReversals/.test(currentDLQ):
            case /emea\.orderlifecycle\.cegidexchangeconfirmation/.test(currentDLQ):
            case /emea\.orderlifecycle\.activateQRCode/.test(currentDLQ):
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
            case /prod\.emea\.orderlifecycle\.paymentRefund/.test(currentDLQ):
                patterns = [/\"entityRef\":\s*\"(CM_[^\"]+)\"/g];
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
            case /prod\.emea\.paymentdeposit\.dnofu/.test(currentDLQ):
                patterns = [/\"internalReference\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orderlifecycle\.checkout/.test(currentDLQ):
                patterns = [/\"reference\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.fluent\.returns\.creditmemos/.test(currentDLQ):
            case /prod\.fluent\.returns\.creditmemos/.test(currentDLQ):
                    patterns = [/\"ref\":\s*\"(CM_[^\"]+)\"/g];
                    break;
            case /prod\.emea\.orderlifecycle\.paymentrefundstandalone/.test(currentDLQ):
                    patterns = [/\"entityRef\":\s*\"(CM_[^\"]+)\"/g];
                    break;
            case /prod\.emea\.eboutique\.deposit\.cancel/.test(currentDLQ):
                    patterns = [/\"creditMemoReference\":\s*\"(CM_[^\"]+)\"/g];
                    break;
            case /emea\.orderlifecycle\.fullordercancellation/.test(currentDLQ):
            case /prod\.emea\.orderlifecycle\.sendmailccreminder1/.test(currentDLQ):
            case /prod\.emea\.orderlifecycle\.sendmailccreminder2/.test(currentDLQ):
                patterns = [/\"entityRef\":\s*\"(EC\d+)\"/g];
                break;
            case /prod\.emea\.eboutique\.order/.test(currentDLQ):
                patterns = [/\"externalReference\":\s*\"(EC\d+)\"/g];
                break;
            case /prod\.emea\.storeFactory\.orderFromStore\.sales/.test(currentDLQ):
                patterns = [/\"internalReference\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.usermanagement\.users\.creations/.test(currentDLQ):
                patterns = [/\"iat\":\s*(\d+)/g];
                break;
            case /prod\.emea\.orderlifecycle\.GenerateInvoice/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.fluent\.events\.invoices/.test(currentDLQ):
                patterns = [/\"externalInvoiceId\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orex\.financial-transactions-creation/.test(currentDLQ):
                patterns = [/\"orderRef\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orex\.callback-transfers/.test(currentDLQ):
                patterns = [/\"externalReference\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orex\.orderCreation/.test(currentDLQ):
                patterns = [/\"ref\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orderlifecycle\.sendfulfilltoriskified/.test(currentDLQ):
                patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.plm\.product/.test(currentDLQ):
                patterns = [/\"styleCode\":\s*\"([^\"]+)\"/g];
                break;
            case /prod\.emea\.orex\.inbound\.orderCancelation/.test(currentDLQ):
                patterns = [/\"orderRef\":\s*\"([^\"]+)\"/g];
                break;
                default:
                    console.error("No matching DLQ pattern found.");
                    results.innerHTML = "No matching DLQ pattern found.";
                    return;
            }
    
            // Estrazione riferimenti usando i pattern trovati
        if (patterns.length > 0) {
            references = extractReferences(dlqText, patterns);
        }

        // Filtra le reference che non terminano con "-STD"
        extractedReferences = references.filter(ref => !ref.endsWith("-STD"));

        // Conta i riferimenti duplicati
        const referenceCounts = countReferences(extractedReferences);

        // Visualizzazione dei messaggi con il numero di occorrenze accanto
        let referencesHTML = Object.entries(referenceCounts).map(([ref, count]) => {
            return `<li>${ref} (${count}x)</li>`;
        }).join("");

        results.innerHTML = `
            <p><strong>Extracted References (${extractedReferences.length}):</strong></p>
            <ul>${referencesHTML}</ul>
        `;
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
                body: JSON.stringify({ references: extractedReferences, dlq: currentDLQ }), // Passa anche la DLQ corrente
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