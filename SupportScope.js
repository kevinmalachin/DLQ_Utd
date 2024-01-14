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
  // Estrai parole utilizzando espressione regolare avanzata
  return textareaValue.match(/[^\s]+/g) || [];
}

function calcolaDifferenza() {
  // Ottieni il testo originale dalle textarea
  const allAppsText = allAppsTextarea.value;
  const supportScopeText = supportScopeTextarea.value;

  // Estrai parole dalla prima textarea
  const paroleNellaPrimaTextarea = formattaApp(allAppsText);

  // Estrai parole dalla seconda textarea
  const paroleNellaSecondaTextarea = formattaApp(supportScopeText);

  // Trova le parole nella seconda textarea che non sono presenti nella prima
  const paroleNonTrovate = paroleNellaSecondaTextarea.filter((parola) => {
    const regex = new RegExp(`\\b${parola}\\b`, "i"); // Considera la parola come parola intera
    return !regex.test(paroleNellaPrimaTextarea.join(" "));
  });

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
