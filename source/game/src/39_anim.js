/* ---------------- v38: animation settings, the phone's animation question, the skull ----------------
   Two switches, in Display before a game, in the menu and in the Display bar:
     card animations — moves, strikes, wounds, deaths (smoke and the skull), sacrifices, mana, shuffles, the grave's wisps;
     magic and other — spells and their signs, the sky, rain, wind, lightning, fire, and every drifting or glowing thing on the
     page; with it off the fog of war stands still, a picture of itself.
   On a phone, every game opens with a small window that asks which to keep: it shows the player's saved choice (or the
   defaults, both on), "Confirm my choices" saves it, the X changes nothing.
   When a card dies, a white skull rises from its tile and fades, like a spell leaving it. */
const FX_CAT = {
  burst: "cards",
  strike: "cards",
  hit: "cards",
  slide: "cards",
  smoke: "cards",
  sigil: "cards",
  pop: "cards",
  shuffle: "cards",
  wisp: "cards",
  pour: "cards",
  fill: "cards",
  blunt: "cards",
  boom: "cards",
  dollar: "cards",
  skull: "cards",
  symbol: "magic",
  area: "magic",
  fogroll: "magic",
  meteor: "magic",
  flames: "magic",
  lightning: "magic",
  wind: "magic",
  rain: "magic",
  spell: "magic",
};
let fxCtx = null; // a spell's burst is magic, a sacrifice's sign is a card's: the outer effect decides
const fxAllowed = (k) =>
  k === "magic" ? PREF.fxMagic !== false : PREF.fxCards !== false;
/* the skull */
const SKULL_SVG = `<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path fill="#fbfaf6" d="M32 5C17.5 5 8 15.6 8 29c0 8.4 4 14.6 10 18v7.5c0 2.5 2 4.5 4.5 4.5h19c2.5 0 4.5-2 4.5-4.5V47c6-3.4 10-9.6 10-18C56 15.6 46.5 5 32 5Z"/><path fill="#16121c" d="M16.5 29.5c0-4.6 3.4-7.6 7.4-7.6 4.2 0 6.6 3.6 6.1 8-.4 3.9-3.2 6.8-7 6.8-3.8 0-6.5-3.2-6.5-7.2Zm31 0c0-4.6-3.4-7.6-7.4-7.6-4.2 0-6.6 3.6-6.1 8 .4 3.9 3.2 6.8 7 6.8 3.8 0 6.5-3.2 6.5-7.2ZM32 37.5l-3.6 7.2c-.4.9.2 1.8 1.2 1.8h4.8c1 0 1.6-.9 1.2-1.8L32 37.5Z"/><path stroke="#16121c" stroke-width="1.6" stroke-linecap="round" d="M26 50.5v7M32 50.5v7.5M38 50.5v7"/><path fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" d="M15 18c3-5.5 8.5-8.8 15-9.3"/></svg>`;
FX.skull = function (rect) {
  if (!rect) return;
  const s = Math.max(30, Math.min(rect.width, rect.height) * 0.78);
  const e = FX.make("skull", rect, {
    w: s,
    h: s,
    html: SKULL_SVG,
    dy: -rect.height * 0.05,
  });
  FX.play(
    e,
    [
      {
        transform: "translateY(8px) scale(.55)",
        opacity: 0,
        filter: "blur(3px) drop-shadow(0 0 0 #fff)",
      },
      {
        transform: "translateY(0) scale(1.06)",
        opacity: 1,
        filter: "blur(0) drop-shadow(0 0 12px #e8f0ff)",
        offset: 0.28,
      },
      {
        transform: "translateY(-6px) scale(1)",
        opacity: 0.95,
        filter: "blur(0) drop-shadow(0 0 8px #e8f0ff)",
        offset: 0.6,
      },
      {
        transform: `translateY(${-rect.height * 0.45}px) scale(1.12)`,
        opacity: 0,
        filter: "blur(4px) drop-shadow(0 0 16px #fff)",
      },
    ],
    1500,
    60,
    "ease-out",
  );
  FX.play(
    FX.make("ring", rect, { w: s * 1.5, h: s * 1.5, col: "#e8f0ff" }),
    [
      { transform: "scale(.3)", opacity: 0.9 },
      { transform: "scale(1.2)", opacity: 0 },
    ],
    700,
    60,
  );
};
for (const [m, k] of Object.entries(FX_CAT)) {
  const f = FX[m];
  if (typeof f !== "function") continue;
  FX[m] = function () {
    const cat = fxCtx || k;
    if (!fxAllowed(cat)) return m === "spell" ? true : undefined;
    const prev = fxCtx;
    fxCtx = cat;
    try {
      return f.apply(this, arguments);
    } finally {
      fxCtx = prev;
    }
  };
}
{
  const _cf = castFX;
  castFX = function () {
    if (!fxAllowed("magic")) return;
    const prev = fxCtx;
    fxCtx = "magic";
    try {
      return _cf.apply(this, arguments);
    } finally {
      fxCtx = prev;
    }
  };
}
/* magic off: every drifting or glowing thing on the page holds still (the fog becomes a picture of itself) */
{
  const _ap = applyPrefs;
  applyPrefs = function () {
    _ap.apply(this, arguments);
    document.documentElement.classList.toggle(
      "still-magic",
      PREF.fxMagic === false,
    );
    paintAnimBtns();
  };
}
function paintAnimBtns() {
  const a = $("#pAnimC"),
    b = $("#pAnimM");
  if (a) {
    a.textContent =
      "Card animations: " + (PREF.fxCards !== false ? "On" : "Off");
    a.setAttribute("aria-pressed", PREF.fxCards !== false);
  }
  if (b) {
    b.textContent =
      "Magic animations: " + (PREF.fxMagic !== false ? "On" : "Off");
    b.setAttribute("aria-pressed", PREF.fxMagic !== false);
  }
}
{
  const _mb = mountBar;
  mountBar = function () {
    _mb.apply(this, arguments);
    const g = $("#gmore");
    if (!g) return;
    const mk = (id, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.id = id;
      b.className = "gtog";
      b.onclick = () => {
        PREF[k] = PREF[k] === false;
        savePrefs();
        applyPrefs();
      };
      return b;
    };
    const r = $("#pReset");
    g.insertBefore(mk("pAnimC", "fxCards"), r);
    g.insertBefore(mk("pAnimM", "fxMagic"), r);
    paintAnimBtns();
  };
}

