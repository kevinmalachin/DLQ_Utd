"use strict";

// Selezione degli elementi DOM
const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const extractButton = document.querySelector(".Extract");
const checkButton = document.querySelector(".Check");
const menuButton = document.querySelector("#menuButton");
const menu = document.querySelector("#menu");
const themeToggle = document.querySelector("#themeToggle");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });
} else {
  console.error("Menu or Menu Button not found in the page.");
}


function applyTheme(theme) {
  const targetTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", targetTheme);

  if (themeToggle) {
    const isDark = targetTheme === "dark";
    themeToggle.textContent = isDark ? "Tema: Dark" : "Tema: Chiaro";
    themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  }
}

(function initTheme() {
  let savedTheme = "light";
  try {
    const stored = window.localStorage.getItem("dlq-theme");
    if (stored === "dark" || stored === "light") {
      savedTheme = stored;
    }
  } catch (_) {
    savedTheme = "light";
  }

  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        window.localStorage.setItem("dlq-theme", next);
      } catch (_) {
        // Ignore localStorage errors in restricted browser contexts.
      }
    });
  }
})();

let extractedReferences = [];
let currentDLQ = "";
let nonReportedReferences = [];
let dlqName = "";

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
  const muleErrorDescriptionMatch = dlqText.match(
    /"muleErrorDescription":\s*"([^"]+)"/
  );

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
    pendingShoesLoop: pendingShoesLoopMatch
      ? pendingShoesLoopMatch[1]
      : "Not found",
    plmAckStatus: plmAckStatusMatch ? plmAckStatusMatch[1] : "Not found",
    errorCategory: errorCategoryMatch ? errorCategoryMatch[1] : "Not found",
    muleErrorDescription: muleErrorDescriptionMatch
      ? muleErrorDescriptionMatch[1]
      : "Not found",
  };
}

// Funzione per estrarre i dettagli per goods-receptions
function extractGoodsReceptionDetails(dlqText) {
  const asnInternalReferenceMatches = [
    ...dlqText.matchAll(/"asnInternalReference":\s*"([^\"]+)"/g),
  ];
  let references = [];
  for (let i = 0; i < asnInternalReferenceMatches.length; i++) {
    const asnInternalRef = asnInternalReferenceMatches[i][1];
    references.push(asnInternalRef);
  }
  return references;
}

