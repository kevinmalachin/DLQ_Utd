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
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    excelContent = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    document.getElementById("excelContent").textContent = JSON.stringify(
      excelContent,
      null,
      2
    );
    enableCompareButton();
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
  const excelApps = extractApplicationsFromExcel(excelContent);
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

  return applications;
}

function extractApplicationsFromExcel(excelContent) {
  const applications = new Set();
  const keyword = document.getElementById("regexSelect").value.toLowerCase();

  // Assume that the first row is the header
  const headers = excelContent[0].map((header) => header.toLowerCase());

  // Find the index of the column named 'APIs Name'
  const apiNameIndex = headers.indexOf("apis name");

  if (apiNameIndex === -1) {
    console.error("Colonna 'APIs Name' non trovata nell'Excel");
    return applications;
  }

  // Iterate over the rows starting from the second row
  for (let i = 1; i < excelContent.length; i++) {
    const row = excelContent[i];
    const cell = row[apiNameIndex];
    if (typeof cell === "string" && cell.toLowerCase().includes(keyword)) {
      applications.add(cell.trim().toLowerCase());
    }
  }

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