/* ---------- the phone's question at the start of every game ---------- */
function askAnimations() {
  if (!isPhone()) return;
  let box = $("#animask");
  if (!box) {
    box = document.createElement("div");
    box.id = "animask";
    document.body.appendChild(box);
  }
  box.innerHTML = `<div class="ovbox" role="dialog" aria-labelledby="aaq"><button type="button" class="xclose" id="aaX" aria-label="Close without changing anything">×</button>
<h2 id="aaq">Animations</h2><p class="dim">Turning animations off makes the game run smoother on slower phones.</p>
<label class="chk"><input type="checkbox" id="aaC" ${PREF.fxCards !== false ? "checked" : ""}> <span>Card animations<small>Moves, strikes, wounds, deaths, sacrifices and mana.</small></span></label>
<label class="chk"><input type="checkbox" id="aaM" ${PREF.fxMagic !== false ? "checked" : ""}> <span>Magic and other animations<small>Spells, the sky, fire and weather, the drifting fog (off: the fog stands still).</small></span></label>
<p class="acts"><button type="button" class="btn" id="aaOk">Confirm my choices</button></p></div>`;
  box.hidden = false;
  $("#aaX").onclick = () => {
    box.hidden = true;
  };
  $("#aaOk").onclick = () => {
    PREF.fxCards = $("#aaC").checked;
    PREF.fxMagic = $("#aaM").checked;
    savePrefs();
    applyPrefs();
    box.hidden = true;
  };
}
{
  const _sg = startGame;
  startGame = function (opts) {
    const out = _sg.apply(this, arguments);
    if (!(opts && opts.fast))
      try {
        askAnimations();
      } catch (e) {
        console.error(e);
      }
    return out;
  };
}
if (window.__EC) Object.assign(window.__EC, { askAnimations, FX });
