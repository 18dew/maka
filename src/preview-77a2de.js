// MAKA explainer — interactions
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- topbar ---------- */
const topbar = document.getElementById("topbar");
const onScrollBar = () => topbar.classList.toggle("scrolled", window.scrollY > 12);
window.addEventListener("scroll", onScrollBar, { passive: true });
onScrollBar();

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".rv").forEach((el) => {
  if (prefersReduced) el.classList.add("on"); else io.observe(el);
});

/* ---------- hero canvas: drifting scalar field ---------- */
(() => {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr, pts = [], raf = null;

  const ACCENT = "oklch(0.905 0.21 128)";
  const CYAN = "oklch(0.82 0.11 215)";

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    const count = Math.min(90, Math.floor((w * h) / 16000));
    pts = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.6 + 0.7,
      c: i % 7 === 0 ? CYAN : ACCENT,
      tw: Math.random() * Math.PI * 2,
    }));
  }

  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    // link lines
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 150 * 150) {
          ctx.globalAlpha = (1 - Math.sqrt(d2) / 150) * 0.10;
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
      const pulse = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t / 900 + p.tw));
      ctx.globalAlpha = pulse;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  resize(); seed();
  window.addEventListener("resize", () => { resize(); seed(); if (prefersReduced) drawStatic(); });
  if (prefersReduced) { drawStatic(); } else { raf = requestAnimationFrame(frame); }

  // pause when hero off-screen
  new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    if (prefersReduced) return;
    if (vis && raf === null) raf = requestAnimationFrame(frame);
    if (!vis && raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }).observe(canvas);
})();

/* ---------- protocol stepper ---------- */
const STEPS = [
  {
    tag: "Phase 1 · Classical · Present day",
    title: "Harvest the keys",
    body: `The adversary passively collects <strong>n ECDSA public keys</strong> from intercepted traffic,
      blockchain transactions, and certificates. Each public key Q<sub>i</sub> hides a private scalar d<sub>i</sub>
      that nobody can classically recover.`,
    extra: `<div class="keyrow">
      <span class="kchip unk">Q₁ = d₁·G</span><span class="kchip unk">Q₂ = d₂·G</span>
      <span class="kchip unk">Q₃ = d₃·G</span><span class="kchip">…</span>
      <span class="kchip unk">Q<sub>n</sub> = d<sub>n</sub>·G</span></div>
      <p style="font-size:13.5px;color:var(--text-dim);font-family:var(--font-mono)">Cost so far: storage only. No quantum hardware involved.</p>`,
  },
  {
    tag: "Phase 2 · Classical pre-processing",
    title: "Mix with a matrix",
    body: `Choose an <strong>invertible n×n matrix A</strong> over Z<sub>q</sub> — the attacker picks the entries,
      so they are all known. Each row of A blends the public keys into one composite point using only
      point addition and scalar multiplication.`,
    extra: `<div class="math">C<sub>i</sub> = Σ<sub>j</sub> <span class="cy">a<sub>ij</sub></span>·Q<sub>j</sub>
      = ( Σ<sub>j</sub> <span class="cy">a<sub>ij</sub></span><span class="hl">d<sub>j</sub></span> )·G<br>
      <span class="dm">// invertible ⇔ det(A) ≢ 0 (mod q) — random A works w.p. ≈ 1</span></div>
      <div class="keyrow" style="margin-top:14px">
      <span class="kchip comp">C₁</span><span class="kchip comp">C₂</span><span class="kchip comp">C₃</span><span class="kchip">…</span><span class="kchip comp">C<sub>n</sub></span></div>`,
  },
  {
    tag: "Phase 3 · Classical pre-processing",
    title: "Inject known points",
    body: `Add attacker-chosen <strong>known scalars k<sub>i</sub></strong> as curve points k<sub>i</sub>·G.
      This shifts every hidden composite scalar by a known amount — a controlled offset that will be
      subtracted out later, keeping the system solvable.`,
    extra: `<div class="math">C′<sub>i</sub> = C<sub>i</sub> + <span class="cy">k<sub>i</sub></span>·G
      = ( Σ<sub>j</sub> a<sub>ij</sub>d<sub>j</sub> + <span class="cy">k<sub>i</sub></span> )·G</div>
      <p style="font-size:13.5px;color:var(--text-dim);font-family:var(--font-mono);margin-top:14px">The injection method also lets known and unknown scalars multiply inside matrix products, creating coupled equations that share the same unknowns.</p>`,
  },
  {
    tag: "Phase 4 · Quantum · The only expensive step",
    title: "Crack the composites",
    body: `Run <strong>Shor's algorithm on the composite points</strong> to learn their hidden scalars c′<sub>i</sub>.
      Subtracting the known k<sub>i</sub> offsets yields the vector <strong>c = A·d</strong> — n linear equations
      in the n private keys. If the keys share structure (HD wallets, common seeds), far fewer than n runs suffice.`,
    extra: `<div class="math">Shor(C′<sub>i</sub>) → c′<sub>i</sub> &nbsp;⇒&nbsp; c<sub>i</sub> = c′<sub>i</sub> − <span class="cy">k<sub>i</sub></span><br>
      <span class="dm">// cost: k quantum runs, k = # of independent unknowns ≤ n</span></div>`,
  },
  {
    tag: "Phase 5 · Classical post-processing",
    title: "Invert and recover everything",
    body: `Solve the linear system over Z<sub>q</sub>. Gaussian elimination costs O(n³); Strassen's algorithm
      brings it to O(n<sup>2.807</sup>) — either way, trivial next to quantum time. Out fall
      <strong>all the private keys at once</strong>.`,
    extra: `<div class="math">d = <span class="hl">A<sup>−1</sup></span>·c (mod q)<br>
      <span class="dm">// ⇒ d₁, d₂, …, d<sub>n</sub> recovered</span></div>
      <div class="keyrow" style="margin-top:14px">
      <span class="kchip comp">d₁ ✓</span><span class="kchip comp">d₂ ✓</span><span class="kchip comp">d₃ ✓</span><span class="kchip">…</span><span class="kchip comp">d<sub>n</sub> ✓</span></div>`,
  },
];

