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

  /* ---------- interactive hero terminal ---------- */
  var termInput = document.getElementById("termInput");
  var termOutput = document.getElementById("termOutput");

  if (termInput && termOutput) {
    var history = [];
    var historyPos = -1;

    var goTo = function (id) {
      var el = document.querySelector(id);
      if (el) setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 500);
    };

    var commands = {
      help: function () {
        return "available commands:\n  whoami        who is wisdom\n  skills        stack summary\n  projects      list of shipped work\n  wiscot        jump to the flagship project\n  ai            jump to AI & creative work\n  contact       how to reach me\n  github        open my GitHub\n  sudo hire-me  ;)\n  clear         clear this terminal";
      },
      whoami: function () {
        return "Wisdom Chukwuma — full-stack developer, 3D web engineer, and AI engineer.\nLagos, Nigeria. Open to new opportunities.";
      },
      skills: function () {
        return "backend      Python (Django, DRF, Channels), PHP, PostgreSQL, MySQL, Redis\nrealtime     WebSockets, WebRTC, Three.js / WebGL\nfrontend     JavaScript, React, Vite, Tailwind\nplatform     OAuth, Web Push / PWA, Capacitor, Flutterwave\nai           Gemini Veo, ElevenLabs, ComfyUI, Cloudinary, Piper TTS, ffmpeg pipelines\n\ntype 'cd skills' in the nav above for the full breakdown.";
      },
      projects: function () {
        return "wiscot             real-time platform — django, channels, three.js — live\nrentnest           property rental app — react, vite — in development\nstudypath          gamified study platform — live\nworship-the-king   church youth-week app — firebase, pwa — live\ngala-fpl           client leaderboard — php, mysql — live\neagle-team         member portal + store — php, mysql — live client\nwappydrama         ai drama generator — gemini veo\nwappytales         self-hosted ai film pipeline — comfyui, kaggle gpu\nwoverico           faceless short-form video pipeline\ntbt                short-form video series — piper tts, whisper";
      },
      ls: function () { return commands.projects(); },
      wiscot: function () { goTo("#wiscot"); return "→ jumping to wiscot.md ..."; },
      ai: function () { goTo("#ai-creative"); return "→ jumping to ai-creative ..."; },
      skillset: function () { goTo("#skills"); return "→ jumping to skills ..."; },
      contact: function () {
        goTo("#contact");
        return "email    kenewisdom4@gmail.com\nx        x.com/wisdomchukwumaa\ngithub   github.com/wisdom-chukwuma";
      },
      github: function () { window.open("https://github.com/wisdom-chukwuma", "_blank", "noopener"); return "→ opening github.com/wisdom-chukwuma ..."; },
      "sudo hire-me": function () { return "permission granted. → kenewisdom4@gmail.com"; },
      clear: function () { termOutput.innerHTML = ""; return null; },
    };

    var printLine = function (cmd, output, isError) {
      if (cmd !== null) {
        var cmdEl = document.createElement("div");
        cmdEl.className = "out-cmd";
        cmdEl.textContent = cmd;
        termOutput.appendChild(cmdEl);
      }
      if (output) {
        var bodyEl = document.createElement("div");
        bodyEl.className = isError ? "out-error" : "out-body";
        bodyEl.textContent = output;
        termOutput.appendChild(bodyEl);
      }
      termOutput.scrollTop = termOutput.scrollHeight;
    };

    printLine(null, "type 'help' to see what this does");

    termInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var raw = termInput.value.trim();
        if (!raw) return;
        history.push(raw);
        historyPos = history.length;
        var key = raw.toLowerCase();
        var handler = commands[key];
        if (handler) {
          var result = handler();
          printLine(raw, result);
        } else {
          printLine(raw, "command not found: " + raw + " — type 'help'", true);
        }
        termInput.value = "";
      } else if (e.key === "ArrowUp") {
        if (history.length) {
          historyPos = Math.max(0, historyPos - 1);
          termInput.value = history[historyPos] || "";
          e.preventDefault();
        }
      } else if (e.key === "ArrowDown") {
        if (history.length) {
          historyPos = Math.min(history.length, historyPos + 1);
          termInput.value = history[historyPos] || "";
          e.preventDefault();
        }
      }
    });
  }
})();
