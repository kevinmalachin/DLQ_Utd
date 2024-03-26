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
  // Extract only lines matching the specified conditions and excluding dates
  const matches = textareaValue.match(/(\b[a-z]{3}-[A-Za-z0-9-]+|\b[a-z]{4}-[A-Za-z0-9-]+|\b[a-z]+api\b|\btrdmservice\b|\btcoordercaptureservice\b|\bsearchorderservicebeanservice\b|\brichrelevance\b|\breservations\b|\brepair\b|\bproductprocessapisf\b|\bpostricklepoll\b|\bivrauthtoken\b|\binventorytpm\b|\bimage\b|\bgooglemaps\b|\begc\b|\badobecampaign\b)/g);
  return matches
    ? matches.filter((line) => !/\d{4}-\d{2}-\d{2}/.test(line))
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
