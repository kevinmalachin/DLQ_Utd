// DOM Elements
const textareaList = document.querySelectorAll("textarea");
const checkButton = document.querySelector(".Check");

// check button function
checkButton.addEventListener("click", function (e) {
  e.preventDefault();
  calcolaDifferenza();
});

function formattaApp(textareaValue) {
  return textareaValue.split("\n").map((line) => line.trim());
}

function calcolaDifferenza() {
  const allAppsTextarea = document.querySelector(".AllApps").value;
  const supportScopeTextarea = document.querySelector(".SupportScope").value;
  const differenceTextarea = document.querySelector(".Difference");
  const totalAppsCountElement = document.querySelector("#totalAppsCount");

  // Formatta le app da entrambe le textarea
  const allAppsList = formattaApp(allAppsTextarea);
  const supportScopeList = formattaApp(supportScopeTextarea);

  console.log("All Apps List:", allAppsList);
  console.log("Support Scope List:", supportScopeList);

  // Trova le app presenti nella seconda textarea ma non nella prima
  const differenza = supportScopeList.filter(
    (app) => !allAppsList.some((item) => item.includes(app))
  );

  console.log("Difference:", differenza);

  // Aggiorna il risultato nella terza textarea
  differenceTextarea.value = differenza.join("\n");

  // Visualizza il conteggio totale delle app nella terza textarea
  totalAppsCountElement.textContent = `Totale app non presenti: ${differenza.length}`;
}

// Rimuovi il segnaposto quando clicchi nella textarea
textareaList.forEach(function (textarea) {
  textarea.addEventListener("click", function () {
    this.removeAttribute("placeholder");
  });
});
