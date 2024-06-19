"use strict";

const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const check = document.querySelector(".Check");
const textareaList = document.querySelectorAll("textarea");

check.addEventListener("click", (e) => {
  e.preventDefault();

  // take the value from the first text area and store in a variable
  const dlqText = DLQtext.value;

  // Regex to find "externalReference": and catch what follows
  const externalReferencesInDLQ = Array.from(
    dlqText.matchAll(/"externalReference":\s*"(.*?)"/g),
    (match) => match[1]
  );

  // Send the results in the third textarea
  results.textContent = externalReferencesInDLQ.join(", ");
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
