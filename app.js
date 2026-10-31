/* Yasmins Blomster: drawings, the bouquet builder, opening hours, motion. */
(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = {
    gold: "#c9a45c", goldHi: "#e3c47f", goldLo: "#8a6f3a",
    ivory: "#f1ead9", leaf: "#4f5a3c", leafHi: "#6f7d55", ground: "#11130f",
  };

  /* ---------- small helpers ---------- */
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const PETAL = "M0 0 C 7 -6, 12 -22, 5 -34 C 1 -38, -5 -34, -6 -26 C -7 -16, -4 -6, 0 0 Z";
  const LEAF = "M0 0 C 8 -9, 26 -10, 40 0 C 26 8, 8 8, 0 0 Z";
  const BUD = "M0 0 C 4 -6, 5 -16, 0 -24 C -5 -16, -4 -6, 0 0 Z";

  function jasmine(parent, x, y, scale, rot, cls = "bloom") {
    const outer = el("g", { transform: `translate(${x} ${y}) rotate(${rot}) scale(${scale})` }, parent);
    const g = el("g", { class: cls }, outer);
    for (let i = 0; i < 5; i++) {
      el("path", { d: PETAL, transform: `rotate(${i * 72})`, fill: C.ivory, stroke: C.gold, "stroke-width": 1.1 / scale, "stroke-linejoin": "round" }, g);
    }
    el("circle", { r: 3.2, fill: C.gold }, g);
    el("circle", { r: 1.4, fill: C.ground }, g);
    return g;
  }

  function leaf(parent, x, y, angle, scale, cls = "leaf") {
    const outer = el("g", { transform: `translate(${x} ${y}) rotate(${angle}) scale(${scale})` }, parent);
    const g = el("g", { class: cls }, outer);
    el("path", { d: LEAF, fill: C.leaf, stroke: C.gold, "stroke-width": 0.9 / scale, "stroke-linejoin": "round" }, g);
    el("path", { d: "M2 0 L 36 0", stroke: C.goldLo, "stroke-width": 0.8 / scale, fill: "none" }, g);
    return g;
  }

  function bud(parent, x, y, angle, scale) {
    const outer = el("g", { transform: `translate(${x} ${y}) rotate(${angle}) scale(${scale})` }, parent);
    const g = el("g", { class: "bud" }, outer);
    el("path", { d: BUD, fill: "#d9c7b0", stroke: C.gold, "stroke-width": 1 / scale }, g);
    return g;
  }

  /* Draw a sprig: stems, then leaves in opposite pairs, flowers and buds at the ends. */
  function sprig(svg, spec, seed) {
    const r = rng(seed);
    const stemsG = el("g", { fill: "none", stroke: C.gold, "stroke-width": spec.stroke || 2, "stroke-linecap": "round" }, svg);
    const leavesG = el("g", {}, svg);
    const flowersG = el("g", {}, svg);
    const parts = { stems: [], leaves: [], flowers: [], buds: [] };

    spec.stems.forEach((d, si) => {
      const p = el("path", { d, class: "stem" }, stemsG);
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.setProperty("--len", len);
      parts.stems.push({ p, len, order: si });

      const pairs = spec.leafPairs?.[si] ?? 3;
      for (let k = 1; k <= pairs; k++) {
        const t = k / (pairs + 1);
        const a = p.getPointAtLength(len * t);
        const b = p.getPointAtLength(Math.min(len, len * t + 1));
        const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        const s = (spec.leafScale || 1) * (0.75 + r() * 0.4);
        parts.leaves.push({ g: leaf(leavesG, a.x, a.y, ang - 48, s), t, si });
        parts.leaves.push({ g: leaf(leavesG, a.x, a.y, ang + 48, s * 0.92), t, si });
      }
      const end = p.getPointAtLength(len);
      if (spec.flowerAt?.includes(si)) {
        parts.flowers.push({ g: jasmine(flowersG, end.x, end.y, (spec.flowerScale || 1) * (0.9 + r() * 0.3), r() * 72), si });
      } else {
        const pre = p.getPointAtLength(len - 1);
        const ang = (Math.atan2(end.y - pre.y, end.x - pre.x) * 180) / Math.PI + 90;
        parts.buds.push({ g: bud(flowersG, end.x, end.y, ang, spec.flowerScale || 1), si });
      }
    });
    (spec.extraFlowers || []).forEach(([x, y, s]) => parts.flowers.push({ g: jasmine(flowersG, x, y, s, r() * 72), si: 99 }));
    return parts;
  }

  function animateSprig(parts, base = 0) {
    if (reduce) return;
    const ease = "cubic-bezier(.3,.7,.2,1)";
    parts.stems.forEach(({ p, len, order }) => {
      p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1800, delay: base + order * 260, easing: ease, fill: "backwards" });
    });
    parts.leaves.forEach(({ g, t, si }) => {
      g.animate([{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 700, delay: base + si * 260 + t * 1500, easing: ease, fill: "backwards" });
    });
    parts.buds.forEach(({ g, si }) => {
      g.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 600, delay: base + si * 260 + 1600, easing: ease, fill: "backwards" });
    });
    parts.flowers.forEach(({ g, si }, i) => {
      const d = base + Math.min(si, 6) * 260 + 1500 + i * 90;
      g.animate([{ transform: "rotate(-70deg) scale(0)" }, { transform: "rotate(8deg) scale(1.08)", offset: 0.75 }, { transform: "rotate(0) scale(1)" }], { duration: 1300, delay: d, easing: ease, fill: "backwards" });
    });
  }

  /* ---------- hero branch ---------- */
  const heroSvg = document.querySelector(".branch");
  if (heroSvg) {
    const parts = sprig(heroSvg, {
      stroke: 2.2,
      stems: [
        "M110 760 C 150 620, 140 540, 220 440 S 380 310, 420 180 S 470 70, 520 40",
        "M232 428 C 290 420, 370 450, 460 400",
        "M318 330 C 270 300, 210 270, 160 200",
        "M425 168 C 475 180, 520 215, 562 268",
        "M150 610 C 210 596, 268 616, 338 586",
        "M362 280 C 400 270, 440 290, 470 320",
        "M460 400 C 490 380, 520 380, 550 396",
        "M190 236 C 170 200, 168 160, 190 120",
      ],
      leafPairs: [5, 2, 2, 2, 2, 1, 0, 1],
      leafScale: 1.05,
      flowerAt: [0, 1, 2, 3, 4, 5, 7],
      flowerScale: 1.25,
      extraFlowers: [[500, 72, 0.95], [548, 52, 0.8], [176, 214, 0.9], [480, 418, 1.0], [340, 600, 0.85]],
    }, 7);
    heroSvg.querySelectorAll(".bloom").forEach((g, i) => g.style.setProperty("--i", i));
    animateSprig(parts, 200);

    // breathing and sway after the draw, and a scroll/pointer drift
    const art = document.querySelector(".hero-art");
    if (!reduce && art) {
      const sway = heroSvg.animate([{ transform: "rotate(-1.2deg)" }, { transform: "rotate(1.2deg)" }], { duration: 7000, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
      heroSvg.style.transformOrigin = "20% 100%";
      parts.flowers.forEach(({ g }, i) => {
        g.parentNode.animate([{ opacity: 1 }, { opacity: 0.82 }], { duration: 3000 + i * 230, delay: 3200, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
      });
      let px = 0, py = 0, sy = 0, raf = 0;
      const apply = () => {
        raf = 0;
        art.style.transform = `translate3d(${px * 14}px, ${py * 10 + sy * 0.18}px, 0)`;
      };
      window.addEventListener("pointermove", (e) => {
        px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      window.addEventListener("scroll", () => {
        sy = Math.min(scrollY, innerHeight);
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      void sway;
    }
  }

  /* ---------- pollen: a few gold motes drifting up in the dark ---------- */
  const canvas = document.querySelector(".pollen");
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, motes = [];
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(60, (w * h) / 9000));
      motes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8,
        vy: 0.12 + Math.random() * 0.35, ph: Math.random() * 6.28, sp: 0.4 + Math.random(),
      }));
    };
    resize();
    addEventListener("resize", resize);
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    const tick = (t) => {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const m of motes) {
          m.y -= m.vy; m.x += Math.sin(t / 1600 + m.ph) * 0.25;
          if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
          const a = 0.35 + 0.45 * Math.sin(t / 700 * m.sp + m.ph) ** 2;
          ctx.fillStyle = `rgba(227,196,127,${a})`;
          ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill();
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- botanical plate (drawn when it scrolls into view) ---------- */
  const plate = document.querySelector(".plate");
  if (plate) {
    const parts = sprig(plate, {
      stroke: 1.6,
      stems: [
        "M200 520 C 205 430, 190 360, 210 280 S 230 150, 200 60",
        "M206 330 C 250 320, 290 290, 320 240",
        "M212 250 C 170 240, 130 210, 100 160",
        "M215 170 C 250 160, 280 130, 300 90",
        "M204 420 C 160 410, 120 420, 90 390",
      ],
      leafPairs: [4, 2, 2, 1, 2],
      leafScale: 0.9,
      flowerAt: [0, 1, 2, 3],
      flowerScale: 1.05,
      extraFlowers: [[228, 74, 0.8], [178, 84, 0.7], [334, 262, 0.75]],
    }, 21);
    const hidden = !reduce;
    if (hidden) plate.style.visibility = "hidden";
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      plate.style.visibility = "";
      animateSprig(parts, 0);
    }, { threshold: 0.3 }).observe(plate);
  }

  /* ---------- small drawings for the shop list ---------- */
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };
  function rose(g, x, y, r, c) {
    el("circle", { cx: x, cy: y, r, fill: c }, g);
    el("path", {
      d: `M${x} ${y} m-${r * 0.15} 0 a${r * 0.2} ${r * 0.2} 0 1 1 ${r * 0.35} ${r * 0.1} a${r * 0.45} ${r * 0.45} 0 1 1 -${r * 0.75} -${r * 0.2} a${r * 0.7} ${r * 0.7} 0 1 1 ${r * 1.2} ${r * 0.4}`,
      fill: "none", stroke: shade(c, 0.62), "stroke-width": Math.max(1, r * 0.09), "stroke-linecap": "round",
    }, g);
  }
  function daisy(g, x, y, r, c, rot = 0) {
    const gg = el("g", { transform: `translate(${x} ${y}) rotate(${rot})` }, g);
    for (let i = 0; i < 6; i++) el("ellipse", { cx: 0, cy: -r * 0.55, rx: r * 0.32, ry: r * 0.55, fill: c, transform: `rotate(${i * 60})` }, gg);
    el("circle", { r: r * 0.28, fill: C.gold }, gg);
  }
  function filler(g, x, y, r, c) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.283;
      el("circle", { cx: x + Math.cos(a) * r * 0.6, cy: y + Math.sin(a) * r * 0.6, r: r * 0.32, fill: c }, g);
    }
  }
  function smallLeaf(g, x, y, ang, s, c = C.leafHi) {
    el("path", { d: LEAF, transform: `translate(${x} ${y}) rotate(${ang}) scale(${s})`, fill: c }, g);
  }

  const ARTS = {
    season(svg) {
      const g = el("g", {}, svg);
      el("path", { d: "M60 112 L52 64 M60 112 L70 60 M60 112 L40 70 M60 112 L84 72", stroke: C.gold, "stroke-width": 1.5, fill: "none" }, g);
      smallLeaf(g, 50, 70, -150, 0.7); smallLeaf(g, 72, 66, -30, 0.7);
      rose(g, 52, 50, 15, "#d98e8e"); daisy(g, 78, 56, 13, C.ivory, 12); rose(g, 38, 66, 11, "#e9c46a"); filler(g, 86, 76, 9, "#c97b5a"); daisy(g, 62, 30, 10, "#e9c46a");
    },
    roses(svg) {
      const g = el("g", {}, svg);
      el("path", { d: "M60 114 L48 52 M60 114 L60 46 M60 114 L74 52", stroke: C.gold, "stroke-width": 1.5, fill: "none" }, g);
      smallLeaf(g, 54, 80, -150, 0.6); smallLeaf(g, 66, 76, -30, 0.6);
      rose(g, 44, 46, 14, "#8f2d3a"); rose(g, 76, 46, 14, "#a8323f"); rose(g, 60, 30, 15, "#7a2431");
    },
    orchid(svg) {
      const g = el("g", {}, svg);
      el("path", { d: "M38 88 L82 88 L76 114 L44 114 Z", fill: C.goldLo }, g);
      el("path", { d: "M58 88 C 56 60, 62 40, 86 24", stroke: C.gold, "stroke-width": 1.5, fill: "none" }, g);
      smallLeaf(g, 58, 88, -160, 0.75, C.leaf); smallLeaf(g, 60, 88, -20, 0.75, C.leaf);
      [[66, 44, 11], [80, 30, 9], [56, 60, 10]].forEach(([x, y, r]) => daisy(g, x, y, r, C.ivory, 18));
    },
    bride(svg) {
      const g = el("g", {}, svg);
      el("path", { d: "M54 70 L56 114 L64 114 L66 70 Z", fill: C.ivory }, g);
      smallLeaf(g, 34, 60, 160, 0.6); smallLeaf(g, 86, 60, 20, 0.6);
      rose(g, 46, 54, 13, "#f6dfd2"); rose(g, 74, 54, 13, "#f2c4b0"); daisy(g, 60, 38, 12, C.ivory); rose(g, 60, 62, 12, "#e7a9a0"); filler(g, 34, 44, 7, C.ivory); filler(g, 86, 44, 7, C.ivory);
    },
    wreath(svg) {
      const g = el("g", {}, svg);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 360;
        const x = 60 + Math.cos((a * Math.PI) / 180) * 38, y = 62 + Math.sin((a * Math.PI) / 180) * 38;
        smallLeaf(g, x, y, a + 100, 0.5, i % 2 ? C.leaf : C.leafHi);
      }
      rose(g, 60, 98, 11, C.ivory); daisy(g, 44, 94, 8, C.ivory); daisy(g, 76, 94, 8, C.ivory);
    },
    sub(svg) {
      const g = el("g", {}, svg);
      el("path", { d: "M46 70 L74 70 L70 114 L50 114 Z", fill: C.goldLo }, g);
      el("path", { d: "M60 72 C 58 50, 52 36, 44 24 M60 72 C 64 52, 74 40, 82 30", stroke: C.gold, "stroke-width": 1.5, fill: "none" }, g);
      smallLeaf(g, 58, 54, -140, 0.55);
      daisy(g, 44, 24, 11, "#e9c46a", 10); rose(g, 82, 30, 11, "#d98e8e");
    },
  };
  document.querySelectorAll("[data-art]").forEach((svg) => ARTS[svg.dataset.art]?.(svg));

  /* ---------- bouquet builder ---------- */
  const PALETTES = {
    season: ["#e9c46a", "#d98e8e", "#f3efe4", "#8f2d3a", "#c97b5a", "#e7a9a0"],
    white: ["#f3efe4", "#e8e2cf", "#ffffff", "#dfe3c8"],
    blush: ["#e7a9a0", "#f2c4b0", "#f6dfd2", "#d98e8e", "#f0b8a8"],
    red: ["#8f2d3a", "#a8323f", "#6e1f2b", "#c24a4f"],
  };
  const SIZES = { S: 7, M: 11, L: 16 };
  const SIZE_NAME = { S: "Lille", M: "Mellem", L: "Stor" };
  const TONE_NAME = { season: "Yasmin vælger", white: "Hvid og grøn", blush: "Rosa og fersken", red: "Dybrød" };

  const form = document.getElementById("builder");
  const bouquet = document.querySelector(".bouquet");
  const totalEl = document.querySelector("[data-total]");

  function drawBouquet(animate) {
    if (!bouquet || !form) return;
    const size = form.size.value, tone = form.tone.value;
    const n = SIZES[size], pal = PALETTES[tone];
    const r = rng(n * 31 + tone.length * 7);
    bouquet.textContent = "";
    const spread = { S: 70, M: 95, L: 125 }[size];
    const top = { S: 200, M: 170, L: 135 }[size];
    const tie = [200, 372];

    // flower positions in a dome
    const pos = [];
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.12 + 0.76 * ((i + 0.5) / n)) + (r() - 0.5) * 0.25;
      const d = 0.45 + r() * 0.55;
      pos.push({ x: 200 - Math.cos(a) * spread * d * 1.15, y: top + 140 - Math.sin(a) * (140 - (200 - top) * 0.2) * d - (200 - top) * 0.35 });
    }
    pos.sort((p, q) => p.y - q.y);

    const back = el("g", {}, bouquet);
    const stems = el("g", { stroke: C.gold, "stroke-width": 1.4, fill: "none", "stroke-linecap": "round" }, bouquet);
    const heads = el("g", {}, bouquet);
    const front = el("g", {}, bouquet);

    // greenery behind
    for (let i = 0; i < n + 4; i++) {
      const a = Math.PI * (i / (n + 3));
      const x = 200 - Math.cos(a) * (spread + 30), y = top + 150 - Math.sin(a) * (110 + r() * 40);
      el("path", { d: `M${tie[0]} ${tie[1]} Q ${(x + tie[0]) / 2} ${y + 40} ${x} ${y}` }, stems);
      smallLeaf(back, x, y, (Math.atan2(y - tie[1], x - tie[0]) * 180) / Math.PI - 10, 0.8 + r() * 0.5, i % 2 ? C.leaf : C.leafHi);
    }
    pos.forEach((p, i) => {
      el("path", { d: `M${tie[0]} ${tie[1]} Q ${(p.x + tie[0]) / 2 + (r() - 0.5) * 20} ${(p.y + tie[1]) / 2} ${p.x} ${p.y}` }, stems);
      const c = pal[i % pal.length];
      const kind = i % 3;
      const g = el("g", { class: "head" }, heads);
      const s = 16 + r() * 8;
      if (kind === 0) rose(g, 0, 0, s, c);
      else if (kind === 1) daisy(g, 0, 0, s, c, r() * 60);
      else filler(g, 0, 0, s * 0.8, c);
      g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      if (animate && !reduce) {
        g.animate([{ opacity: 0, transform: `translate(${p.x}px, ${p.y + 30}px) scale(0.2)` }, { opacity: 1, transform: `translate(${p.x}px, ${p.y}px) scale(1)` }], { duration: 600, delay: i * 45, easing: "cubic-bezier(.3,.7,.2,1)", fill: "backwards" });
      }
    });
    // jasmine sprigs, always: it is her flower
    jasmine(heads, 200 - spread * 0.95, top + 70, 0.55, 20, "bloom-s");
    jasmine(heads, 200 + spread * 0.9, top + 60, 0.5, 50, "bloom-s");

    // paper wrap and ribbon
    el("path", { d: `M${200 - spread - 30} 330 L 200 500 L ${200 + spread + 30} 330 L 200 390 Z`, fill: C.goldLo }, front);
    el("path", { d: `M${200 - spread - 30} 330 L 200 500 L 200 390 Z`, fill: shade("#8a6f3a", 0.82) }, front);
    el("path", { d: "M176 404 L224 404 L220 418 L180 418 Z", fill: C.ivory }, front);
    el("path", { d: "M196 418 C 188 440, 176 452, 166 470 M204 418 C 212 440, 226 450, 238 466", stroke: C.ivory, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, front);
  }

  function total() {
    const price = (name) => +(form.querySelector(`input[name=${name}]:checked`)?.dataset.price || 0);
    return price("size") + price("how");
  }
  let lastTotal = 0;
  function update(animate) {
    const t = total();
    totalEl.textContent = `${t} kr.`;
    if (animate && t !== lastTotal && !reduce) { totalEl.classList.remove("bump"); void totalEl.offsetWidth; totalEl.classList.add("bump"); }
    lastTotal = t;
    drawBouquet(animate);
  }
  if (form) {
    update(false);
    form.addEventListener("change", (e) => { if (e.target.name !== "card") update(true); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const size = form.size.value, tone = form.tone.value, how = form.how.value;
      const subject = `Bestilling: ${SIZE_NAME[size]} buket, ${TONE_NAME[tone]}`;
      const lines = [
        "Hej Yasmin,", "", "Jeg vil gerne bestille:",
        `Størrelse: ${SIZE_NAME[size]}`, `Farver: ${TONE_NAME[tone]}`,
        `Levering: ${how === "delivery" ? "Levering (adresse og dato herunder)" : "Henter i butikken (dato herunder)"}`,
        `Kort: ${form.card.value.trim() || "(intet kort)"}`, `Pris: ${total()} kr.`, "",
        "Dato:", "Adresse:", "Mit navn og telefon:",
      ];
      const to = form.getAttribute("action").replace(/^mailto:/, "");
      location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    });
    // shop rows that preset the builder
    document.querySelectorAll("[data-preset]").forEach((a) => a.addEventListener("click", () => {
      const input = form.querySelector(`input[name=tone][value=${a.dataset.preset}]`);
      if (input && !input.checked) { input.checked = true; update(true); }
    }));
    // redraw once when the builder comes into view, so the bouquet assembles in front of the visitor
    if (!reduce) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); drawBouquet(true); } }, { threshold: 0.35 }).observe(bouquet);
  }

  /* ---------- opening hours (Danish time) ---------- */
  // [open, close] in decimal hours; index 0 = Sunday. Sample hours, confirm with the shop.
  const HOURS = [null, [10, 17.5], [10, 17.5], [10, 17.5], [10, 17.5], [10, 18], [9, 13]];
  const DAY = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
  const fmt = (h) => { const m = Math.round((h % 1) * 60); return `${Math.floor(h)}${m ? "." + String(m).padStart(2, "0") : ""}`; };
  function dkNow() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Copenhagen", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { wd, h: +get("hour") + +get("minute") / 60 };
  }
  function status() {
    const { wd, h } = dkNow();
    const today = HOURS[wd];
    if (today && h >= today[0] && h < today[1]) return { open: true, wd, text: `Åben nu, til kl. ${fmt(today[1])}` };
    if (today && h < today[0]) return { open: false, wd, text: `Lukket nu, åbner i dag kl. ${fmt(today[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (wd + i) % 7;
      if (HOURS[d]) return { open: false, wd, text: `Lukket nu, åbner ${i === 1 ? "i morgen" : DAY[d]} kl. ${fmt(HOURS[d][0])}` };
    }
    return { open: false, wd, text: "Lukket" };
  }
  const st = status();
  const dot = () => `<span class="dot${st.open ? " is-open" : ""}" aria-hidden="true"></span>`;
  const short = document.querySelector("[data-open-status]");
  if (short) short.innerHTML = `${dot()}<span>${st.text} · Hovedgaden 4, Sønder Omme</span>`;
  const long = document.querySelector("[data-open-status-long]");
  if (long) long.innerHTML = `${dot()}<span>${st.text}</span>`;
  const rows = document.querySelectorAll(".hours > div");
  const rowIndex = (st.wd + 6) % 7; // list starts on Monday
  rows[rowIndex]?.classList.add("is-today");

  /* ---------- the shop photo opens like a door as it scrolls into view ---------- */
  const frame = document.querySelector(".inside-frame");
  if (frame) {
    if (!reduce) {
      let raf = 0;
      const open = () => {
        raf = 0;
        const r = frame.getBoundingClientRect();
        // 0 when the top of the frame enters the bottom of the screen, 1 when it is a third down the screen
        const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.68)));
        const e = 1 - Math.pow(1 - p, 3);
        frame.style.setProperty("--p-inv", (1 - e).toFixed(4));
      };
      open();
      addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(open); }, { passive: true });
      addEventListener("resize", open);
    }
    // spots on the photo and rows in the list light each other up
    const spots = [...frame.querySelectorAll(".spot")];
    const rows = [...document.querySelectorAll(".inside-list li")];
    const light = (key) => {
      spots.forEach((s) => s.classList.toggle("is-on", s.dataset.spot === key));
      rows.forEach((r) => r.classList.toggle("is-on", r.dataset.spot === key));
    };
    spots.forEach((s) => {
      s.addEventListener("mouseenter", () => light(s.dataset.spot));
      s.addEventListener("focus", () => light(s.dataset.spot));
      s.addEventListener("click", () => light(s.classList.contains("is-on") && matchMedia("(hover: none)").matches ? null : s.dataset.spot));
    });
    rows.forEach((r) => r.addEventListener("mouseenter", () => light(r.dataset.spot)));
    frame.addEventListener("mouseleave", () => light(null));
    document.querySelector(".inside-list")?.addEventListener("mouseleave", () => light(null));
  }

  /* ---------- the name rises letter by letter ---------- */
  const word = document.querySelector(".hero-word");
  if (word && !reduce) {
    const txt = word.textContent;
    word.textContent = "";
    [...txt].forEach((ch, i) => {
      const s = document.createElement("span");
      s.textContent = ch;
      word.appendChild(s);
      s.animate(
        [{ transform: "translateY(55%) rotate(4deg)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 1100, delay: 150 + i * 70, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" }
      );
    });
  }

  /* ---------- entrances ---------- */
  const groups = [
    [".hero-text", ":scope > :not(h1)"],
    [".name-grid", ":scope > .h2, .name-body > *, .name-plate"],
    [".shop-head", ":scope > *"],
    [".shop-list", ":scope > li"],
    [".builder-form", ":scope > *"],
    ["#lejligheder", ":scope > .h2, .occ"],
    [".inside-text", ":scope > .h2, .inside-lede, .inside-list > li"],
    [".visit-grid", ".visit-main > *, .hours, .visit-address"],
    [".faq", ":scope > .h2, details"],
    [".foot", ".foot-row"],
  ];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    groups.forEach(([sel, kids]) => {
      document.querySelectorAll(sel).forEach((root) => {
        root.querySelectorAll(kids).forEach((n, i) => {
          n.classList.add("rv");
          n.style.setProperty("--d", `${Math.min(i, 8) * 80}ms`);
          io.observe(n);
        });
      });
    });

    // the name at the foot rises letter by letter
    const foot = document.querySelector(".foot-name");
    if (foot && !reduce) {
      const txt = foot.textContent;
      foot.textContent = "";
      [...txt].forEach((ch, i) => {
        const s = document.createElement("span");
        s.textContent = ch === " " ? " " : ch;
        s.style.cssText = `display:inline-block;transform:translateY(60%);opacity:0;transition:transform .9s cubic-bezier(.2,.7,.2,1) ${i * 40}ms, opacity .9s ${i * 40}ms`;
        foot.appendChild(s);
      });
      new IntersectionObserver(([e], o) => {
        if (!e.isIntersecting) return;
        o.disconnect();
        foot.querySelectorAll("span").forEach((s) => { s.style.transform = "none"; s.style.opacity = 1; });
      }, { threshold: 0.2 }).observe(foot);
    }
  }
})();
