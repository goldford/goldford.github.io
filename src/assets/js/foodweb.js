// Hero "living food web": a simplified Strait of Georgia food web laid out by trophic level.
// Energy pulses start at the primary producers and cascade up through predators.
// Illustrative only; the groups and links are a sketch of SOGEM, not model output.
(() => {
  const canvas = document.querySelector("[data-foodweb]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COL = { prod: "#8ef0c4", zoo: "#7fe3ff", forage: "#ffd27a", pred: "#ffb86b", top: "#ff9c9c", det: "#9fb3c4" };

  // id, label, trophic level, x position (0–1 across the web), group, radius
  const NODES = [
    ["diatoms", "Diatoms", 1.0, 0.14, "prod", 5],
    ["flag", "Flagellates", 1.0, 0.44, "prod", 4.5],
    ["detritus", "Detritus", 1.0, 0.76, "det", 4],
    ["copepods", "Copepods", 2.1, 0.06, "zoo", 4.5],
    ["krill", "Krill", 2.2, 0.3, "zoo", 5],
    ["larv", "Larvaceans", 2.0, 0.54, "zoo", 3.8],
    ["jelly", "Jellyfish", 2.9, 0.86, "zoo", 4.5],
    ["herring", "Pacific herring", 3.1, 0.16, "forage", 5.5],
    ["sandlance", "Sand lance", 3.0, 0.4, "forage", 4.2],
    ["juvsalmon", "Juvenile salmon", 3.3, 0.64, "forage", 5],
    ["humpback", "Humpback whale", 3.4, 0.95, "pred", 6.5],
    ["hake", "Pacific hake", 3.8, 0.04, "pred", 5],
    ["chinook", "Chinook salmon", 4.1, 0.3, "pred", 5.5],
    ["coho", "Coho salmon", 3.9, 0.53, "pred", 5],
    ["seabirds", "Seabirds", 3.8, 0.8, "pred", 4.5],
    ["seal", "Harbour seal", 4.3, 0.17, "top", 6],
    ["srkw", "Resident orca", 4.7, 0.47, "top", 7],
    ["bkw", "Bigg's orca", 5.0, 0.76, "top", 7],
  ];
  const LINKS = [
    ["diatoms", ["copepods", "krill", "larv"]],
    ["flag", ["copepods", "larv", "krill"]],
    ["detritus", ["larv", "copepods", "jelly"]],
    ["copepods", ["herring", "sandlance", "juvsalmon", "jelly", "hake"]],
    ["krill", ["herring", "humpback", "juvsalmon", "hake", "sandlance"]],
    ["larv", ["juvsalmon", "herring", "jelly"]],
    ["herring", ["chinook", "coho", "hake", "seabirds", "seal", "humpback"]],
    ["sandlance", ["chinook", "coho", "seabirds", "seal"]],
    ["juvsalmon", ["seal", "seabirds", "hake"]],
    ["hake", ["seal"]],
    ["chinook", ["srkw", "seal"]],
    ["coho", ["srkw", "seal"]],
    ["seal", ["bkw"]],
  ];

  const nodes = NODES.map(([id, label, tl, xf, g, r], i) => ({ id, label, tl, xf, g, r, col: COL[g], phase: i * 1.7, flash: 0, x: 0, y: 0 }));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const links = [];
  LINKS.forEach(([a, bs]) => bs.forEach((b) => links.push({ a: byId[a], b: byId[b], bend: (Math.random() - 0.5) * 0.35 })));
  nodes.forEach((n) => { n.out = links.filter((l) => l.a === n); n.in = links.filter((l) => l.b === n); });

  // Glow sprites, one per colour.
  const sprites = {};
  const sprite = (hex) => {
    if (sprites[hex]) return sprites[hex];
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"); const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.18, hex); grd.addColorStop(0.45, hex + "55"); grd.addColorStop(1, hex + "00");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return (sprites[hex] = c);
  };

  let W = 0, H = 0, dpr = 1, wide = true, area = { x0: 0, x1: 0, y0: 0, y1: 0 };
  const pointer = { x: -1e4, y: -1e4, px: 0, py: 0, inside: false };
  let hover = null;
  const snow = [];
  const pulses = [];

  const tlToY = (tl) => area.y0 + (area.y1 - area.y0) * ((tl - 1) / 4);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wide = W > 900;
    area = wide
      ? { x0: W * 0.5, x1: W * 0.89, y0: H * 0.84, y1: H * 0.16 }
      : { x0: W * 0.08, x1: W * 0.92, y0: H * 0.9, y1: H * 0.12 };
    nodes.forEach((n) => { n.bx = area.x0 + (area.x1 - area.x0) * n.xf; n.by = tlToY(n.tl); });
    snow.length = 0;
    const count = Math.round((W * H) / 9000);
    for (let i = 0; i < count; i++) snow.push({ x: Math.random() * W, y: Math.random() * H, r: 0.4 + Math.random() * 1.3, v: 6 + Math.random() * 14, a: 0.08 + Math.random() * 0.3, s: Math.random() * 6.28 });
  }

  function spawn(link, strength = 1) {
    if (pulses.length > 260) return;
    pulses.push({ l: link, t: 0, v: 0.22 + Math.random() * 0.18, s: strength });
  }
  function surge() {
    nodes.filter((n) => n.g === "prod" || n.g === "det").forEach((n) => { n.flash = 1; n.out.forEach((l) => spawn(l, 1)); });
  }

  const ctrl = (l) => {
    const mx = (l.a.x + l.b.x) / 2, my = (l.a.y + l.b.y) / 2;
    const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y;
    return [mx - dy * l.bend, my + dx * l.bend];
  };
  const qpt = (l, t) => {
    const [cx, cy] = ctrl(l), u = 1 - t;
    return [u * u * l.a.x + 2 * u * t * cx + t * t * l.b.x, u * u * l.a.y + 2 * u * t * cy + t * t * l.b.y];
  };
  const isLit = (l) => hover && (l.a === hover || l.b === hover);
  const isNear = (n) => hover && (n === hover || hover.out.some((l) => l.b === n) || hover.in.some((l) => l.a === n));

  let last = performance.now(), clock = 0, nextSurge = 0.6;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;

    // Gentle parallax toward the pointer
    const tx = pointer.inside ? (pointer.x / W - 0.5) * -14 : 0, ty = pointer.inside ? (pointer.y / H - 0.5) * -10 : 0;
    pointer.px += (tx - pointer.px) * 0.05; pointer.py += (ty - pointer.py) * 0.05;
    nodes.forEach((n) => {
      n.x = n.bx + pointer.px + Math.sin(clock * 0.5 + n.phase) * 3;
      n.y = n.by + pointer.py + Math.cos(clock * 0.4 + n.phase) * 4;
      n.flash = Math.max(0, n.flash - dt * 1.2);
    });

    // Background: surface light fading to abyss
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0b2f4d"); bg.addColorStop(0.45, "#061a2e"); bg.addColorStop(1, "#020a14");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Light shafts from the surface
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) {
      const x = W * (0.32 + i * 0.13) + Math.sin(clock * 0.15 + i) * 40;
      const w = 50 + (i % 3) * 40;
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.85);
      const a = 0.045 + 0.025 * Math.sin(clock * 0.3 + i * 2);
      g.addColorStop(0, `rgba(160,225,255,${a})`); g.addColorStop(1, "rgba(160,225,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + w, -10); ctx.lineTo(x + w * 0.4 - 160, H * 0.85); ctx.lineTo(x - w * 0.6 - 160, H * 0.85); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // Marine snow
    ctx.fillStyle = "#cfe8f5";
    snow.forEach((p) => {
      if (!reduced) { p.y += p.v * dt; p.x += Math.sin(clock * 0.6 + p.s) * 0.12; if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; } }
      ctx.globalAlpha = p.a; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Trophic level axis
    if (wide) {
      ctx.font = "500 10px 'JetBrains Mono', monospace"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      for (let tl = 1; tl <= 5; tl++) {
        const y = tlToY(tl) + pointer.py;
        ctx.fillStyle = "rgba(143,168,186,.38)"; ctx.fillText(`TL ${tl}`, area.x0 - 34, y);
        ctx.strokeStyle = "rgba(143,168,186,.08)"; ctx.setLineDash([2, 6]);
        ctx.beginPath(); ctx.moveTo(area.x0 - 26, y); ctx.lineTo(area.x1 + 20, y); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.save(); ctx.translate(area.x0 - 72, (area.y0 + area.y1) / 2 + pointer.py); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center"; ctx.fillStyle = "rgba(143,168,186,.4)"; ctx.fillText("TROPHIC LEVEL", 0, 0); ctx.restore();
    }

    // Links
    ctx.lineWidth = 1;
    links.forEach((l) => {
      const [cx, cy] = ctrl(l);
      const lit = isLit(l);
      ctx.strokeStyle = lit ? l.a.col : "#9fd8f0";
      ctx.globalAlpha = hover ? (lit ? 0.7 : 0.04) : 0.13;
      ctx.lineWidth = lit ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.quadraticCurveTo(cx, cy, l.b.x, l.b.y); ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Energy pulses
    if (!reduced) {
      nextSurge -= dt;
      if (nextSurge <= 0) { surge(); nextSurge = 4.5 + Math.random() * 2; }
      if (Math.random() < dt * 1.5) spawn(links[(Math.random() * links.length) | 0], 0.6);
    }
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += p.v * dt;
      if (p.t >= 1) {
        pulses.splice(i, 1);
        const n = p.l.b; n.flash = Math.min(1, n.flash + 0.5 * p.s);
        // Energy carries on upward, losing strength at each step.
        if (p.s > 0.25) n.out.forEach((l) => { if (Math.random() < 0.55) spawn(l, p.s * 0.72); });
        continue;
      }
      const [x, y] = qpt(p.l, p.t);
      const sz = 10 + 8 * p.s;
      ctx.globalAlpha = (hover && !isLit(p.l) ? 0.15 : 0.9) * Math.sin(p.t * Math.PI) * (0.5 + p.s / 2);
      ctx.drawImage(sprite(p.t < 0.5 ? p.l.a.col : p.l.b.col), x - sz / 2, y - sz / 2, sz, sz);
    }
    ctx.restore();

    // Nodes
    nodes.forEach((n) => {
      const near = isNear(n);
      const dim = hover && !near;
      const g = n.r * (5 + n.flash * 4) * (n === hover ? 1.5 : 1);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = dim ? 0.15 : 0.55 + n.flash * 0.45;
      ctx.drawImage(sprite(n.col), n.x - g / 2, n.y - g / 2, g, g);
      ctx.restore();
      ctx.globalAlpha = dim ? 0.3 : 1;
      ctx.fillStyle = n.col; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 0.55 + n.flash * 1.2, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Labels
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    nodes.forEach((n) => {
      const near = isNear(n);
      if (!wide && !near) return;
      const a = hover ? (n === hover ? 1 : near ? 0.85 : 0.12) : 0.55;
      ctx.globalAlpha = a;
      ctx.font = n === hover ? "600 14px 'Hanken Grotesk', sans-serif" : "500 12px 'Hanken Grotesk', sans-serif";
      ctx.fillStyle = "#e4eff5";
      const lx = n.x + n.r + 8, ly = n.y - 1;
      ctx.fillText(n.label, lx, ly);
      if (n === hover) {
        ctx.font = "500 10px 'JetBrains Mono', monospace"; ctx.fillStyle = n.col;
        ctx.fillText(`TL ${n.tl.toFixed(1)} · eats ${n.in.length} · eaten by ${n.out.length}`, lx, ly + 17);
      }
    });
    ctx.globalAlpha = 1;
  }

  // Interaction
  const pick = () => {
    let best = null, bd = 30 * 30;
    nodes.forEach((n) => { const d = (n.x - pointer.x) ** 2 + (n.y - pointer.y) ** 2; if (d < bd) { bd = d; best = n; } });
    return best;
  };
  const host = canvas.parentElement;
  host.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.inside = true;
    const h = pick();
    if (h !== hover) { hover = h; if (h && !reduced) { h.flash = 1; h.out.forEach((l) => spawn(l, 0.9)); } if (reduced) frame(performance.now()); }
    canvas.style.cursor = hover ? "pointer" : "";
  });
  host.addEventListener("pointerleave", () => { pointer.inside = false; hover = null; if (reduced) frame(performance.now()); });

  // Loop, paused when the hero is off screen or the tab is hidden.
  let running = false, visible = true, raf = 0;
  const loop = (t) => { frame(t); raf = requestAnimationFrame(loop); };
  const start = () => { if (!running && visible && !document.hidden && !reduced) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  nodes.forEach((n) => { n.x = n.bx; n.y = n.by; });
  frame(performance.now());
  addEventListener("resize", () => { resize(); if (!running) frame(performance.now()); });
  document.fonts?.ready.then(() => { if (!running) frame(performance.now()); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
})();
