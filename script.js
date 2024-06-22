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
  const externalReferencesInDLQ = Array.from(
    dlqText.matchAll(/\b(EC0\d{7}(-\w+)*|CM_EC0\d+(-\w+)*(_\w+)*(_\d+)*(-\w+)*)\b/g),
    (match) => match[0]
  );

  // Usa un Set per rimuovere i duplicati
  const uniqueReferences = [...new Set(externalReferencesInDLQ)];

  // Debug: mostra le reference trovate
  console.log('References found:', uniqueReferences);

  // Invia i risultati nella terza textarea
  results.textContent = `References found: ${uniqueReferences.length}\n` + uniqueReferences.join(", ");
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
