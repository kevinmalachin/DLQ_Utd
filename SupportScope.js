// DOM Elements
const textareaList = document.querySelectorAll("textarea");
const checkButton = document.querySelector(".Check");
const allAppsTextarea = document.querySelector(".AllApps");
const supportScopeTextarea = document.querySelector(".SupportScope");
const differenceTextarea = document.querySelector(".Difference");
const totalAppsCountElement = document.querySelector("#totalAppsCount");

// check button function
checkButton.addEventListener("click", function (e) {
  e.preventDefault();
  calcolaDifferenza();
});

function formattaApp(textareaValue) {
  return textareaValue.match(/\S+/g) || []; // Estrai parole utilizzando espressione regolare
}

function calcolaDifferenza() {
  // Ottieni il testo originale dalle textarea
  const allAppsText = allAppsTextarea.value;
  const supportScopeText = supportScopeTextarea.value;

  // Dividi le parole della prima textarea
  const paroleNellaPrimaTextarea = formattaApp(allAppsText);

  // Dividi le parole della seconda textarea
  const paroleNellaSecondaTextarea = formattaApp(supportScopeText);

  // Trova le parole nella seconda textarea che non sono presenti nella prima
  const paroleNonTrovate = paroleNellaSecondaTextarea.filter(
    (parola) => !paroleNellaPrimaTextarea.includes(parola)
  );

  // Aggiorna il risultato nella terza textarea
  differenceTextarea.value = `App non trovate:\n\n${paroleNonTrovate.join(
    "\n"
  )}`;
}

// Rimuovi il segnaposto quando clicchi nella textarea
textareaList.forEach(function (textarea) {
  textarea.addEventListener("click", function () {
    this.removeAttribute("placeholder");
  });
});
