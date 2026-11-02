// Type chips + text search for the publications and talks lists.
(() => {
  document.querySelectorAll("[data-filter]").forEach((bar) => {
    const list = document.getElementById(bar.dataset.filter);
    if (!list) return;
    const buttons = [...bar.querySelectorAll("button[data-type]")];
    const input = bar.querySelector("[data-search]");
    const count = bar.nextElementSibling?.matches("[data-count]") ? bar.nextElementSibling : null;
    const items = [...list.querySelectorAll("[data-type]")];
    const text = new Map(items.map((el) => [el, el.textContent.toLowerCase().replace(/\s+/g, " ")]));
    let type = "all";

    const apply = () => {
      const q = (input?.value || "").trim().toLowerCase();
      let shown = 0;
      items.forEach((el) => {
        const ok = (type === "all" || el.dataset.type === type) && (!q || q.split(" ").every((w) => text.get(el).includes(w)));
        el.hidden = !ok;
        if (ok) shown++;
      });
      list.querySelectorAll("[data-group]").forEach((g) => { g.hidden = !g.querySelector("[data-type]:not([hidden])"); });
      if (count) count.textContent = type === "all" && !q ? "" : `${shown} of ${items.length} shown`;
    };

    buttons.forEach((b) => b.addEventListener("click", () => {
      type = b.dataset.type;
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    }));
    input?.addEventListener("input", apply);
  });
})();
