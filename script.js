"use strict";

const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const check = document.querySelector(".Check");
const textareaList = document.querySelectorAll("textarea");

// Debug: Verifica che gli elementi siano trovati
console.log("DLQtext:", DLQtext);
console.log("Results:", results);
console.log("Check:", check);

check.addEventListener("click", (e) => {
  e.preventDefault();

  // Debug: Verifica se il click è stato registrato
  console.log("Check button clicked");

  // Prende il valore dalla prima textarea e lo memorizza in una variabile
  const dlqText = DLQtext.value;

  // Debug: mostra il contenuto del testo
  console.log("DLQtext value:", dlqText);

  // Regex per trovare tutte le reference che iniziano con EC0 o CM_EC0
  const allReferences = Array.from(
    dlqText.matchAll(
      /\b(EC0\d{5,}(?:-\w+)*|CM_EC0\d+(?:-\w+)*(?:_\w+)*(?:_\d+)*(?:-\w+)*)\b/g
    ),
    (match) => match[0]
  );

  // Filtra le reference per escludere quelle che terminano con -STD o che non corrispondono al pattern specifico
  const filteredReferences = allReferences.filter((ref) => {
    // Esclude le reference che terminano con -STD
    if (ref.endsWith("-STD")) {
      return false;
    }
    // Reference nella forma EC0XXXXX
    if (ref.match(/^EC0\d{5,}$/)) {
      return true;
    }
    // Reference nella forma EC0XXXXX-lettere+numeri
    if (ref.match(/^EC0\d{5,}-\w*\d+$/)) {
      return true;
    }
    // Reference nella forma CM_EC0XXXXX
    if (ref.match(/^CM_EC0\d+/)) {
      return true;
    }
    return false;
  });

  // Rimuovi i duplicati ma preferisci le reference più complete
  const uniqueReferences = {};
  filteredReferences.forEach((ref) => {
    const baseRef = ref.split("-")[0];
    if (ref.startsWith("CM_")) {
      // Se la reference inizia con CM_, sostituisce qualsiasi EC0XXXXX corrispondente
      uniqueReferences[baseRef.replace("CM_", "")] = ref;
    } else {
      // Aggiunge solo se non esiste già una CM_ corrispondente
      if (!uniqueReferences[baseRef]) {
        uniqueReferences[baseRef] = ref;
      }
    }
  });

  // Usa un Set per contare le occorrenze
  const referenceCounts = {};
  Object.values(uniqueReferences).forEach((ref) => {
    referenceCounts[ref] = (referenceCounts[ref] || 0) + 1;
  });

  // Debug: mostra le reference trovate e il conteggio dei duplicati
  console.log("References found:", Object.values(uniqueReferences));
  console.log("Reference counts:", referenceCounts);

  // Creazione del testo per l'output dei risultati
  let outputText = `References found: ${
    Object.values(uniqueReferences).length
  }\n`;
  outputText += Object.values(uniqueReferences).join(", ") + "\n\n";

  // Aggiunta del conteggio dei duplicati nel testo di output
  outputText += "Duplicate counts:\n";
  for (const ref in referenceCounts) {
    if (referenceCounts.hasOwnProperty(ref) && referenceCounts[ref] > 1) {
      outputText += `${ref}: ${referenceCounts[ref]}\n`;
    }
  }

  // Invia i risultati nella terza textarea
  results.textContent = outputText;
});

// Rimuove il placeholder quando si clicca
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
