// DOM Elements

const textareaList = document.querySelectorAll("textarea");

textareaList.forEach(function (textarea) {
  textarea.addEventListener("click", function () {
    this.removeAttribute("placeholder");
  });
});