// Funzione per estrarre i riferimenti con i pattern
function extractReferences(dlqText, patterns) {
  let references = [];
  patterns.forEach((pattern) => {
    const matches = [...dlqText.matchAll(pattern)];
    matches.forEach((match) => references.push(match[1]));
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

    const dlqTextRaw = DLQtext.value;
    const dlqTextNorm = dlqTextRaw
      .normalize("NFKC")
      .replace(/[\u2010-\u2015\u2212\u00AD\uFE58\uFE63\uFF0D]/g, "-")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ");
    const dlqText = dlqTextRaw;

    // Identifica la DLQ dal testo (supporta -dlq-, .dlq, suffissi -prd/-prod, maiuscole/minuscole)
    const dlqMatch =
      dlqTextNorm.match(/([A-Za-z0-9._-]*dlq[._-]?(?:prd|prod)?)/i) ||
      dlqTextNorm.match(/(\S+)\.DLQ/); // fallback legacy
    if (!dlqMatch) {
      console.error("No DLQ identified.");
      results.innerHTML = "No DLQ identified in the text.";
      return;
    }

    // DLQ come appare nel testo (con i '-')
    currentDLQ = dlqMatch[1].trim();

    // Normalizza per i match regex (tratta '-' e '_' come '.')
    const currentDLQNorm = currentDLQ.replace(/[-_]/g, ".").toLowerCase();
    const currentDLQRaw = currentDLQ.toLowerCase();

    // helper: prova a matchare sia sulla versione normalizzata (.) che su quella raw (-/_)
    const tiffMatch = (re) => re.test(currentDLQNorm) || re.test(currentDLQRaw);

    console.log("Identified DLQ RAW:", currentDLQ);
    console.log("Identified DLQ NORM:", currentDLQNorm);

    let references = [];
    let patterns = [];

    switch (true) {
      // PLM product
      case /prod\.emea\.plm\.product/.test(currentDLQNorm): {
        const plmDetails = extractPLMProductDetails(dlqText);

        let plmReferences = [];
        let messageCounts = {};
        let matches = [...dlqText.matchAll(/"styleCode":\s*"([^\"]+)"/g)];

        matches.forEach((match) => {
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
            ${plmReferences.map((ref) => `<li>${ref} (${messageCounts[ref]}x)</li>`).join("")}
          </ul>
        `;
        return;
      }

      // Goods receptions
      case /prod\.process\.goods\.receptions/.test(currentDLQNorm):
      case /prod\.emea\.process\.goods\.receptions/.test(currentDLQNorm):
        references = extractGoodsReceptionDetails(dlqText);
        break;

      // Vari rootEntityRef
      case /emea\.orderlifecycle\.returnreshipped/.test(currentDLQNorm):
      case /emea\.orderlifecycle\.sendfullcancellationtoriskified/.test(currentDLQNorm):
      case /emea\.orderlifecycle\.dcfulfilmentwms/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.generateinvoice/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.sendfulfilltoriskified/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.dcshipauthrcu/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.sendm06/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.sendm50/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.createcrossborderorder/.test(currentDLQNorm):
        patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
        break;

      // entityRef
      case /emea\.orderlifecycle\.paymentreversals/.test(currentDLQNorm):
      case /emea\.orderlifecycle\.cegidexchangeconfirmation/.test(currentDLQNorm):
      case /emea\.orderlifecycle\.activateqrcode/.test(currentDLQNorm):
      case /emea\.orderlifecycle\.cscrtsalert/.test(currentDLQNorm):
      case /emea\.orderlifecycle\.depositrefundsuccess/.test(currentDLQNorm):
        patterns = [/\"entityRef\":\s*\"([^\"]+)\"/g];
        break;

      // alf-route
      case /prod\.emea\.orderlifecycle\.alf[._-]route/.test(currentDLQNorm):
        patterns = [
          /\"internalReference\":\s*\"([^\"]+)\"/g,
        ];
        break;

      // altri pattern
      case /apac\.supply\.notifications\.transfer/.test(currentDLQNorm):
        patterns = [/\"Number\":\s*\"([^\"]+)\"/g];
        break;

      case /emea\.eboutique\.return\.receipt/.test(currentDLQNorm):
        patterns = [/\"returnNoticeExternalReference\":\s*\"([^\"]+)\"/g];
        break;

      case /apac\.store\.factory\.sapnotice/.test(currentDLQNorm):
      case /apac\.sap\.outbound\-delivery\.wtms\-supply/.test(currentDLQNorm):
        patterns = [/\"DOCNUM\":\s*\"([^\"]+)\"/g];
        break;

      case /emea\.orderfromstore\.availablecustomerorders\.sac/.test(currentDLQNorm):
      case /prod\.emea\.store\.factory\.orderfromstore\.availablecustomerorders\.sac/.test(currentDLQNorm):
      case /prod\.amer\.store\.factory\.orderfromstore\.availablecustomerorders\.sac/.test(currentDLQNorm):
      case /prod\.apac\.store\.factory\.orderfromstore\.availablecustomerorders\.sac/.test(currentDLQNorm):
      case /apac\.orderfromstore\.availablecustomerorders\.sac/.test(currentDLQNorm):
      case /prod\.emea\.paymentdeposit\.dnofu/.test(currentDLQNorm):
      case /prod\.emea\.storefactory\.orderfromstore\.sales/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.cdc\-route/.test(currentDLQNorm):
      case /prod\.amer\.storefactory\.orderfromstore\.sales/.test(currentDLQNorm):
      case /prod\.amer\.orex\.store\-factory\-customerorders\-ordered/.test(currentDLQNorm):
      case /prod\.apac\.orex\.store\-factory\-customerorders\-ordered/.test(currentDLQNorm):
      case /prod\.apac\.orex\.store\-factory\-sales/.test(currentDLQNorm):
      case /prod\.apac\.sap\.point\-of\-sales\.erp\-transaction/.test(currentDLQNorm):
      case /prod\.apac\.sap\.good\-receipt\.erp\-supply/.test(currentDLQNorm):
      case /prod\.apac\.sap\.store\-transfert\.erp\-supply/.test(currentDLQNorm):
        patterns = [/\"internalReference\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.apac\.storefactory\.orderfromstore\.sales/.test(currentDLQNorm):
        patterns = [/\"followUpReference\":\s*\"([^\"]+)\"/g];
        break;

      case /orderlifecycle\.sendpartialrefund/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.paymentrefund/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.paymentrefundstandalone/.test(currentDLQNorm):
        patterns = [/\"entityRef\":\s*\"(CM_[^\"]+)\"/g];
        break;

      case /process\.generateinvoice/.test(currentDLQNorm):
        patterns = [/\"internalReference\":\s*\"(EC0[^\"]+)\"/g];
        break;

      case /orderlifecycle\.ltreservefulfilment/.test(currentDLQNorm):
      case /orderlifecycle\.ltrejectfulfilment/.test(currentDLQNorm):
      case /orderlifecycle\.ltvalidatefulfilment/.test(currentDLQNorm):
        patterns = [/\"rootEntityRef\":\s*\"(FR\d+|EC\d+)\"/g];
        break;

      case /emea\.orderlifecycle\.createlabelsav/.test(currentDLQNorm):
      case /orderlifecycle\.sendcodrefundcase/.test(currentDLQNorm):
        patterns = [/\"entityRef\":\s*\"(EC\d+-R\d+)\"/g];
        break;

      case /emea\.m51au\.process/.test(currentDLQNorm):
      case /apac\.orderlifecycle\.dhl\.kr\.delivery/.test(currentDLQNorm):
        patterns = [/\"REFLIV\":\s*\"(EC\d+-\d+)\"/g];
        break;

      case /amer\.orderlifecycle\.stellae\.us\.delivery/.test(currentDLQNorm):
        patterns = [/\"REFLIV\":\s*\"([^\"]+)\"/g];
        break;

      case /emea\.plm\.livecycle\.style\.notifications/.test(currentDLQNorm):
        patterns = [/\"cnl\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.orderlifecycle\.ordercreation/.test(currentDLQNorm):
        patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.orderlifecycle\.checkout/.test(currentDLQNorm):
        patterns = [/\"reference\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.orderlifecycle\.massrecalcaftercontrolupdateforlocation/.test(currentDLQNorm):
        patterns = [/\"batchId\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.products\.pdh\.messages/.test(currentDLQNorm):
        patterns = [/\"codeStyle\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.orderlifecycle\.blr\-route/.test(currentDLQNorm):
        patterns = [/\"creditMemoRef\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.hed\.diorstar\.orders/.test(currentDLQNorm):
        patterns = [/\"quoteId\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.orex\.return\-order\-creation/.test(currentDLQNorm):
        patterns = [/\"orderReference\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.fluent\.returns\.creditmemos/.test(currentDLQNorm):
      case /prod\.fluent\.returns\.creditmemos/.test(currentDLQNorm):
        patterns = [/\"ref\":\s*\"(CM_[^\"]+)\"/g];
        break;

      case /prod\.emea\.eboutique\.deposit\.cancel/.test(currentDLQNorm):
      case /prod\.emea\.store\-factory\.orderfromstore\.sales\.ffa/.test(currentDLQNorm):
        patterns = [/\"creditMemoReference\":\s*\"(CM_[^\"]+)\"/g];
        break;

      case /prod\.emea\.orex\.long\-tail\-receptions/.test(currentDLQNorm):
        patterns = [/\"orderIncrementId\":\s*\"([^\"]+)\"/g];
        break;

      case /emea\.orderlifecycle\.fullordercancellation/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.sendmailccreminder1/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.sendmailccreminder2/.test(currentDLQNorm):
      case /prod\.emea\.orderlifecycle\.sendemailconfirmation/.test(currentDLQNorm):
        patterns = [/\"entityRef\":\s*\"(EC\d+)\"/g];
        break;

      case /prod\.emea\.eboutique\.order/.test(currentDLQNorm):
        patterns = [/\"externalReference\":\s*\"(EC\d+)\"/g];
        break;

      case /prod\.emea\.cim\.outbound\.messages\.ciam/.test(currentDLQNorm):
        patterns = [/\"gc_id\"\s*:\s*\"([a-f0-9\-]+)\"/g];
        break;

      case /prod\.emea\.usermanagement\.users\.creations/.test(currentDLQNorm):
        patterns = [/\"iat\":\s*(\d+)/g];
        break;

      case /prod\.emea\.fluent\.events\.invoices/.test(currentDLQNorm):
        patterns = [/\"externalInvoiceId\":\s*\"([^\"]+)\"/g];
        break;
      case /prod\.emea\.cjb\.outbound\.sfmc\.japan/.test(currentDLQNorm):
        patterns = [/\"number\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.orex\.financial\-transactions\-creation/.test(currentDLQNorm):
      case /prod\.emea\.orex\.inbound\.ordercancelation/.test(currentDLQNorm):
        patterns = [/\"orderRef\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.orex\.callback\-transfers/.test(currentDLQNorm):
      case /prod\.emea\.eboutique\.return\-notices/.test(currentDLQNorm):
      case /prod\.emea\.eboutique\.exchanges/.test(currentDLQNorm):
      case /prod\.emea\.eboutique\.close\-stock\-reservation/.test(currentDLQNorm):
        patterns = [/\"externalReference\":\s*\"([^\"]+)\"/g];
        break;

      case /prod\.emea\.orex\.ordercreation/.test(currentDLQNorm):
        patterns = [/\"ref\":\s*\"([^\"]+)\"/g];
        break;

      // =========================
      // ===== TIFFANY queues ====
      // =========================

      // fileName
      case tiffMatch(/tco\.rar\.archive\.files\.queue\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"fileName\":\s*\"([^\"]+)\"/g];
        break;

      // C00-
      case tiffMatch(/tco\.rar\.shipment\.queue\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"C001\":\s*\"([^\"]+)\"/g];
        break;

      // BillToID
      case tiffMatch(/tco\.rar\.orders\.release\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.rar\.create\.orders\.with\.deposit\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.rar\.order\.transfer\.notice\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.rar\.orders\.allocation\.queue\.dlq(?:\.prd|\.prod)?/i):
      patterns = [/\"BillToID\":\s*\"([^\"]+)\"/g];
        break;


      // OrderNo
      case tiffMatch(/tco\.rar\.tax\.release\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.rar\.oms\.retail\.invoice\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.oms\.order\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.oms\.invoice\.resa\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.oms\.invoice\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.oms\.order\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/tco\.rar\.oms\.retail\.order\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i): // da controllare se ha OrderNo
        patterns = [/\"OrderNo\":\s*\"([^\"]+)\"/g];
        break;

      // C03
      case tiffMatch(/tco\.rar\.sales\.history\.queue\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"C03\":\s*\"([^\"]+)\"/g];
        break;

      // InvoiceNo
      case tiffMatch(/tco\.rar\.invoice\.creation\.queue\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"InvoiceNo\":\s*\"([^\"]+)\"/g];
        break;

      // ControlNumber
      case tiffMatch(/sys\.inv\.kdc\.esb\.shipstatus\.dgm\.dlq(?:\.prd|\.prod)?/i):
      case tiffMatch(/sys\.inv\.3pl\.esb\.reccon\.dgm\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"ControlNumber\":\s*\"([^\"]+)\"/g];
        break;

      // tco-rar-tax-update-queue-dlq-prd – InvoiceNo + FlowId + FlowName
      case tiffMatch(/tco[.\-]rar[.\-]tax[.\-]update[.\-]queue[.\-]dlq(?:[.\-](?:prd|prod))?/i): {
        // InvoiceNo (usato come reference principale verso Jira)
        const invoiceMatches = [...dlqText.matchAll(/"InvoiceNo":\s*"([^"]+)"/g)];
        const flowIdMatches  = [...dlqText.matchAll(/"FlowId":\s*"([^"]+)"/g)];
        const flowNameMatches = [...dlqText.matchAll(/"FlowName":\s*"([^"]+)"/g)];

        const rows = [];

        const len = Math.max(
          invoiceMatches.length,
          flowIdMatches.length,
          flowNameMatches.length
        );

        for (let i = 0; i < len; i++) {
          const inv   = invoiceMatches[i]?.[1] || "N/A";
          const fid   = flowIdMatches[i]?.[1] || "N/A";
          const fname = flowNameMatches[i]?.[1] || "N/A";
          rows.push({ invoice: inv, flowId: fid, flowName: fname });
        }

        // references che usiamo per il check su Jira
        extractedReferences = rows
          .map((r) => r.invoice)
          .filter((v) => v && !v.endsWith("-STD"));

        const referenceCounts = countReferences(extractedReferences);

        // tabella leggibile
        const tableRows = rows
          .map(
            (r) => `
            <tr>
              <td>${r.invoice}</td>
              <td>${r.flowId}</td>
              <td>${r.flowName}</td>
            </tr>`
          )
          .join("");

        const referencesHTML = Object.entries(referenceCounts)
          .map(([ref, count]) => `<li>${ref} (${count}x)</li>`)
          .join("");

        results.innerHTML = `
          <p><strong>DLQ:</strong> ${currentDLQ}</p>
          <p><strong>Invoice / FlowId / FlowName (${rows.length} messages):</strong></p>
          <table border="1" cellpadding="4" cellspacing="0">
            <thead>
              <tr>
                <th>InvoiceNo</th>
                <th>FlowId</th>
                <th>FlowName</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <p><strong>References (per Jira, deduplicate):</strong></p>
          <ul>${referencesHTML}</ul>
        `;
        return;
      }

      default:
        console.error("No matching DLQ pattern found for:", currentDLQ, "| norm:", currentDLQRaw);
        results.innerHTML = "No matching DLQ pattern found.";
        return;
    }

    // Estrazione riferimenti usando i pattern trovati
    if (patterns.length > 0) {
      references = extractReferences(dlqText, patterns);
    }

    // Filtra le reference che non terminano con "-STD"
    extractedReferences = references.filter((ref) => !ref.endsWith("-STD"));

    // Conta i riferimenti duplicati
    const referenceCounts = countReferences(extractedReferences);

    // Visualizzazione dei messaggi con il numero di occorrenze accanto
    let referencesHTML = Object.entries(referenceCounts)
      .map(([ref, count]) => `<li>${ref} (${count}x)</li>`)
      .join("");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          references: extractedReferences,
          dlq: currentDLQ,
        }),
      });

      const data = await response.json();
      const { output } = data;

      dlqName = (output && output.dlq) || currentDLQ || "Unknown Queue";
      nonReportedReferences = Array.from(new Set((output && output.non_reported) || []));

      const reportedRefs = new Set();
      const reportedMap = new Map(); // ref -> array di task che la citano

      Object.entries(output.reported || {}).forEach(([incident, details]) => {
        const taskInfo = {
          incident,
          taskName: details.task_name,
          taskLink: details.task_link,
          summary: details.summary,
          taskStatus: details.task_status,
          statusCategory: details.status_category,
        };

        (details.references || []).forEach((ref) => {
          reportedRefs.add(ref);
          if (!reportedMap.has(ref)) reportedMap.set(ref, []);
          const bucket = reportedMap.get(ref);
          const already = bucket.some((t) => t.taskLink === taskInfo.taskLink);
          if (!already) bucket.push(taskInfo);
        });
      });

      const totalReferencesCount = extractedReferences.length;
      const reportedCount = reportedRefs.size;
      const nonReportedCount = nonReportedReferences.length;

      const dlqLabel = dlqName || currentDLQ || "Unknown Queue";

      const summaryHtml = [
        `<p><strong>DLQ:</strong> ${dlqLabel}</p>`,
        `<p><strong>Total References Found:</strong> ${totalReferencesCount}</p>`,
        `<p style="color:green;"><strong>Reported References:</strong> ${reportedCount}</p>`,
        `<p style="color:red;"><strong>Non-reported References:</strong> ${nonReportedCount}</p>`,
      ].join("");

      const statusClass = (t) => {
        const st = (t.taskStatus || "").toLowerCase();
        const cat = (t.statusCategory || "").toLowerCase();
        if (st.includes("archived") || st.includes("done") || cat.includes("done")) return "status-done";
        if (st.includes("pending")) return "status-pending";
        return "status-other";
      };

      let reportedText = `<div class="reported-block"><p style="color:green;"><strong>Reported References (${reportedCount}):</strong></p>`;
      if (reportedRefs.size === 0) {
        reportedText += "<p>None.</p>";
      } else {
        reportedText += "<ul>";
        reportedMap.forEach((tasks, ref) => {
          const tasksList = tasks
            .map((t) => {
              const cls = statusClass(t);
              return `<li class="${cls}"><a href="${t.taskLink}" target="_blank">${t.incident} - ${t.taskName}</a> - ${t.summary} (Status: ${t.taskStatus} / ${t.statusCategory})</li>`;
            })
            .join("");
          reportedText += `<li><strong>${ref}</strong><ul>${tasksList}</ul></li>`;
        });
        reportedText += "</ul>";
      }
      reportedText += "</div>";

      let nonReportedText = `<div class="non-reported-block"><p style="color:red;"><strong>Non-reported References (${nonReportedCount}):</strong></p>`;
      if (nonReportedReferences.length === 0) {
        nonReportedText += "<p>None.</p>";
      } else {
        const nonRepList = nonReportedReferences
          .map((ref) => `<li style="color:red;"><strong>${ref}</strong></li>`)
          .join("");
        nonReportedText += `<ul>${nonRepList}</ul>`;
      }
      nonReportedText += "</div>";

      results.innerHTML = summaryHtml + reportedText + nonReportedText;
    } catch (error) {
      console.error(error);
      results.innerHTML = "Error: Failed to connect to server.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const createTicketButton = document.querySelector(".CreateTicket");
  const ticketSection = document.querySelector(".TicketSection");
  const shortDescriptionInput = document.querySelector("#shortDescription");
  const descriptionTextarea = document.querySelector("#description");

  if (createTicketButton && ticketSection && shortDescriptionInput && descriptionTextarea) {
    createTicketButton.addEventListener("click", () => {
      if (nonReportedReferences.length === 0) {
        console.log("No non-reported references found. Please run Check first.");
        return;
      }

      // Mostra la sezione "Create Ticket"
      ticketSection.classList.toggle("hidden");

      const dlqLabel = dlqName || currentDLQ || "Unknown Queue";

      // Short Description
      shortDescriptionInput.value = `[Monitor Alert][messages blocked in DLQ Mulesoft][C2] ${dlqLabel}`;

      // Description template
      const descriptionTemplate = `
Name of the DLQ: ${dlqLabel}
Number of messages in the DLQ: ${nonReportedReferences.length}

Ref:
${nonReportedReferences.join("\n")}


Event ID:
Time Stamp (CET):
Application name:

MuleSoft Log error:



Action(s) taken until now:
 - Replay of the queue;
 - Analysis of the logs;

Action to be taken (If possible):
Dear team,
Could you kindly check these orders and update us if we can remove from the DLQ?
Thank you very much!
`.trim();

      descriptionTextarea.value = descriptionTemplate;
    });
  } else {
    console.error("Create Ticket button, TicketSection, or input fields not found.");
  }
});
