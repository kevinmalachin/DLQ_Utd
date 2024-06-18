document
  .getElementById("htmlFileInput")
  .addEventListener("change", handleHtmlFile, false);
document
  .getElementById("excelFileInput")
  .addEventListener("change", handleExcelFile, false);
document
  .getElementById("compareBtn")
  .addEventListener("click", compareFiles, false);

let htmlContent = "";
let excelContent = [];

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

function handleExcelFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    // Leggi i dati dal secondo foglio denominato "APIs Scope"
    const worksheet = workbook.Sheets["APIs Scope"];
    if (worksheet) {
      excelContent = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
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

function enableCompareButton() {
  if (htmlContent && excelContent.length > 0) {
    document.getElementById("compareBtn").disabled = false;
  }
}

function compareFiles() {
  const className = "sc-csuQGl fgtqry"; // Adjust this to the actual class name
  const htmlApps = extractApplicationsFromHtml(htmlContent, className);

  // Read keyword from input
  const keyword = document
    .getElementById("regexSelect")
    .value.toLowerCase()
    .trim();

  // Extract applications from Excel based on the keyword
  const excelApps = extractApplicationsFromExcel(excelContent, keyword);

  const { htmlOnly, excelOnly } = findDiscrepancies(excelApps, htmlApps);

  displayResults(htmlOnly, excelOnly);
}

function extractApplicationsFromHtml(htmlContent, className) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const elements = doc.getElementsByClassName(className);
  const applications = new Set();

  Array.from(elements).forEach((element) => {
    applications.add(element.textContent.trim().toLowerCase());
  });

  console.log("HTML Applications:", applications); // Debug log

  return applications;
}

function extractApplicationsFromExcel(excelContent, keyword) {
  const applications = new Set();
  const headers = excelContent[0].map((header) => header.toLowerCase().trim());

  // Log per visualizzare i nomi delle colonne
  console.log("Excel Headers:", headers);

  // Find the index of the column named 'apis name'
  const apiNameIndex = headers.indexOf("apis name");

  if (apiNameIndex === -1) {
    console.error("Colonna 'APIs Name' non trovata nell'Excel");
    return applications;
  }

  // Iterate over the rows starting from the second row
  for (let i = 1; i < excelContent.length; i++) {
    const row = excelContent[i];
    const cell = row[apiNameIndex];
    if (typeof cell === "string") {
      const cellValue = cell.trim().toLowerCase();
      if (!keyword || cellValue.includes(keyword)) {
        applications.add(cellValue);
      }
    }
  }

  console.log("Excel Applications:", applications); // Debug log

  return applications;
}

function findDiscrepancies(excelApps, htmlApps) {
  const normalizedExcelApps = new Set(
    Array.from(excelApps).map((app) => app.trim().toLowerCase())
  );
  const normalizedHtmlApps = new Set(
    Array.from(htmlApps).map((app) => app.trim().toLowerCase())
  );

  const htmlOnly = new Set(
    [...normalizedHtmlApps].filter((app) => !normalizedExcelApps.has(app))
  );
  const excelOnly = new Set(
    [...normalizedExcelApps].filter((app) => !normalizedHtmlApps.has(app))
  );

  console.log("HTML Only Applications:", htmlOnly); // Debug log
  console.log("Excel Only Applications:", excelOnly); // Debug log

  return { htmlOnly, excelOnly };
}

function displayResults(htmlOnly, excelOnly) {
  const resultArea = document.getElementById("result");
  resultArea.textContent =
    `Applicazioni trovate solo nell'HTML (Runtime):\n${[...htmlOnly].join(
      "\n"
    )}\n\n` +
    `Applicazioni trovate solo nell'Excel:\n${[...excelOnly].join("\n")}`;
}
