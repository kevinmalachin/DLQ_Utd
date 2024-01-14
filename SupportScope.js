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

  // Dividi le parole della prima textarea
  const paroleNellaPrimaTextarea = formattaApp(allAppsText);

  // Dividi le parole della seconda textarea
  const paroleNellaSecondaTextarea = formattaApp(supportScopeText);

  // Escape characters speciali nell'elenco delle parole
  const paroleNellaPrimaTextareaEscaped = paroleNellaPrimaTextarea.map(
    (parola) => parola.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  // Costruisci un'espressione regolare usando le parole della seconda textarea
  const regex = new RegExp(
    paroleNellaSecondaTextarea
      .map((parola) =>
        paroleNellaPrimaTextareaEscaped.includes(parola)
          ? parola
          : parola.replace(/x/g, "x?")
      )
      .join("|"),
    "g"
  );

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
