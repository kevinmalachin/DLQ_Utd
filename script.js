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

  // Regex per trovare tutte le reference che iniziano con EC0, CM_EC0, o due lettere seguite da cifre
  const allReferences = Array.from(
    dlqText.matchAll(
      /\b(EC0\d+(?:-\w+)*|CM_EC0\d+(?:-\w+)*(?:_\w+)*(?:_\d+)*(?:-\w+)*|[A-Z]{2}\d{9})\b/g
    ),
    (match) => match[0]
  );

  // Regex per trovare tutti i valori di asnId
  const allAsnIds = Array.from(
    dlqText.matchAll(/"asnId":\s*"(\d+)"/g),
    (match) => match[1]
  );

  // Regex per trovare tutte le reference nella forma rootEntityRef
  const rootEntityRefs = Array.from(
    dlqText.matchAll(/"rootEntityRef":"(1ZECO\d+)"/g),
    (match) => match[1]
  );

  // Regex per trovare tutte le reference nella forma externalReference
  const externalReferences = Array.from(
    dlqText.matchAll(/"externalReference":"(EC0\d{8})"/g),
    (match) => match[1]
  );

  // Filtra le reference per escludere quelle che terminano con -solo lettere
  const filteredReferences = allReferences.filter((ref) => {
    // Esclude le reference nella forma EC0XXXXX-sole lettere
    return !ref.match(/^EC0\d+-[a-zA-Z]+$/);
  });

  // Combina tutte le reference trovate
  const combinedReferences = [
    ...filteredReferences,
    ...rootEntityRefs,
    ...externalReferences,
  ];

  // Contatore delle occorrenze delle reference
  const referenceCounts = combinedReferences.reduce((acc, ref) => {
    acc[ref] = (acc[ref] || 0) + 1;
    return acc;
  }, {});

  // Rimuovi i duplicati ma preferisci le reference più complete
  const uniqueReferences = {};
  combinedReferences.forEach((ref) => {
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

  // Debug: mostra le reference trovate e il conteggio dei duplicati
  console.log("Unique references found:", Object.values(uniqueReferences));
  console.log("Reference counts:", referenceCounts);

  // Creazione del testo per l'output dei risultati
  let outputText = `References found: ${
    Object.values(uniqueReferences).length
  }\n`;
  outputText += Object.values(uniqueReferences).join(", ") + "\n\n";

  // Aggiunta dei valori di asnId trovati
  outputText += `asnId values found: ${allAsnIds.length}\n`;
  outputText += allAsnIds.join(", ") + "\n\n";

  // Aggiunta del conteggio dei duplicati nel testo di output
  outputText += "Duplicate counts:\n";
  for (const ref in referenceCounts) {
    if (referenceCounts.hasOwnProperty(ref) && referenceCounts[ref] > 1) {
      outputText += `${ref}: ${referenceCounts[ref]}\n`;
    }
  }

  // Debug: mostra il testo di output
  console.log("Output text:", outputText);

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
