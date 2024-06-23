document.addEventListener("DOMContentLoaded", function () {
  const htmlFileInput = document.getElementById("htmlFileInput");
  const excelFileInput = document.getElementById("excelFileInput");
  const compareBtn = document.getElementById("compareBtn");
  const projectSelect = document.getElementById("projectSelect");
  const customerSelect = document.getElementById("customerSelect");

  let htmlContent = "";
  let excelContent = [];

  // Handle HTML file input change
  htmlFileInput.addEventListener("change", handleHTMLFile);

  function handleHTMLFile(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        htmlContent = e.target.result;
        document.getElementById("htmlContent").value = htmlContent;
        enableCompareButton();
      };
      reader.readAsText(file);
    }
  }

  // Handle Excel file input change
  excelFileInput.addEventListener("change", handleExcelFile);

  function handleExcelFile(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        excelContent = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        document.getElementById("excelContent").value = JSON.stringify(
          excelContent,
          null,
          2
        );
        enableCompareButton();
      };
      reader.readAsArrayBuffer(file);
    }
  }

  // Enable compare button when both files are loaded
  function enableCompareButton() {
    if (htmlContent && excelContent.length) {
      compareBtn.disabled = false;
    }
  }

  // Handle compare button click
  compareBtn.addEventListener("click", function () {
    const result = compareHTMLWithExcel(htmlContent, excelContent);
    document.getElementById("result").value = result;
  });

  // Comparison logic (to be implemented based on specific needs)
  function compareHTMLWithExcel(html, excel) {
    // Sample comparison logic (this should be customized)
    const results = [];
    const htmlLines = html.split("\n");
    excel.forEach((row, index) => {
      const keyword = row[0];
      const found = htmlLines.some((line) => line.includes(keyword));
      results.push(`Keyword: ${keyword}, Found: ${found}`);
    });
    return results.join("\n");
  }

  // Populate project select options based on customer selection
  customerSelect.addEventListener("change", function () {
    const customer = this.value;
    populateProjectSelect(customer);
  });

  function populateProjectSelect(customer) {
    const projects = {
      Bouygues: ["CRM", "Corporate", "Business", "BYES360", "FM", "Losinger"],
      MSC: ["MSC Cruises", "Digital Channels", "SAP"],
      FSTR: ["Project A", "Project B"],
      LVMH: ["Group IT EAME", "Group IT US", "LVMH (Root)"],
      DIOR: ["Corporate", "Business", "KAM"],
      Tiffany: ["Project X", "Project Y"],
    };
    projectSelect.innerHTML =
      '<option value="">Seleziona un Project/Business group</option>';
    const options = projects[customer] || [];
    options.forEach((project) => {
      const optionElement = document.createElement("option");
      optionElement.value = project;
      optionElement.textContent = project;
      projectSelect.appendChild(optionElement);
    });
  }
});
