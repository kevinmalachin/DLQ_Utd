// DOM Elements
const checkButton = document.getElementById("checkButton");
const allAppsTextarea = document.getElementById("allAppsTextarea");
const supportScopeTextarea = document.getElementById("supportScopeTextarea");
const differenceTextarea = document.getElementById("differenceTextarea");

// Event listener for the check button
checkButton.addEventListener("click", function (e) {
  e.preventDefault();
  calculateDifference();
});

// Function to format the input text
function formatInputText(textareaValue) {
  // Extract only lines starting with the specified format and excluding dates
  const matches = textareaValue.match(/(\b[A-Za-z]{4}-[A-Za-z0-9-]+|\b[A-Za-z]{2,3}-[A-Za-z0-9-]+)/g);
  return matches
    ? matches.filter((line) => line !== "bycn-private-space-prd" && !/\d{4}-\d{2}-\d{2}/.test(line))
    : [];
}

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

  // Join missing words with a newline character
  const missingWordsFormatted = missingWords.join("\n");

  // Update the result in the third textarea
  differenceTextarea.value = `Apps not found:\n\n${missingWordsFormatted}`;
}

// Remove placeholder when clicking on textarea
const textareaList = document.querySelectorAll("textarea");
textareaList.forEach(function (textarea) {
  textarea.addEventListener("click", function () {
    this.removeAttribute("placeholder");
  });
});