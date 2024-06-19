document.addEventListener("DOMContentLoaded", function () {
  const htmlFileInput = document.getElementById("htmlFileInput");
  const excelFileInput = document.getElementById("excelFileInput");
  const compareBtn = document.getElementById("compareBtn");
  const keywordSelect = document.getElementById("keywordSelect");
  const customerSelect = document.getElementById("customerSelect");

  let htmlContent = "";
  let excelContent = [];

  // Handle HTML file input change
  htmlFileInput.addEventListener("change", handleHtmlFile, false);

  // Handle Excel file input change
  excelFileInput.addEventListener("change", handleExcelFile, false);

  // Handle Compare button click
  compareBtn.addEventListener("click", compareFiles, false);

  // Handle customer selection change
  customerSelect.addEventListener("change", function () {
    const selectedCustomer = customerSelect.value;
    updateKeywordOptions(selectedCustomer);
  });

  // Handle keyword selection change
  keywordSelect.addEventListener("change", function () {
    enableCompareButton();
  });

  // Function to update keyword options based on selected customer
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

    // Clear current options
    keywordSelect.innerHTML =
      '<option value="">Seleziona un Project/Business group</option>';

    // Add options based on selected customer
    if (customer && keywordsByCustomer[customer]) {
      keywordsByCustomer[customer].forEach((keyword) => {
        const option = document.createElement("option");
        option.value = keyword;
        option.textContent = keyword;
        keywordSelect.appendChild(option);
      });
    }

    // Enable or disable Compare button based on selections
    enableCompareButton();
  }

  // Function to enable Compare button when conditions are met
  function enableCompareButton() {
    const selectedKeyword = keywordSelect.value;
    const selectedCustomer = customerSelect.value;
    compareBtn.disabled = !(
      selectedCustomer &&
      htmlContent &&
      excelContent.length > 0
    );
  }

  // Function to handle HTML file input change
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

  // Function to handle Excel file input change
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

  // Function to compare HTML and Excel files based on selected keyword
  function compareFiles() {
    const selectedKeyword = keywordSelect.value.toLowerCase().trim();
    const className = "sc-csuQGl fgtqry"; // Adjust this to the actual class name
    const htmlApps = extractApplicationsFromHtml(htmlContent, className);
    const excelApps = extractApplicationsFromExcel(
      excelContent,
      selectedKeyword
    );
    const { htmlOnly, excelOnly } = findDiscrepancies(excelApps, htmlApps);
    displayResults(htmlOnly, excelOnly);
  }

  // Function to extract applications from HTML content based on class name
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

  // Function to extract applications from Excel content based on selected keyword
  function extractApplicationsFromExcel(excelContent, selectedKeyword) {
    const applications = new Set();

    // Check if excelContent is an array and not empty
    if (!Array.isArray(excelContent) || excelContent.length === 0) {
      console.error("No data found in excelContent");
      return applications;
    }

    // Assume that the first row is the header
    const headers = excelContent[0].map((header) =>
      header.toLowerCase().trim()
    );

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
        !selectedKeyword || // Check if no keyword selected
        apiNameLowerCase.includes(selectedKeyword) ||
        projectLowerCase.includes(selectedKeyword)
      ) {
        applications.add(apiNameLowerCase);
      }
    }

    console.log("Excel Applications:", applications); // Debug log

    return applications;
  }

  // Function to find discrepancies between Excel and HTML applications
  function findDiscrepancies(excelApps, htmlApps) {
    const htmlOnly = new Set(
      [...htmlApps].filter((app) => !excelApps.has(app))
    );
    const excelOnly = new Set(
      [...excelApps].filter((app) => !htmlApps.has(app))
    );

    console.log("HTML Only Applications:", htmlOnly); // Debug log
    console.log("Excel Only Applications:", excelOnly); // Debug log

    return { htmlOnly, excelOnly };
  }

  // Function to display comparison results
  function displayResults(htmlOnly, excelOnly) {
    const resultArea = document.getElementById("result");
    resultArea.textContent =
      `Applicazioni trovate solo nell'HTML (Runtime):\n${[...htmlOnly].join(
        "\n"
      )}\n\n` +
      `Applicazioni trovate solo nell'Excel:\n${[...excelOnly].join("\n")}`;
  }
});
