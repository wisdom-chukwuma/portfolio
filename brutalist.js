// Minimal vanilla JS — mobile nav toggle + scroll reveal.
(function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal
  var revealTargets = document.querySelectorAll(
    '.feature-card, .photo, .more-card, .decision-card, .skill-col, .polaroid, .stat-box'
  );

  if ('IntersectionObserver' in window && revealTargets.length) {
    revealTargets.forEach(function (el) {
      el.style.opacity = '0';
      // Draggable elements manage their own transform every frame during
      // drag/throw — a CSS transition on transform would fight that and
      // make dragging feel laggy, so they only get the opacity fade.
      el.style.transition = el.classList.contains('js-throw')
        ? 'opacity 0.4s ease'
        : 'opacity 0.4s ease, transform 0.4s ease';
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.style.opacity = '1'; });
  }
})();

// ---------- Drag & throw physics (hero stat boxes) ----------
// Vanilla Pointer Events, no library. Each .js-throw element can be
// grabbed and flung: it follows the pointer while held (with a light
// tilt driven by horizontal speed), then on release keeps sliding on
// its own velocity, decaying to a stop, while its tilt eases back to
// level. Position is clamped to stay inside the current viewport so a
// hard throw can't lose the element off-screen.
(function () {
  var throwables = document.querySelectorAll('.js-throw');
  if (!throwables.length) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAD = 8; // keep at least this many px on-screen
  var frontZ = 1; // shared "bring to front" counter so two thrown
  // boxes can never end up with equal z-index - whichever was most
  // recently grabbed always renders on top, even after it settles.

  throwables.forEach(function (el) {
    var state = {
      tx: 0, ty: 0, rot: 0,
      vx: 0, vy: 0,
      dragging: false,
      pointerId: null,
      startX: 0, startY: 0,
      startTx: 0, startTy: 0,
      lastX: 0, lastY: 0, lastT: 0,
      home: null,
      raf: null
    };

    // The element's un-transformed ("home") position in document
    // coordinates, derived from its current rect minus whatever
    // translate is already applied — so this stays correct no matter
    // how many times it's already been thrown.
    function computeHome() {
      var rect = el.getBoundingClientRect();
      state.home = {
        left: rect.left + window.scrollX - state.tx,
        top: rect.top + window.scrollY - state.ty,
        width: rect.width,
        height: rect.height
      };
    }

    function bounds() {
      var viewLeft = window.scrollX;
      var viewTop = window.scrollY;
      var viewRight = viewLeft + window.innerWidth;
      var viewBottom = viewTop + window.innerHeight;
      return {
        minTx: viewLeft + PAD - state.home.left,
        maxTx: viewRight - PAD - state.home.width - state.home.left,
        minTy: viewTop + PAD - state.home.top,
        maxTy: viewBottom - PAD - state.home.height - state.home.top
      };
    }

    function clampPosition() {
      var b = bounds();
      if (b.minTx <= b.maxTx) {
        state.tx = Math.min(Math.max(state.tx, b.minTx), b.maxTx);
        state.vx *= state.tx === b.minTx || state.tx === b.maxTx ? 0.4 : 1;
      }
      if (b.minTy <= b.maxTy) {
        state.ty = Math.min(Math.max(state.ty, b.minTy), b.maxTy);
        state.vy *= state.ty === b.minTy || state.ty === b.maxTy ? 0.4 : 1;
      }
    }

    function apply() {
      el.style.transform =
        'translate(' + state.tx.toFixed(1) + 'px, ' + state.ty.toFixed(1) + 'px) ' +
        'rotate(' + state.rot.toFixed(2) + 'deg)';
    }

    function stopInertia() {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = null;
      }
    }

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stopInertia();
      computeHome();
      state.dragging = true;
      state.pointerId = e.pointerId;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.startTx = state.tx;
      state.startTy = state.ty;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      state.lastT = performance.now();
      state.vx = 0;
      state.vy = 0;
      el.classList.add('is-dragging');
      el.style.zIndex = String(++frontZ);
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!state.dragging || e.pointerId !== state.pointerId) return;

      var now = performance.now();
      var dt = Math.max(now - state.lastT, 1);

      state.tx = state.startTx + (e.clientX - state.startX);
      state.ty = state.startTy + (e.clientY - state.startY);
      clampPosition();

      var ivx = (e.clientX - state.lastX) / dt;
      var ivy = (e.clientY - state.lastY) / dt;
      // Exponential moving average so a single jittery sample can't
      // dominate the release velocity.
      state.vx = state.vx * 0.7 + ivx * 0.3;
      state.vy = state.vy * 0.7 + ivy * 0.3;

      if (!reduceMotion) {
        state.rot = Math.max(-9, Math.min(9, state.vx * 14));
      }

      state.lastX = e.clientX;
      state.lastY = e.clientY;
      state.lastT = now;
      apply();
    }

    function onPointerUp(e) {
      if (e.pointerId !== state.pointerId) return;
      state.dragging = false;
      el.classList.remove('is-dragging');
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }

      if (reduceMotion) {
        state.vx = 0;
        state.vy = 0;
        state.rot = 0;
        apply();
        return;
      }
      runInertia();
    }

    function runInertia() {
      var lastT = performance.now();

      function step(now) {
        var dt = Math.min(now - lastT, 48);
        lastT = now;

        state.tx += state.vx * dt;
        state.ty += state.vy * dt;
        clampPosition();

        state.vx *= 0.92;
        state.vy *= 0.92;
        state.rot *= 0.90;

        apply();

        var atRest = Math.abs(state.vx) < 0.01 &&
          Math.abs(state.vy) < 0.01 &&
          Math.abs(state.rot) < 0.15;

        if (atRest) {
          state.vx = 0;
          state.vy = 0;
          state.rot = 0;
          apply();
          state.raf = null;
          return;
        }
        state.raf = requestAnimationFrame(step);
      }

      state.raf = requestAnimationFrame(step);
    }

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  });
})();
