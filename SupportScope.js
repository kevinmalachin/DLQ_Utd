document.getElementById("regexSelect").addEventListener("change", function () {
  const regexSelect = document.getElementById("regexSelect").value;
  document.getElementById("compareBtn").disabled = !regexSelect;
});

document.getElementById("compareBtn").addEventListener("click", function () {
  const input1 = document.getElementById("input1").value;
  const input2 = document.getElementById("input2").value;
  const selectedRegex = document.getElementById("regexSelect").value;

  const result = compareTexts(input1, input2, selectedRegex);

  document.getElementById("result").value = result;
});

function formatInputText(textareaValue, pattern) {
  const matches = textareaValue.match(pattern);
  return matches
    ? matches.filter((line) => !/\d{4}-\d{2}-\d{2}/.test(line))
    : [];
}

function compareTexts(text1, text2, selectedRegex) {
  let pattern;
  switch (selectedRegex) {
    case "pattern1": // BY
      pattern = /(\b[A-Za-z]{4}-[A-Za-z0-9-]+|\b[A-Za-z]{2,3}-[A-Za-z0-9-]+)/g;
      break;
    case "pattern2": // DR
      pattern = /^\w{3,4}-\w+.*$|^\w{3,4}\.[A-Za-z0-9-]+\..*$/gm;
      break;
    case "pattern3": // FS
      pattern = /\b[A-Za-z]-[A-Za-z]{4}-[A-Za-z0-9-]+?(?=\s|$)/g;
      break;
    case "pattern4": // PC
      pattern = /(\b[A-Za-z]{2,}-[A-Za-z0-9-]+|\b[A-Za-z]{2,}-[A-Za-z0-9-]+-[A-Za-z0-9-]+)/g;
      break;
    case "pattern5": // TF
      pattern = /(\b[a-z]{3}-[A-Za-z0-9-]+|\b[a-z]{4}-[A-Za-z0-9-]+|\b[a-z]+api\b|\btrdmservice\b|\btcoordercaptureservice\b|\bsearchorderservicebeanservice\b|\brichrelevance\b|\breservations\b|\brepair\b|\bproductprocessapisf\b|\bpostricklepoll\b|\bivrauthtoken\b|\binventorytpm\b|\bimage\b|\bgooglemaps\b|\begc\b|\badobecampaign\b)/g;
      break;
    case "pattern6": // MS
      pattern = /^\w{4}-\w+.*$/gm;
      break;
    default:
      return "Please select a valid regex pattern.";
  }

  const wordsInFirstTextarea = formatInputText(text1, pattern);
  const wordsInSecondTextarea = formatInputText(text2, pattern);

  const missingWords = wordsInFirstTextarea.filter(
    (word) => !wordsInSecondTextarea.includes(word)
  );

  return `Apps not found:\n\n${missingWords.join("\n")}`;
}

// Remove placeholder when clicking on textarea
const textareaList = document.querySelectorAll("textarea");
textareaList.forEach(function (textarea) {
  textarea.addEventListener("click", function () {
    this.removeAttribute("placeholder");
  });
});

// function for the menu -> submenu appear when clicking on the "menu" button
$(document).ready(function () {
  $("#menuButton").click(function () {
    $("#menu").slideToggle();
  });
});

// Function to fetch scraping results and display them
async function fetchScrapingResults() {
  try {
    const response = await fetch('http://127.0.0.1:5000/scrape'); // Sostituisci con l'URL del tuo backend Flask
    const data = await response.json();

    const resultContainer = document.getElementById('scrapingResults');
    resultContainer.innerHTML = '';

    if (data.error) {
      resultContainer.innerHTML = `<p>Error: ${data.error}</p>`;
    } else {
      data.forEach(result => {
        const p = document.createElement('p');
        p.textContent = result;
        resultContainer.appendChild(p);
      });
    }
  } catch (error) {
    console.error('Error fetching scraping results:', error);
  }
}

// Call fetchScrapingResults when the document is fully loaded
document.addEventListener('DOMContentLoaded', fetchScrapingResults);
