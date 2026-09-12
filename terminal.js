// terminal.js — small vanilla-JS interactions for the terminal-native variant
(function () {
  "use strict";

  /* ---------- blinking cursor after hero role text ---------- */
  var heroRole = document.querySelector(".hero-role");
  if (heroRole) {
    var cursor = document.createElement("span");
    cursor.className = "blink-cursor";
    heroRole.appendChild(cursor);
  }

  /* ---------- scroll-reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- active nav link on scroll ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navLinks
    .map(function (a) {
      var id = a.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return null;
      var el = document.querySelector(id);
      return el ? { link: a, el: el } : null;
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var navIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = sections.find(function (s) { return s.el === entry.target; });
          if (!match) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (a) { a.classList.remove("active"); });
            match.link.classList.add("active");
          }
        });
      },
      { threshold: 0, rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach(function (s) { navIo.observe(s.el); });
  }
})();
