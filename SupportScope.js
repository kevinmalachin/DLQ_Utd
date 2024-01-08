// DOM Elements
const textareaList = document.querySelectorAll("textarea");
const checkButton = document.querySelector(".Check");

// check button function
checkButton.addEventListener("click", function (e) {
  e.preventDefault();
  checkDifferences();
});

function checkDifferences() {
  let allAppsTextarea = document.querySelector(".AllApps").value.toLowerCase();
  let supportScopeTextarea = document
    .querySelector(".SupportScope")
    .value.toLowerCase();
  let differenceTextarea = document.querySelector(".Difference");
  let totalAppsCountElement = document.querySelector(".Total-Apps-Count");

  // Extract only lines that contain app names from the first textarea
  let allAppsList = allAppsTextarea
    .split("\n")
    .map((line) => line.trim().toLowerCase());

  let supportScopeList = supportScopeTextarea.split("\n");

  // Find names present in the second textarea but not in the first
  let differenza = [];
  supportScopeList.forEach((app) => {
    let formattedSupportApp = app.trim().toLowerCase();
    if (!allAppsList.includes(formattedSupportApp)) {
      differenza.push(formattedSupportApp);
    }
  });

  // Update the result in the third textarea
  differenceTextarea.value = differenza.join("\n");

  // Display the total count of apps in the third textarea
  totalAppsCountElement.textContent = `Totale app non presenti: ${differenza.length}`;
}

// Remove placeholder when you click in the textarea
textareaList.forEach(function (textarea) {
  textarea.addEventListener("click", function () {
    this.removeAttribute("placeholder");
  });
});
