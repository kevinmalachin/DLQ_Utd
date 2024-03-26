// DOM Elements
const checkButton = document.getElementById("checkButton");
const allAppsTextarea = document.getElementById("allAppsTextarea");
const supportScopeTextarea = document.getElementById("supportScopeTextarea");
const differenceTextarea = document.getElementById("differenceTextarea");
const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");

/* // Toggle submenu visibility when menu button is clicked
menuButton.addEventListener("click", function() {
  const submenu = menu.querySelector(".submenu");
  submenu.classList.toggle("show");
}); */

// Event listener for the check button
checkButton.addEventListener("click", function (e) {
  e.preventDefault();
  calculateDifference();
});

// Function to format the input text
function formatInputText(textareaValue) {
  // Extract only lines starting with the specified format and excluding dates
  const matches = textareaValue.match(/^\w{4}-\w+.*$/gm);
  return matches
    ? matches.filter((line) => !/\d{4}-\d{2}-\d{2}/.test(line))
    : [];
}

/* // Function to clean the input text
function cleanText(text) {
  // Lista di parole da eliminare
  const paroleDaEliminare = ["CloudHub", "4.4.0", "None", "Started"];

  // Espressione regolare per gli orari e le date
  const regexDate = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/g;

  // Rimuove gli orari e le date
  text = text.replace(regexDate, '');

  // Rimuove le parole dalla lista
  paroleDaEliminare.forEach(parola => {
    text = text.replace(new RegExp(parola, 'gi'), '');
  });

  // Rimuove spaziature multiple
  text = text.replace(/\s+/g, ' ');

  // Rimuove spaziature iniziali e finali
  text = text.trim();

  return text;
} */

// Function to calculate the difference between texts
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


$(document).ready(function () {
  $("#menuButton").click(function () {
    $("#menu").slideToggle();
  });
});