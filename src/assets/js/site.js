// Site chrome: nav toggle, masthead, scroll reveal, depth gauge.
(() => {
  const doc = document.documentElement;
  doc.classList.add("js");

  const toggle = document.querySelector("[data-navtoggle]");
  const nav = document.getElementById("sitenav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); }
    });
  }

  // Depth gauge: the page is a dive. Strait of Georgia max depth is about 420 m.
  const MAX_DEPTH = 420;
  const gauge = document.createElement("div");
  gauge.className = "depth";
  gauge.setAttribute("aria-hidden", "true");
  gauge.innerHTML = '<span class="depth__val">0 m</span><span class="depth__track"><span class="depth__dot"></span></span>';
  document.body.appendChild(gauge);
  const val = gauge.querySelector(".depth__val");
  const mast = document.querySelector("[data-masthead]");

  let ticking = false;
  const onScroll = () => {
    const max = Math.max(1, doc.scrollHeight - innerHeight);
    const f = Math.min(1, Math.max(0, scrollY / max));
    doc.style.setProperty("--depth", f.toFixed(3));
    val.textContent = `Depth ${Math.round(f * MAX_DEPTH)} m`;
    if (mast) mast.classList.toggle("is-solid", scrollY > 30 || !document.body.classList.contains("home"));
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("is-in"));
  }
})();
