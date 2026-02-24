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

    // helper: rende i separatori (., -, _) equivalenti nei regex DLQ
    const dlqRegexCache = new Map();
    const buildDlqRegex = (re) => {
      const cacheKey = `${re.source}__${re.flags}`;
      if (dlqRegexCache.has(cacheKey)) return dlqRegexCache.get(cacheKey);

      let out = "";
      let inClass = false;

      for (let i = 0; i < re.source.length; i++) {
        const ch = re.source[i];

        if (ch === "\\") {
          const next = re.source[i + 1];
          if (!inClass && (next === "." || next === "-")) {
            out += "[._-]";
            i++;
            continue;
          }
          out += ch + (next || "");
          i++;
          continue;
        }

        if (ch === "[") {
          inClass = true;
          out += ch;
          continue;
        }

        if (ch === "]") {
          inClass = false;
          out += ch;
          continue;
        }

        if (!inClass && ch === "_") {
          out += "[._-]";
          continue;
        }

        out += ch;
      }

      const safeFlags = re.flags.replace(/[gy]/g, "");
      const compiled = new RegExp(out, safeFlags);
      dlqRegexCache.set(cacheKey, compiled);
      return compiled;
    };

    const dlqNameMatch = (re) => buildDlqRegex(re).test(currentDLQRaw);
    const tiffMatch = dlqNameMatch; // backward compatibility con i case esistenti

    console.log("Identified DLQ RAW:", currentDLQ);
    console.log("Identified DLQ NORM:", currentDLQNorm);

    let references = [];
    let patterns = [];

    switch (true) {
      // PLM product
      case dlqNameMatch(/prod\.emea\.plm\.product/): {
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
      case dlqNameMatch(/prod\.process\.goods\.receptions/):
      case dlqNameMatch(/prod\.emea\.process\.goods\.receptions/):
        references = extractGoodsReceptionDetails(dlqText);
        break;

      // Vari rootEntityRef
      case dlqNameMatch(/emea\.orderlifecycle\.returnreshipped/):
      case dlqNameMatch(/emea\.orderlifecycle\.sendfullcancellationtoriskified/):
      case dlqNameMatch(/emea\.orderlifecycle\.dcfulfilmentwms/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.generateinvoice/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.sendfulfilltoriskified/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.dcshipauthrcu/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.sendm06/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.sendm50/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.createcrossborderorder/):
        patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
        break;

      // entityRef
      case dlqNameMatch(/emea\.orderlifecycle\.paymentreversals/):
      case dlqNameMatch(/emea\.orderlifecycle\.cegidexchangeconfirmation/):
      case dlqNameMatch(/emea\.orderlifecycle\.activateqrcode/):
      case dlqNameMatch(/emea\.orderlifecycle\.cscrtsalert/):
      case dlqNameMatch(/emea\.orderlifecycle\.depositrefundsuccess/):
        patterns = [/\"entityRef\":\s*\"([^\"]+)\"/g];
        break;

      // alf-route
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.alf[._-]route/):
        patterns = [
          /\"internalReference\":\s*\"([^\"]+)\"/g,
        ];
        break;

      // altri pattern
      case dlqNameMatch(/apac\.supply\.notifications\.transfer/):
        patterns = [/\"Number\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/emea\.eboutique\.return\.receipt/):
        patterns = [/\"returnNoticeExternalReference\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/apac\.store\.factory\.sapnotice/):
      case dlqNameMatch(/apac\.sap\.outbound\-delivery\.wtms\-supply/):
        patterns = [/\"DOCNUM\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/emea\.orderfromstore\.availablecustomerorders\.sac/):
      case dlqNameMatch(/prod\.emea\.store\.factory\.orderfromstore\.availablecustomerorders\.sac/):
      case dlqNameMatch(/prod\.amer\.store\.factory\.orderfromstore\.availablecustomerorders\.sac/):
      case dlqNameMatch(/prod\.apac\.store\.factory\.orderfromstore\.availablecustomerorders\.sac/):
      case dlqNameMatch(/apac\.orderfromstore\.availablecustomerorders\.sac/):
      case dlqNameMatch(/prod\.emea\.paymentdeposit\.dnofu/):
      case dlqNameMatch(/prod\.emea\.storefactory\.orderfromstore\.sales/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.cdc\-route/):
      case dlqNameMatch(/prod\.amer\.storefactory\.orderfromstore\.sales/):
      case dlqNameMatch(/prod\.amer\.orex\.store\-factory\-customerorders\-ordered/):
      case dlqNameMatch(/prod\.apac\.orex\.store\-factory\-customerorders\-ordered/):
      case dlqNameMatch(/prod\.apac\.orex\.store\-factory\-sales/):
      case dlqNameMatch(/prod\.apac\.sap\.point\-of\-sales\.erp\-transaction/):
      case dlqNameMatch(/prod\.apac\.sap\.good\-receipt\.erp\-supply/):
      case dlqNameMatch(/prod\.apac\.sap\.store\-transfert\.erp\-supply/):
        patterns = [/\"internalReference\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.apac\.storefactory\.orderfromstore\.sales/):
        patterns = [/\"followUpReference\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/orderlifecycle\.sendpartialrefund/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.paymentrefund/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.paymentrefundstandalone/):
        patterns = [/\"entityRef\":\s*\"(CM_[^\"]+)\"/g];
        break;

      case dlqNameMatch(/process\.generateinvoice/):
        patterns = [/\"internalReference\":\s*\"(EC0[^\"]+)\"/g];
        break;

      case dlqNameMatch(/orderlifecycle\.ltreservefulfilment/):
      case dlqNameMatch(/orderlifecycle\.ltrejectfulfilment/):
      case dlqNameMatch(/orderlifecycle\.ltvalidatefulfilment/):
        patterns = [/\"rootEntityRef\":\s*\"(FR\d+|EC\d+)\"/g];
        break;

      case dlqNameMatch(/emea\.orderlifecycle\.createlabelsav/):
      case dlqNameMatch(/orderlifecycle\.sendcodrefundcase/):
        patterns = [/\"entityRef\":\s*\"(EC\d+-R\d+)\"/g];
        break;

      case dlqNameMatch(/emea\.m51au\.process/):
      case dlqNameMatch(/apac\.orderlifecycle\.dhl\.kr\.delivery/):
        patterns = [/\"REFLIV\":\s*\"(EC\d+-\d+)\"/g];
        break;

      case dlqNameMatch(/amer\.orderlifecycle\.stellae\.us\.delivery/):
        patterns = [/\"REFLIV\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/emea\.plm\.livecycle\.style\.notifications/):
        patterns = [/\"cnl\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orderlifecycle\.ordercreation/):
        patterns = [/\"rootEntityRef\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orderlifecycle\.checkout/):
        patterns = [/\"reference\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orderlifecycle\.massrecalcaftercontrolupdateforlocation/):
        patterns = [/\"batchId\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.products\.pdh\.messages/):
        patterns = [/\"codeStyle\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orderlifecycle\.blr\-route/):
        patterns = [/\"creditMemoRef\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.hed\.diorstar\.orders/):
        patterns = [/\"quoteId\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orex\.return\-order\-creation/):
        patterns = [/\"orderReference\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.fluent\.returns\.creditmemos/):
      case dlqNameMatch(/prod\.fluent\.returns\.creditmemos/):
        patterns = [/\"ref\":\s*\"(CM_[^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.eboutique\.deposit\.cancel/):
      case dlqNameMatch(/prod\.emea\.store\-factory\.orderfromstore\.sales\.ffa/):
        patterns = [/\"creditMemoReference\":\s*\"(CM_[^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orex\.long\-tail\-receptions/):
        patterns = [/\"orderIncrementId\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/emea\.orderlifecycle\.fullordercancellation/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.sendmailccreminder1/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.sendmailccreminder2/):
      case dlqNameMatch(/prod\.emea\.orderlifecycle\.sendemailconfirmation/):
        patterns = [/\"entityRef\":\s*\"(EC\d+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.eboutique\.order/):
        patterns = [/\"externalReference\":\s*\"(EC\d+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.cim\.outbound\.messages\.ciam/):
        patterns = [/\"gc_id\"\s*:\s*\"([a-f0-9\-]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.usermanagement\.users\.creations/):
        patterns = [/\"iat\":\s*(\d+)/g];
        break;

      case dlqNameMatch(/prod\.emea\.fluent\.events\.invoices/):
        patterns = [/\"externalInvoiceId\":\s*\"([^\"]+)\"/g];
        break;
      case dlqNameMatch(/prod\.emea\.cjb\.outbound\.sfmc\.japan/):
        patterns = [/\"number\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orex\.financial\-transactions\-creation/):
      case dlqNameMatch(/prod\.emea\.orex\.inbound\.ordercancelation/):
        patterns = [/\"orderRef\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orex\.callback\-transfers/):
      case dlqNameMatch(/prod\.emea\.eboutique\.return\-notices/):
      case dlqNameMatch(/prod\.emea\.eboutique\.exchanges/):
      case dlqNameMatch(/prod\.emea\.eboutique\.close\-stock\-reservation/):
        patterns = [/\"externalReference\":\s*\"([^\"]+)\"/g];
        break;

      case dlqNameMatch(/prod\.emea\.orex\.ordercreation/):
        patterns = [/\"ref\":\s*\"([^\"]+)\"/g];
        break;

      // =========================
      // ===== TIFFANY queues ====
      // =========================

      // fileName
      case dlqNameMatch(/tco\.rar\.archive\.files\.queue\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"fileName\":\s*\"([^\"]+)\"/g];
        break;

      // C00-
      case dlqNameMatch(/tco\.rar\.shipment\.queue\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"C001\":\s*\"([^\"]+)\"/g];
        break;

      // BillToID
      case dlqNameMatch(/tco\.rar\.orders\.release\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.rar\.create\.orders\.with\.deposit\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.rar\.order\.transfer\.notice\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.rar\.orders\.allocation\.queue\.dlq(?:\.prd|\.prod)?/i):
      patterns = [/\"BillToID\":\s*\"([^\"]+)\"/g];
        break;


      // OrderNo
      case dlqNameMatch(/tco\.rar\.tax\.release\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.rar\.oms\.retail\.invoice\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.oms\.order\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.oms\.invoice\.resa\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.oms\.invoice\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.oms\.order\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/tco\.rar\.oms\.retail\.order\.to\.e1\.queue\.dlq(?:\.prd|\.prod)?/i): // da controllare se ha OrderNo
        patterns = [/\"OrderNo\":\s*\"([^\"]+)\"/g];
        break;

      // C03
      case dlqNameMatch(/tco\.rar\.sales\.history\.queue\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"C03\":\s*\"([^\"]+)\"/g];
        break;

      // InvoiceNo
      case dlqNameMatch(/tco\.rar\.invoice\.creation\.queue\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"InvoiceNo\":\s*\"([^\"]+)\"/g];
        break;

      // ControlNumber
      case dlqNameMatch(/sys\.inv\.kdc\.esb\.shipstatus\.dgm\.dlq(?:\.prd|\.prod)?/i):
      case dlqNameMatch(/sys\.inv\.3pl\.esb\.reccon\.dgm\.dlq(?:\.prd|\.prod)?/i):
        patterns = [/\"ControlNumber\":\s*\"([^\"]+)\"/g];
        break;

      // tco-rar-tax-update-queue-dlq-prd – InvoiceNo + FlowId + FlowName
      case dlqNameMatch(/tco[.\-]rar[.\-]tax[.\-]update[.\-]queue[.\-]dlq(?:[.\-](?:prd|prod))?/i): {
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
