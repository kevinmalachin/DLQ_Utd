// DOM Elements
const checkButton = document.getElementById("checkButton");
const allAppsTextarea = document.getElementById("allAppsTextarea");
const supportScopeTextarea = document.getElementById("supportScopeTextarea");
const differenceTextarea = document.getElementById("differenceTextarea");
const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");

// Event listener for the check button
checkButton.addEventListener("click", function (e) {
  e.preventDefault();
  calculateDifference();
});

// Input text formatting
function formatInputText(textareaValue) {
  // Extract only lines starting with the specified format and excluding dates
  const matches = textareaValue.match(/^\w{4}-\w+.*$/gm);
  return matches
    ? matches.filter((line) => !/\d{4}-\d{2}-\d{2}/.test(line))
    : [];
}

// Calculate the difference between texts
function calculateDifference() {
  // Get text from the textareas
  const allAppsText = allAppsTextarea.value;
  const supportScopeText = supportScopeTextarea.value;

  // Split words from the first textarea
  const wordsInFirstTextarea = formatInputText(allAppsText);

  // Split words from the second textarea
  const wordsInSecondTextarea = formatInputText(supportScopeText);

  // Find words in the first textarea that are not present in the second one
  const missingWords = wordsInFirstTextarea.filter(
    (word) => !wordsInSecondTextarea.includes(word)
  );

  // Update the result in the third textarea
  differenceTextarea.value = `Apps not found:\n\n${missingWords.join("\n")}`;
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
