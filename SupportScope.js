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

    // Read data from the second sheet named "APIs Scope"
    const worksheet = workbook.Sheets["APIs Scope"];
    if (worksheet) {
      excelContent = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log("Excel Content:", excelContent); // Debug log
      document.getElementById("excelContent").textContent = JSON.stringify(
        excelContent,
        null,
        2
      );
      enableCompareButton();
    } else {
      console.error("Sheet 'APIs Scope' not found in the Excel file");
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
    .getElementById("keywordInput")
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

  // Check if excelContent is an array and not empty
  if (!Array.isArray(excelContent) || excelContent.length === 0) {
    console.error("No data found in excelContent");
    return applications;
  }

  // Assume that the first row is the header
  const headers = excelContent[0].map((header) => header.toLowerCase().trim());

  // Find the index of the columns named 'apis name' and 'project'
  const apiNameIndex = headers.indexOf("apis name");
  const projectIndex = headers.indexOf("project");

  if (apiNameIndex === -1 || projectIndex === -1) {
    console.error("Columns 'APIs Name' or 'Project' not found in the Excel");
    return applications; // Early return if headers are not found
  }

  // Iterate over the rows starting from the second row
  for (let i = 1; i < excelContent.length; i++) {
    const row = excelContent[i];
    const apiNameCell = row[apiNameIndex];
    const projectCell = row[projectIndex];

    // Check if apiNameCell and projectCell are strings before calling toLowerCase()
    const apiNameLowerCase =
      typeof apiNameCell === "string" ? apiNameCell.toLowerCase().trim() : "";
    const projectLowerCase =
      typeof projectCell === "string" ? projectCell.toLowerCase().trim() : "";

    // Check if the keyword is present in the apiName or project
    if (
      apiNameLowerCase.includes(keyword) ||
      projectLowerCase.includes(keyword)
    ) {
      applications.add(apiNameLowerCase);
    }
  }

  console.log("Excel Applications:", applications); // Debug log

  return applications;
}

function findDiscrepancies(excelApps, htmlApps) {
  const htmlOnly = new Set([...htmlApps].filter((app) => !excelApps.has(app)));
  const excelOnly = new Set([...excelApps].filter((app) => !htmlApps.has(app)));

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
