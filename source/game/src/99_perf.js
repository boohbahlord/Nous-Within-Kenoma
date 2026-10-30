/* ---------- v76b: performance ----------
   The outermost redraw: it notes, before anything on the page changes, what the redraw would otherwise have to measure
   mid-way (the spells' scroll position), and lets the fog's line of sight be worked out once per redraw instead of once
   per tile. Work that measures the page (the fog veil, the side panel's height, the map's clip, the spells' scroll) runs
   in one pass just before the next paint (perfLater, 01_core.js), so a redraw lays the page out once. */
/* the spells' scroll position, kept as it scrolls: a redraw never has to measure it */
let spellsTop = 0;
document.addEventListener(
  "scroll",
  (e) => {
    const t = e.target;
    if (t && t.id === "spells") spellsTop = t.scrollTop;
  },
  { capture: true, passive: true },
);
{
  const _r = render;
  render = function () {
    if (!PERF.inRender) {
      PERF.vk = null;
      PERF.sp = spellsTop;
    }
    PERF.inRender++;
    try {
      return rSafe(_r, this, arguments);
    } finally {
      PERF.inRender--;
      if (!PERF.inRender) {
        PERF.vk = null;
        PERF.sp = null;
      }
    }
  };
}
if (window.__EC)
  Object.assign(window.__EC, {
    renderAll: () => render(),
    perfFlush: () => perfFlush(),
  });
