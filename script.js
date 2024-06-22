"use strict";

const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const check = document.querySelector(".Check");
const textareaList = document.querySelectorAll("textarea");

// Debug: Verifica che gli elementi siano trovati
console.log('DLQtext:', DLQtext);
console.log('Results:', results);
console.log('Check:', check);

check.addEventListener("click", (e) => {
  e.preventDefault();

  // Debug: Verifica se il click è stato registrato
  console.log('Check button clicked');

  // Prende il valore dalla prima textarea e lo memorizza in una variabile
  const dlqText = DLQtext.value;

  // Debug: mostra il contenuto del testo
  console.log('DLQtext value:', dlqText);

  // Regex per trovare tutte le reference che iniziano con EC0 o CM_EC0
  const allReferences = Array.from(
    dlqText.matchAll(/\b(EC0\d{7}(?:-\w+)*|CM_EC0\d+(?:-\w+)*(?:_\w+)*(?:_\d+)*(?:-\w+)*)\b/g),
    (match) => match[0]
  );

  // Filter references to exclude those ending with -STD or not matching the pattern
  const filteredReferences = allReferences.filter(ref => {
    // Exclude references ending with -STD
    if (ref.endsWith("-STD")) {
      return false;
    }
    // Check if the reference ends with numbers after the second "-"
    if (ref.match(/-\d+[A-Za-z0-9]*$/)) {
      return true;
    }
    // Check if the reference has letters followed by numbers after the second "-"
    if (ref.match(/-\w+[A-Za-z0-9]*$/)) {
      return true;
    }
    return false;
  });

  // Use a Set to remove duplicates and count occurrences
  const uniqueReferences = [...new Set(filteredReferences)];
  const referenceCounts = {};

  allReferences.forEach(ref => {
    if (uniqueReferences.includes(ref)) {
      if (!referenceCounts[ref]) {
        referenceCounts[ref] = 0;
      }
      referenceCounts[ref]++;
    }
  });

  // Filter references that end with only letters after the second "-"
  const finalReferences = uniqueReferences.filter(ref => {
    const parts = ref.split("-");
    if (parts.length > 2) {
      const afterSecondDash = parts[2];
      return afterSecondDash.match(/^\d+$/) || afterSecondDash.match(/^\w+\d+$/);
    }
    return true;
  });

  // Debug: mostra le reference trovate e il conteggio dei duplicati
  console.log('References found:', finalReferences);
  console.log('Reference counts:', referenceCounts);

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