(() => {
  const list = document.getElementById("steplist");
  const tagEl = document.getElementById("stage-tag");
  const titleEl = document.getElementById("stage-title");
  const bodyEl = document.getElementById("stage-body");
  const extraEl = document.getElementById("stage-extra");
  const animEl = document.getElementById("stageanim");
  const prevBtn = document.getElementById("stepPrev");
  const nextBtn = document.getElementById("stepNext");
  const countEl = document.getElementById("stepcount");
  if (!list) return;
  let idx = 0;

  STEPS.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "stepbtn";
    b.setAttribute("role", "tab");
    b.innerHTML = `<span class="n">0${i + 1}</span><span class="t">${s.title}</span>`;
    b.addEventListener("click", () => go(i));
    list.appendChild(b);
  });
  const buttons = [...list.children];

  function render() {
    const s = STEPS[idx];
    tagEl.textContent = s.tag;
    titleEl.textContent = s.title;
    bodyEl.innerHTML = s.body;
    extraEl.innerHTML = s.extra;
    buttons.forEach((b, i) => {
      b.classList.toggle("active", i === idx);
      b.setAttribute("aria-selected", i === idx ? "true" : "false");
    });
    countEl.textContent = `${idx + 1} / ${STEPS.length}`;
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === STEPS.length - 1;
    prevBtn.style.opacity = idx === 0 ? ".45" : "1";
    nextBtn.style.opacity = idx === STEPS.length - 1 ? ".45" : "1";
  }

  function go(i) {
    const next = Math.max(0, Math.min(STEPS.length - 1, i));
    if (next === idx) return;
    idx = next;
    if (prefersReduced) { render(); return; }
    animEl.classList.add("swap");
    setTimeout(() => { render(); animEl.classList.remove("swap"); }, 180);
  }

  prevBtn.addEventListener("click", () => go(idx - 1));
  nextBtn.addEventListener("click", () => go(idx + 1));
  document.getElementById("stepstage").addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(idx + 1);
    if (e.key === "ArrowLeft") go(idx - 1);
  });
  render();
})();

/* ---------- worked-example batch size tabs ---------- */
(() => {
  const tabs = document.querySelectorAll(".extab");
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll(".excase").forEach((c) => {
        c.classList.toggle("active", c.id === tab.dataset.target);
      });
    });
  });
})();

/* ---------- back to top ---------- */
document.getElementById("toTop").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
});
