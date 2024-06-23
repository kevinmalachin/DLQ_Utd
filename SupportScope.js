document.addEventListener("DOMContentLoaded", function () {
  const htmlFileInput = document.getElementById("htmlFileInput");
  const excelFileInput = document.getElementById("excelFileInput");
  const compareBtn = document.getElementById("compareBtn");
  const keywordSelect = document.getElementById("projectSelect"); // Aggiornato l'ID da keywordSelect a projectSelect
  const customerSelect = document.getElementById("customerSelect");

  let htmlContent = "";
  let excelContent = [];

  // Verifica se gli elementi necessari sono stati trovati correttamente
  if (
    !htmlFileInput ||
    !excelFileInput ||
    !compareBtn ||
    !keywordSelect ||
    !customerSelect
  ) {
    console.error(
      "Elementi non trovati nel DOM. Assicurati che gli ID siano corretti."
    );
    return;
  }

  // Gestione dell'evento change per il caricamento del file HTML
  htmlFileInput.addEventListener("change", handleHtmlFile, false);

  // Gestione dell'evento change per il caricamento del file Excel
  excelFileInput.addEventListener("change", handleExcelFile, false);

  // Gestione dell'evento click per il pulsante Confronta
  compareBtn.addEventListener("click", compareFiles, false);

  // Gestione dell'evento change per la selezione del cliente
  customerSelect.addEventListener("change", function () {
    const selectedCustomer = customerSelect.value;
    updateKeywordOptions(selectedCustomer);
  });

  // Gestione dell'evento change per la selezione del progetto/business group
  keywordSelect.addEventListener("change", function () {
    enableCompareButton();
  });

  // Funzione per aggiornare le opzioni di progetto/business group in base al cliente selezionato
  function updateKeywordOptions(customer) {
    const keywordsByCustomer = {
      Bouygues: [
        "CRM",
        "Corporate",
        "Business",
        "BYES360",
        "FM",
        "Losinger",
        "Commerce",
        "Business",
        "KAM",
      ],
      MSC: ["MSC Cruises", "Digital Channels", "SAP"],
      LVMH: ["Group IT EAME", "Group IT US", "LVMH (Root)"],
    };

    // Svuota le opzioni attuali
    keywordSelect.innerHTML =
      '<option value="">Seleziona un Project/Business group</option>';

    // Aggiungi opzioni in base al cliente selezionato
    if (customer && keywordsByCustomer[customer]) {
      keywordsByCustomer[customer].forEach((keyword) => {
        const option = document.createElement("option");
        option.value = keyword.toLowerCase(); // Imposta in minuscolo per coerenza
        option.textContent = keyword;
        keywordSelect.appendChild(option);
      });
    }

    // Abilita o disabilita il pulsante Confronta in base alle selezioni
    enableCompareButton();
  }

  // Funzione per abilitare il pulsante Confronta quando sono soddisfatte le condizioni
  function enableCompareButton() {
    const selectedKeyword = keywordSelect.value;
    const selectedCustomer = customerSelect.value;
    compareBtn.disabled = !(
      selectedCustomer &&
      htmlContent &&
      excelContent.length > 0 &&
      selectedKeyword
    );
  }

  // Funzione per gestire il cambio del file HTML
  function handleHtmlFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
      htmlContent = event.target.result;
      document.getElementById("htmlContent").textContent = htmlContent;
      enableCompareButton();
    };
    reader.readAsText(file);
  }

  // Funzione per gestire il cambio del file Excel
  function handleExcelFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Legge i dati dal secondo foglio chiamato "APIs Scope"
      const worksheet = workbook.Sheets["APIs Scope"];
      if (worksheet) {
        excelContent = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log("Contenuto Excel:", excelContent); // Log di debug
        document.getElementById("excelContent").textContent = JSON.stringify(
          excelContent,
          null,
          2
        );
        enableCompareButton();
      } else {
        console.error("Foglio 'APIs Scope' non trovato nel file Excel");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Funzione per confrontare i file HTML ed Excel in base al progetto/business group selezionato
  function compareFiles() {
    const selectedKeyword = keywordSelect.value.toLowerCase().trim();
    const className = "sc-csuQGl fgtqry"; // Aggiusta questo al nome della classe effettivo
    const htmlApps = extractApplicationsFromHtml(htmlContent, className);
    const excelApps = extractApplicationsFromExcel(
      excelContent,
      selectedKeyword
    );
    const { htmlOnly, excelOnly } = findDiscrepancies(htmlApps, excelApps);
    displayResults(htmlOnly, excelOnly);
  }

  // Funzione per estrarre le applicazioni dall'HTML in base al nome della classe
  function extractApplicationsFromHtml(htmlContent, className) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const elements = doc.getElementsByClassName(className);
    const applications = new Set();

    Array.from(elements).forEach((element) => {
      applications.add(element.textContent.trim().toLowerCase());
    });

    console.log("Applicazioni HTML:", applications); // Log di debug

    return applications;
  }

  // Funzione per estrarre le applicazioni dall'Excel in base al progetto/business group selezionato
  function extractApplicationsFromExcel(excelContent, selectedKeyword) {
    const applications = new Set();

    // Verifica se excelContent è un array e non è vuoto
    if (!Array.isArray(excelContent) || excelContent.length === 0) {
      console.error("Nessun dato trovato in excelContent");
      return applications;
    }

    // Assume che la prima riga sia l'intestazione
    const headers = excelContent[0].map((header) =>
      header.toLowerCase().trim()
    );

    // Trova l'indice delle colonne denominate 'apis name' e 'project'
    const apiNameIndex = headers.indexOf("apis name");
    const projectIndex = headers.indexOf("project");

    if (apiNameIndex === -1 || projectIndex === -1) {
      console.error("Colonne 'APIs Name' o 'Project' non trovate nell'Excel");
      return applications; // Restituzione anticipata se le intestazioni non sono trovate
    }

    // Itera sulle righe a partire dalla seconda riga
    for (let i = 1; i < excelContent.length; i++) {
      const row = excelContent[i];
      const apiNameCell = row[apiNameIndex];
      const projectCell = row[projectIndex];

      // Verifica se apiNameCell e projectCell sono stringhe prima di chiamare toLowerCase()
      const apiNameLowerCase =
        typeof apiNameCell === "string" ? apiNameCell.toLowerCase().trim() : "";
      const projectLowerCase =
        typeof projectCell === "string" ? projectCell.toLowerCase().trim() : "";

      // Verifica se la parola chiave è presente in apiName o project
      if (
        apiNameLowerCase.includes(selectedKeyword) ||
        projectLowerCase.includes(selectedKeyword)
      ) {
        applications.add(apiNameLowerCase);
      }
    }

    console.log("Applicazioni Excel:", applications); // Log di debug

    return applications;
  }

  // Funzione per trovare discrepanze tra applicazioni HTML ed Excel
  function findDiscrepancies(htmlApps, excelApps) {
    const htmlOnly = new Set(
      [...htmlApps].filter((app) => !excelApps.has(app))
    );
    const excelOnly = new Set(
      [...excelApps].filter((app) => !htmlApps.has(app))
    );

    console.log("Applicazioni solo HTML:", htmlOnly); // Log di debug
    console.log("Applicazioni solo Excel:", excelOnly); // Log di debug

    return { htmlOnly, excelOnly };
  }

  // Funzione per visualizzare i risultati del confronto
  function displayResults(htmlOnly, excelOnly) {
    const resultArea = document.getElementById("result");
    resultArea.textContent =
      `Applicazioni trovate solo nell'HTML:\n${[...htmlOnly].join("\n")}\n\n` +
      `Applicazioni trovate solo nell'Excel:\n${[...excelOnly].join("\n")}`;
  }
});
