// DOM Elements

const textareaList = document.querySelectorAll("textarea");
const checkButton = document.querySelector(".Check");

// check button function
checkButton.addEventListener("click", function (e) {
  e.preventDefault();
  calcolaDifferenza();
});

function calcolaDifferenza() {
  let allAppsTextarea = document.querySelector(".AllApps").value;
  let supportScopeTextarea = document.querySelector(".SupportScope").value;
  let differenceTextarea = document.querySelector(".Difference");

  // Converts text in array
  let allAppsList = allAppsTextarea.split("\n");
  let supportScopeList = supportScopeTextarea.split("\n");

  // Difference between the two
  let differenza = allAppsList.filter((app) => !supportScopeList.includes(app));

  // Here is the result
  differenceTextarea.value = differenza.join("\n");
}

// Remove placeholder when you click in the textarea

textareaList.forEach(function (textarea) {
  textarea.addEventListener("click", function () {
    this.removeAttribute("placeholder");
  });
});
