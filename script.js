"use strict";

const DLQtext = document.querySelector(".DLQtext");
const incidents = document.querySelector(".Incidents");
const results = document.querySelector(".Results");
const check = document.querySelector(".Check");
const textareaList = document.querySelectorAll("textarea");

check.addEventListener("click", (e) => {
  e.preventDefault();

  // take the value from the first text area and store in a variable
  const dlqText = DLQtext.value;
  // idem for the incident textarea
  const incidentsText = incidents.value;

  // Regex to find "externalReference": and catch what follows
  const externalReferencesInDLQ = Array.from(
    dlqText.matchAll(/"externalReference":\s*"(.*?)"/g),
    (match) => match[1]
  );

  // Split the reference in the incident
  const referencesInIncidents = incidentsText.split(/\s+/);

  // Find the difference between the two lists of reference
  const difference = externalReferencesInDLQ.filter(
    (reference) => !referencesInIncidents.includes(reference)
  );

  // Send the results in the third textarea
  results.textContent = difference.join(", ");
});

// remove the placeholder when you click
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
