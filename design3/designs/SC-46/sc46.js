// SC-46's mockups: the icons (design system v3's set), the password toggle, and the states the board links to
(function () {
  var dark = window.SC46.dark;
  document.querySelectorAll(".app").forEach(function (el) { el.setAttribute("data-theme", dark ? "dark" : "light"); });
  function draw(root) {
    (root || document).querySelectorAll("i[data-icon]").forEach(function (i) {
      var s = i.getAttribute("data-size") || 18;
      i.outerHTML = '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (window.SC3_ICONS[i.getAttribute("data-icon")] || "") + "</svg>";
    });
  }
  draw();
  document.querySelectorAll(".sc46-eye").forEach(function (b) {
    b.addEventListener("click", function () {
      var input = b.parentElement.querySelector("input"), show = input.type === "password";
      input.type = show ? "text" : "password";
      b.setAttribute("aria-pressed", String(show));
      b.setAttribute("aria-label", show ? "Hide password" : "Show password");
      b.innerHTML = '<i data-icon="' + (show ? "eye-off" : "eye") + '" data-size="20"></i>';
      draw(b);
    });
  });
  function step(n) {
    document.querySelectorAll(".sc46-step").forEach(function (s) { s.hidden = s.getAttribute("data-step") !== String(n); });
  }
  window.SC46next = function (e) { e.preventDefault(); step(2); return false; };
  window.SC46back = function () { step(1); };
  window.SC46submit = function (e) {
    e.preventDefault();
    var err = document.querySelector(".sc46-step:not([hidden]) .sc46-error, form > .sc46-error");
    if (err) err.hidden = false;
    return false;
  };
  if (window.SC46.option === "b" && window.SC46.step === "2") step(2);
  if (window.SC46.state === "error") document.querySelectorAll(".sc46-error").forEach(function (x) { x.hidden = false; x.closest(".sc46-step") || 0; });
})();
