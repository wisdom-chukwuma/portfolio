document.getElementById('year').textContent = new Date().getFullYear();

const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach((el) => io.observe(el));

const cubeStage = document.getElementById('heroCube');
if (cubeStage) {
  let rotX = -18;
  let rotY = 0;
  let velX = 0;
  let velY = 0.12;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const applyTransform = () => {
    cubeStage.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };
  applyTransform();

  cubeStage.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    cubeStage.classList.add('dragging');
    cubeStage.setPointerCapture(e.pointerId);
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velY = dx * 0.5;
    velX = -dy * 0.5;
    rotY += velY;
    rotX = Math.max(-70, Math.min(60, rotX + velX));
    applyTransform();
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
    cubeStage.classList.remove('dragging');
  });

  const tick = () => {
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

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
