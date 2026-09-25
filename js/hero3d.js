// Hero: a carousel of 3D phones showing real screens from my projects.
// Drag to spin, click a phone to open its project. Built with three.js.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const stage = document.getElementById("stage");
const data = JSON.parse(document.getElementById("stage-data").textContent);
const capTitle = document.getElementById("capTitle");
const capType = document.getElementById("capType");
const capLink = document.getElementById("capLink");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
} catch (e) {
  renderer = null;
}

if (renderer && stage) start();

function start() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-label", "3D carousel of project screens. Drag to spin.");
  renderer.domElement.setAttribute("role", "img");
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // studio reflections so the titanium frame reads as metal
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d3c7, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(3, 6, 7);
  scene.add(sun);

  // iPhone 15 Pro proportions (70.6 x 146.6 x 8.25 mm)
  // screen tall enough for a full 390x844 app screen plus the status bar, same as the frames on the project pages
  const W = 1.1, H = 2.35, D = 0.13, R = 0.17;
  const BEZEL = 0.055, SW = W - 2 * BEZEL - 0.02, SH = H - 2 * BEZEL - 0.02, SR = R - BEZEL - 0.01;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  function rrShape(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function rrGeo(w, h, r) {
    const g = new THREE.ShapeGeometry(rrShape(w, h, r), 12);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let k = 0; k < pos.count; k++) uv.setXY(k, (pos.getX(k) + w / 2) / w, (pos.getY(k) + h / 2) / h);
    return g;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  const frameGeo = new RoundedBoxGeometry(W, H, D, 8, R);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x9c978f, metalness: 0.85, roughness: 0.3 });
  const glassGeo = rrGeo(W - 0.022, H - 0.022, R - 0.012);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.2, roughness: 0.12 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x6f6b64, metalness: 0.3, roughness: 0.55 });
  const screenGeo = rrGeo(SW, SH, SR);
  const btnGeo = new RoundedBoxGeometry(0.018, 1, 0.05, 2, 0.008);
  const bumpGeo = new RoundedBoxGeometry(0.46, 0.46, 0.035, 4, 0.1);
  const lensGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.03, 28);
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0.6, roughness: 0.15 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x8e8980, metalness: 0.9, roughness: 0.25 });

  const ring = new THREE.Group();
  scene.add(ring);
  const phones = [];
  const N = data.length;

  function screenTexture(d, img) {
    const cw = 900, ch = Math.round(cw * SH / SW);
    const c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    const g = c.getContext("2d");
    const bar = Math.round(cw * 0.12);
    if (d.video) {
      // short video frames: blurred copy fills the screen, the real frame sits in the middle (like a TikTok player)
      const cover = Math.max(cw / img.width, ch / img.height);
      g.filter = "blur(28px) brightness(0.55)";
      g.drawImage(img, (cw - img.width * cover) / 2, (ch - img.height * cover) / 2, img.width * cover, img.height * cover);
      g.filter = "none";
      const fit = Math.min(cw / img.width, (ch - bar) / img.height);
      const w = img.width * fit, h = img.height * fit;
      g.drawImage(img, (cw - w) / 2, bar + (ch - bar - h) / 2, w, h);
    } else {
      g.fillStyle = d.bg || "#111"; g.fillRect(0, 0, cw, ch);
      const top = d.status ? bar : 0;
      const k = Math.min(cw / img.width, (ch - top) / img.height);
      const iw = img.width * k;
      g.drawImage(img, (cw - iw) / 2, top, iw, img.height * k);
      if (d.status) { g.fillStyle = d.bg || "#111"; g.fillRect(0, 0, cw, top); }
    }
    // status bar and Dynamic Island, sized like the CSS iPhone frame (percentages of the screen width)
    const u = cw / 100, mid = 6 * u;
    if (d.status || d.video) {
      const fg = d.video ? "#fff" : (d.fg || "#fff");
      g.fillStyle = fg;
      g.font = `600 ${4.6 * u}px -apple-system, 'SF Pro Text', Geist, sans-serif`;
      g.textBaseline = "middle"; g.textAlign = "left"; g.fillText("9:41", 9.5 * u, mid);
      const x0 = cw - 27 * u;
      for (let k = 0; k < 4; k++) { const hh = (k + 1) * 0.75 * u; g.fillRect(x0 + k * 1.3 * u, mid + 1.5 * u - hh, 0.85 * u, hh); }
      g.beginPath(); g.arc(x0 + 9.2 * u, mid + 1.6 * u, 3.2 * u, -Math.PI * 0.76, -Math.PI * 0.24); g.lineTo(x0 + 9.2 * u, mid + 1.6 * u); g.closePath(); g.fill();
      g.globalAlpha = 0.45; g.strokeStyle = fg; g.lineWidth = 0.4 * u; roundRect(g, x0 + 13.4 * u, mid - 1.3 * u, 5.8 * u, 2.8 * u, 0.8 * u); g.stroke(); g.globalAlpha = 1;
      roundRect(g, x0 + 13.9 * u, mid - 0.8 * u, 4.6 * u, 1.8 * u, 0.5 * u); g.fill();
    }
    g.fillStyle = "#000"; roundRect(g, cw / 2 - 16.5 * u, 2.4 * u, 33 * u, 7.2 * u, 3.6 * u); g.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    return tex;
  }

  data.forEach((d, i) => {
    const phone = new THREE.Group();
    const frame = new THREE.Mesh(frameGeo, frameMat);
    const glass = new THREE.Mesh(glassGeo, glassMat); glass.position.z = D / 2 + 0.002;
    const back = new THREE.Mesh(glassGeo, backMat); back.position.z = -D / 2 - 0.002; back.rotation.y = Math.PI;
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const screen = new THREE.Mesh(screenGeo, screenMat); screen.position.z = D / 2 + 0.004;
    phone.add(frame, glass, back, screen);
    // buttons: action + volume on the left, power on the right
    [[0.62, 0.12], [0.36, 0.22], [0.1, 0.22]].forEach(([y, h]) => { const b = new THREE.Mesh(btnGeo, frameMat); b.scale.y = h; b.position.set(-W / 2 - 0.006, y, 0); phone.add(b); });
    const pw = new THREE.Mesh(btnGeo, frameMat); pw.scale.y = 0.32; pw.position.set(W / 2 + 0.006, 0.3, 0); phone.add(pw);
    // triple camera
    const bump = new THREE.Mesh(bumpGeo, backMat); bump.position.set(-W / 2 + 0.3, H / 2 - 0.3, -D / 2 - 0.018); phone.add(bump);
    [[-0.09, 0.09], [-0.09, -0.09], [0.09, 0]].forEach(([x, y]) => {
      const rim = new THREE.Mesh(lensGeo, ringMat); rim.rotation.x = Math.PI / 2; rim.position.set(bump.position.x + x, bump.position.y + y, -D / 2 - 0.045); phone.add(rim);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.032, 24), lensMat); lens.rotation.x = Math.PI / 2; lens.position.copy(rim.position); lens.position.z -= 0.002; phone.add(lens);
    });
    phone.userData = { index: i };
    phone.traverse(o => { o.userData.phone = phone; });
    ring.add(phone);
    phones.push(phone);

    const img = new Image();
    img.onload = () => {
      screenMat.map = screenTexture(d, img);
      screenMat.color.set(0xffffff);
      screenMat.needsUpdate = true;
      if (i === 0) stage.classList.add("ready");
    };
    img.src = d.src;
  });

  // soft shadow under the front phone
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  grad.addColorStop(0, "rgba(40,30,20,0.28)");
  grad.addColorStop(1, "rgba(40,30,20,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -H / 2 - 0.1;
  scene.add(shadow);

  // ---------- cover-flow layout ----------
  // pos is a float index: the phone at round(pos) faces the camera, neighbours angle back.
  let pos = 0, target = 0, dragging = false, lastX = 0, downX = 0, downY = 0, moved = 0, idleAt = performance.now();
  const wrap = (o) => { o = ((o % N) + N) % N; return o > N / 2 ? o - N : o; };
  function layout(t) {
    phones.forEach((p, i) => {
      const o = wrap(i - pos);
      const a = Math.min(Math.abs(o), 3);
      const s = Math.sign(o);
      p.visible = a < 2.6;
      p.position.x = s * (a < 1 ? a * 1.25 : 1.25 + (a - 1) * 0.72);
      p.position.z = -a * 0.95;
      p.position.y = reduce ? 0 : Math.sin(t * 1.1 + i * 1.3) * 0.03;
      p.rotation.y = -s * Math.min(a, 1) * 0.95;
      const sc = (p === hovered ? 1.03 : 1) * (1 - Math.min(a, 2) * 0.06);
      p.scale.setScalar(sc);
    });
  }

  const raycaster = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let hovered = null;
  const canvas = renderer.domElement;

  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ptr, camera);
    const hit = raycaster.intersectObjects(ring.children, true).find(h => h.object.userData.phone && h.object.userData.phone.visible);
    return hit ? hit.object.userData.phone : null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; lastX = downX = e.clientX; downY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved = Math.max(moved, Math.abs(e.clientX - downX), Math.abs(e.clientY - downY));
      pos -= dx / Math.max(160, canvas.clientWidth * 0.45);
      target = pos;
      idleAt = performance.now();
    } else if (e.pointerType === "mouse") {
      hovered = pick(e);
      canvas.style.cursor = hovered ? "pointer" : "grab";
    }
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("dragging");
    target = Math.round(pos);
    idleAt = performance.now();
    if (moved < 6) {
      const hit = pick(e);
      if (hit) {
        const i = hit.userData.index;
        if (i === front) window.location.href = data[i].href;
        else target = pos + wrap(i - pos);
      }
    }
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", () => { dragging = false; target = Math.round(pos); canvas.classList.remove("dragging"); });
  canvas.addEventListener("pointerleave", () => { hovered = null; });

  // keyboard: arrows move one phone, Enter opens the front one
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { target = Math.round(target) - 1; idleAt = performance.now(); }
    if (e.key === "ArrowRight") { target = Math.round(target) + 1; idleAt = performance.now(); }
    if (e.key === "Enter") window.location.href = data[front].href;
  });

  // ---------- sizing ----------
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the front phone about 70% of the stage height, and never wider than the stage allows
    const byHeight = (H / 0.7) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const byWidth = (W * 2.6) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const dist = Math.max(byHeight, byWidth);
    camera.position.set(0, 0.55, dist);
    camera.lookAt(0, -0.02, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---------- loop ----------
  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) loop(); }).observe(stage);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loop(); });

  let front = -1, running = false, last = performance.now(), t = 0;
  function loop() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (!dragging) {
      if (!reduce && now - idleAt > 3600) { target = Math.round(target) + 1; idleAt = now; }
      pos += (target - pos) * Math.min(1, dt * 7);
    }
    layout(t);
    const f = ((Math.round(pos) % N) + N) % N;
    if (f !== front) {
      front = f;
      const d = data[front];
      capTitle.textContent = d.title;
      capType.textContent = d.type;
      capLink.href = d.href;
      capLink.setAttribute("aria-label", "Open " + d.title);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  loop();
}
