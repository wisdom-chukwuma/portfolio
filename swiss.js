(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Interactive wireframe cube — drag to rotate, real CSS 3D
  var wireStage = document.getElementById("heroWireStage");
  if (wireStage) {
    var rotX = -18;
    var rotY = 0;
    var velX = 0;
    var velY = 0.12;
    var dragging = false;
    var lastX = 0;
    var lastY = 0;

    var applyTransform = function () {
      wireStage.style.transform = "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
    };
    applyTransform();

    wireStage.addEventListener("pointerdown", function (e) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      wireStage.classList.add("dragging");
      wireStage.setPointerCapture(e.pointerId);
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = dx * 0.5;
      velX = -dy * 0.5;
      rotY += velY;
      rotX = Math.max(-70, Math.min(60, rotX + velX));
      applyTransform();
    });
    window.addEventListener("pointerup", function () {
      dragging = false;
      wireStage.classList.remove("dragging");
    });

    var tick = function () {
      if (!dragging) {
        velX *= 0.94;
        velY += (0.12 - velY) * 0.02;
        rotY += velY;
        rotX += velX + (-18 - rotX) * 0.012;
        applyTransform();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Scroll reveal for sections
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    revealEls.forEach(function (el) { el.classList.add("pre-reveal"); });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }
})();
