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

  // Dividi il testo in righe
  const lines = dlqText.split("\n");

  // Regex per trovare tutte le reference che seguono i vari formati
  const patterns = [
    /"internalReference":\s*"([^"]+)"/g,
    /"entityRef":\s*"([^"]+)"/g,
    /"rootEntityRef":\s*"([^"]+)"/g,
    /"ref":\s*"([^"]+)"/g,
    /"asnId":\s*"([^"]+)"/g
  ];

  // Combina tutte le reference trovate dalle righe
  let combinedReferences = [];
  lines.forEach(line => {
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        combinedReferences.push(match[1]);
      }
    });
  });

  // Filtra le reference per escludere quelle nel formato UUID
  const filteredReferences = combinedReferences.filter(ref => 
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(ref)
  );

  // Filtra le reference per escludere quelle che hanno la forma EC0XXXXX-STD (solo lettere dopo il trattino)
  const furtherFilteredReferences = filteredReferences.filter(ref => 
    !/^EC0\d{5}-[A-Z]+$/.test(ref)
  );

  // Contatore delle occorrenze delle reference
  const referenceCounts = furtherFilteredReferences.reduce((acc, ref) => {
    acc[ref] = (acc[ref] || 0) + 1;
    return acc;
  }, {});

  // Rimuovi i duplicati mantenendo solo la versione più completa
  const uniqueReferences = {};
  furtherFilteredReferences.forEach((ref) => {
    const baseRef = ref.split("-")[0];
    if (!uniqueReferences[baseRef] || ref.length > uniqueReferences[baseRef].length) {
      uniqueReferences[baseRef] = ref;
    }
  });

  // Estrai solo le reference uniche
  const uniqueReferenceValues = Object.values(uniqueReferences);

  // Verifica se ci sono reference nella forma CM_
  const hasCMReferences = uniqueReferenceValues.some(ref => ref.startsWith("CM_"));

  // Filtra per mantenere solo le reference CM_ se ce ne sono
  const finalReferences = hasCMReferences
    ? furtherFilteredReferences.filter(ref => ref.startsWith("CM_"))
    : uniqueReferenceValues;

  // Debug: mostra le reference trovate e il conteggio dei duplicati
  console.log("Unique references found:", finalReferences);
  console.log("Reference counts:", referenceCounts);

  // Creazione del testo per l'output dei risultati
  let outputText = `References found: ${finalReferences.length}\n`;
  outputText += finalReferences.join(", ") + "\n\n";

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
