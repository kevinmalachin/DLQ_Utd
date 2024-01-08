// DOM Elements
const textareaList = document.querySelectorAll("textarea");
const checkButton = document.querySelector(".Check");

// check button function
checkButton.addEventListener("click", function (e) {
  e.preventDefault();
  calcolaDifferenza();
});

function formattaApp(textareaValue) {
  return textareaValue
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((app) => app !== ""); // Rimuove stringhe vuote
}

function calcolaDifferenza() {
  const allAppsTextarea = document
    .querySelector(".AllApps")
    .value.toLowerCase();
  const supportScopeTextarea = document
    .querySelector(".SupportScope")
    .value.toLowerCase();
  const differenceTextarea = document.querySelector(".Difference");
  const totalAppsCountElement = document.querySelector("#totalAppsCount");

  // Formatta le app da entrambe le textarea
  const allAppsList = formattaApp(allAppsTextarea);
  const supportScopeList = formattaApp(supportScopeTextarea);

  // Trova le app presenti nella seconda textarea ma non nella prima
  const differenza = supportScopeList.filter(
    (app) => !allAppsList.includes(app)
  );

  // Log di debug per verificare i valori delle variabili
  console.log("All Apps List:", allAppsList);
  console.log("Support Scope List:", supportScopeList);
  console.log("Difference:", differenza);

  // Aggiorna il risultato nella terza textarea
  differenceTextarea.value = differenza.join("\n") || ""; // Assicurati che il valore sia almeno una stringa vuota

  // Visualizza il conteggio totale delle app nella terza textarea
  totalAppsCountElement.textContent = `Totale app non presenti: ${differenza.length}`;
}

// Rimuovi il segnaposto quando clicchi nella textarea
textareaList.forEach(function (textarea) {
  textarea.addEventListener("click", function () {
    this.removeAttribute("placeholder");
  });
});
