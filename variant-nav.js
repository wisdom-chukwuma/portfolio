(function () {
  "use strict";
  var current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".variant-switch a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      a.classList.add("is-active");
    }
  });
})();
