(function () {
  "use strict";

  // Light / dark toggle (remembers the choice; otherwise follows the device)
  var themeBtn = document.querySelector(".theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var root = document.documentElement;
      var current = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var links = document.getElementById("links");
  if (btn && links) {
    btn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) { links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    });
  }

  // Header border once the page scrolls
  var top = document.querySelector(".top");
  if (top) {
    var onScroll = function () { top.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Project images tilt in 3D toward the pointer (mouse and pen only, and not for reduced motion)
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!reduce && finePointer) {
    document.querySelectorAll("[data-tilt]").forEach(function (host) {
      var el = host.querySelector(".tilt");
      if (!el) return;
      host.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 8).toFixed(2) + "deg) translateZ(0)";
      });
      host.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  // Local time in Lagos, 24-hour
  var clock = document.getElementById("lagosTime");
  if (clock) {
    var tick = function () {
      try {
        clock.textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" });
      } catch (err) { clock.textContent = ""; }
    };
    tick();
    setInterval(tick, 30000);
  }
})();
