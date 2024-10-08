document
  .getElementById("htmlFileInput")
  .addEventListener("change", handleHtmlFile, false);
document
  .getElementById("excelFileInput")
  .addEventListener("change", handleExcelFile, false);
document
  .getElementById("compareBtn")
  .addEventListener("click", compareFiles, false);
document
  .getElementById("customerSelect")
  .addEventListener("change", updateProjectOptions, false);

let htmlContent = "";
let excelContent = [];

const customerProjects = {
  Bouygues: [
    "CRM",
    "Corporate",
    "Business",
    "BYES360",
    "FM",
    "Losinger",
    "Commerce",
    "KAM",
  ],
  MSC: ["MSC Cruises", "Digital Channels", "SAP"],
  LVMH: ["Group IT EAME", "Group IT US", "LVMH (Root)"],
  FSTR: [],
  DIOR: ["PROD", "AMER-PRD", "APAC-PRD", "EMEA-PRD"],
  Tiffany: [],
};

function handleHtmlFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    htmlContent = event.target.result;
    document.getElementById("htmlContent").textContent = htmlContent;
    enableCompareButton();
    showFeedback("htmlFileInput");
  };
  reader.readAsText(file);
}

function handleExcelFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    let worksheet;
    const customer = document.getElementById("customerSelect").value;

    if (customer === "DIOR") {
      // Cerca il foglio corretto tra i fogli di DIOR
      const diorSheets = ["PROD", "AMER-PRD", "APAC-PRD", "EMEA-PRD"];
      for (const sheetName of diorSheets) {
        if (workbook.Sheets[sheetName]) {
          worksheet = workbook.Sheets[sheetName];
          break;
        }
      }
    } else {
      // Per gli altri clienti, cerca nei fogli standard
      worksheet = workbook.Sheets["APIs Scope"] || workbook.Sheets["API Names"];
    }

    if (worksheet) {
      excelContent = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      document.getElementById("excelContent").textContent = JSON.stringify(
        excelContent,
        null,
        2
      );
      enableCompareButton();
      showFeedback("excelFileInput");
    } else {
      console.error("No appropriate sheet found in the Excel file");
    }
  };
  reader.readAsArrayBuffer(file);
}

function enableCompareButton() {
  if (htmlContent && excelContent.length > 0) {
    document.getElementById("compareBtn").disabled = false;
  }
}

function updateProjectOptions() {
  const customer = document.getElementById("customerSelect").value;
  const projectSelect = document.getElementById("projectSelect");
  projectSelect.innerHTML =
    '<option value="">Seleziona un Project/Business group</option>';

  if (customerProjects[customer]) {
    customerProjects[customer].forEach((project) => {
      const option = document.createElement("option");
      option.value = project;
      option.textContent = project;
      projectSelect.appendChild(option);
    });
  }
  showFeedback("customerSelect");
}

function compareFiles() {
  const className = "sc-csuQGl fgtqry"; // Adjust this to the actual class name
  const htmlApps = extractApplicationsFromHtml(htmlContent, className);

  const keyword = document
    .getElementById("projectSelect")
    .value.toLowerCase()
    .trim();
  const customer = document.getElementById("customerSelect").value;

  const excelApps =
    customerProjects[customer].length === 0
      ? extractApplicationsFromExcel(excelContent, "")
      : extractApplicationsFromExcel(excelContent, keyword);

  const { htmlOnly, excelOnly } = findDiscrepancies(excelApps, htmlApps);

  displayResults(htmlOnly, excelOnly);
  showFeedback("compareBtn");
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

function extractApplicationsFromExcel(excelContent, keyword) {
  const applications = new Set();

  if (!Array.isArray(excelContent) || excelContent.length === 0) {
    console.error("No data found in excelContent");
    return applications;
  }

  const headers = excelContent[0].map((header) => header.toLowerCase().trim());
  const apiNameIndex = headers.indexOf("apis name");
  const projectIndex = headers.indexOf("project");

  if (apiNameIndex === -1 || projectIndex === -1) {
    console.error("Columns 'APIs Name' or 'Project' not found in the Excel");
    return applications;
  }

  for (let i = 1; i < excelContent.length; i++) {
    const row = excelContent[i];
    const apiNameCell = row[apiNameIndex];
    const projectCell = row[projectIndex];

    const apiNameLowerCase =
      typeof apiNameCell === "string" ? apiNameCell.toLowerCase().trim() : "";
    const projectLowerCase =
      typeof projectCell === "string" ? projectCell.toLowerCase().trim() : "";

    if (
      apiNameLowerCase.includes(keyword) ||
      projectLowerCase.includes(keyword)
    ) {
      applications.add(apiNameLowerCase);
    }
  }

  return applications;
}

function findDiscrepancies(excelApps, htmlApps) {
  const htmlOnly = new Set([...htmlApps].filter((app) => !excelApps.has(app)));
  const excelOnly = new Set([...excelApps].filter((app) => !htmlApps.has(app)));

  return { htmlOnly, excelOnly };
}

function displayResults(htmlOnly, excelOnly) {
  const discrepancies = new Set([...htmlOnly, ...excelOnly]);
  const resultArea = document.getElementById("result");

  const discrepanciesList = [...discrepancies].join("\n");
  const htmlOnlyList = [...htmlOnly].join("\n");
  const excelOnlyList = [...excelOnly].join("\n");

  resultArea.textContent =
    `Discrepanze tra HTML ed Excel:\n${discrepanciesList}\n\n` +
    `Applicazioni trovate solo nell'HTML (Runtime):\n${htmlOnlyList}\n\n` +
    `Applicazioni trovate solo nell'Excel:\n${excelOnlyList}`;
}

function showFeedback(elementId) {
  const element = document.getElementById(elementId);
  element.classList.add("border-green-500", "ring-2", "ring-green-300");
  setTimeout(() => {
    element.classList.remove("border-green-500", "ring-2", "ring-green-300");
  }, 2000);
}
