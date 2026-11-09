/* Nous Within Kenoma page effects.
   - strings: thin black lines stretched across the page (data-fx contains "strings")
   - bars: rare black gaps across the screen behind the page (data-fx contains "bars"); never on buttons or boxes
   - the reader's look, shared with the game's Display settings (localStorage "ec-prefs2"): lines (the strings and bars
     on or off) and bright (the page's brightness, 0.7 to 1.3)
   - static: animated fuzzy static with faint scanlines and an occasional flicker, behind the text.
     Level comes from <body data-static="0-4">; the reader can only switch it off (bottom-right button). */
(function () {
  const NS = "http://www.w3.org/2000/svg",
    R = Math.random;
  const body = document.body,
    fx = (body.dataset.fx || "").split(/\s+/);
  let LV = +(body.dataset.static || 0);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t, a, p) {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  }

  /* ---------- strings and background bars ---------- */
  const lookPref = () => {
    try {
      const p = JSON.parse(localStorage.getItem("ec-prefs2") || "{}");
      return p && typeof p === "object" && !Array.isArray(p) ? p : {};
    } catch (e) {
      return {};
    }
  }; // v78j
  const lite = () => document.documentElement.classList.contains("lite"); // v71j: Data saving or Poor connection: no lines, no static
  function look() {
    const P = lookPref(),
      b = +P.bright || 1;
    document.documentElement.style.filter =
      Math.abs(b - 1) > 0.01 ? `brightness(${b})` : "";
    document.documentElement.classList.toggle("nolines", P.lines === false);
  }
  function drawStrings() {
    const W = innerWidth,
      H = innerHeight;
    document.querySelector("svg.strings")?.remove();
    if (lookPref().lines === false || lite()) return;
    // I want Static off to take the thin lines and bars out of a chapter's background too
    if (!on && LV && document.querySelector("article.chapter")) return;
    const s = el("svg", {
      class: "strings",
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: "none",
      "aria-hidden": "true",
    });
    const g = el("g", { stroke: "#000", fill: "none" }, s);
    if (fx.includes("strings")) {
      const edge = () => {
        const e = Math.floor(R() * 4),
          t = R();
        return e === 0
          ? [t * W, -5]
          : e === 1
            ? [W + 5, t * H]
            : e === 2
              ? [t * W, H + 5]
              : [-5, t * H];
      };
      const n = 9 + Math.floor(R() * 7);
      for (let i = 0; i < n; i++) {
        const a = edge(),
          b = edge();
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < Math.min(W, H) * 0.5) {
          i--;
          continue;
        }
        el(
          "line",
          {
            x1: a[0],
            y1: a[1],
            x2: b[0],
            y2: b[1],
            "stroke-width": (0.45 + R() * 0.5).toFixed(2),
            "stroke-opacity": (0.55 + R() * 0.4).toFixed(2),
          },
          g,
        );
      }
    }
    if (fx.includes("bars")) {
      const k = Math.floor(R() * 3); // 0 to 2 bars, often none
      for (let i = 0; i < k; i++) {
        const h = 2 + Math.floor(R() * 3),
          y = R() * H;
        if (R() < 0.35) {
          el("rect", { x: 0, y, width: W, height: h, fill: "#000" }, s);
        } // sometimes the whole screen
        else {
          const w = W * (0.12 + R() * 0.45),
            x = R() < 0.5 ? 0 : W - w; // otherwise from one edge
          el("rect", { x, y, width: w, height: h, fill: "#000" }, s);
          if (R() < 0.5)
            el(
              "rect",
              {
                x: x < 1 ? w + 6 + R() * 10 : x - 14 - R() * 20,
                y,
                width: 4 + R() * 10,
                height: h,
                fill: "#000",
              },
              s,
            );
        } // a short detached segment
      }
    }
    body.prepend(s);
  }
  /* ---------- static ---------- */
  const KEY = "nwk-static";
  let on = true;
  try {
    on = localStorage.getItem(KEY) !== "off";
  } catch (e) {}
  let ALPHA = [0, 0.035, 0.065, 0.1, 0.13][LV] || 0;
  const SKY = document.documentElement.classList.contains("th-bluegray");
  let drawnA = 0;
  if (SKY) ALPHA = 0; // Blue to Gray: no static on the blue; it comes in with the grey (nwkStatic.alpha, below)
  let cv,
    ctx,
    img,
    scan,
    roll,
    flash,
    raf = 0,
    last = 0,
    nextFlick = 0;
  function buildStatic() {
    cv = document.createElement("canvas");
    cv.className = "static";
    cv.width = 300;
    cv.height = Math.max(
      120,
      Math.round((300 * innerHeight) / Math.max(1, innerWidth)),
    );
    cv.setAttribute("aria-hidden", "true");
    ctx = cv.getContext("2d");
    img = ctx.createImageData(cv.width, cv.height);
    scan = document.createElement("div");
    scan.className = "scan";
    scan.style.opacity = SKY ? 0 : (0.25 + LV * 0.12).toFixed(2);
    flash = document.createElement("div");
    flash.className = "flash";
    body.prepend(scan);
    body.prepend(cv);
    body.appendChild(flash);
    if (LV >= 3) {
      roll = document.createElement("div");
      roll.className = "roll";
      body.prepend(roll);
    }
  }
  /* v76b: the same static, drawn with one fast random number and one write per pixel */
  let d32 = null,
    ns = (Math.random() * 4294967295) >>> 0 || 1;
  function noise() {
    if (!d32 || d32.buffer !== img.data.buffer)
      d32 = new Uint32Array(img.data.buffer);
    const n = d32.length,
      lim = Math.round(0.55 * 256);
    let s = ns;
    for (let i = 0; i < n; i++) {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      const v = s & 255;
      d32[i] =
        ((s >>> 8) & 255) < lim
          ? (v |
              (v << 8) |
              (v << 16) |
              (((((s >>> 16) & 255) * ALPHA) & 255) << 24)) >>>
            0
          : v | (v << 8) | (v << 16);
    }
    ns = s >>> 0 || 1;
    ctx.putImageData(img, 0, 0);
  }
  function flick(t) {
    if (t < nextFlick || ALPHA < 0.02) return; // (no flicker while the static is too faint to see)
    const gap = [0, [9000, 16000], [5000, 9000], [2500, 5200], [1800, 4000]][
      LV
    ];
    nextFlick = t + gap[0] + R() * (gap[1] - gap[0]);
    const dark = R() < 0.5,
      amt = (0.02 + LV * 0.012) * (dark ? 1.4 : 1);
    flash.classList.toggle("dark", dark);
    flash.style.opacity = amt;
    setTimeout(
      () => {
        flash.style.opacity = 0;
      },
      60 + R() * 90,
    );
    if (LV >= 3 && R() < 0.5)
      setTimeout(() => {
        flash.style.opacity = amt * 0.6;
        setTimeout(() => (flash.style.opacity = 0), 50);
      }, 180);
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - last < 80) return;
    last = t;
    if (!ALPHA && SKY) return; // (Blue to Gray's blue: nothing to draw yet)
    noise();
    cv.style.opacity = (0.8 + R() * 0.2).toFixed(2);
    if (roll) {
      const p = (t / 9000) % 1;
      roll.style.top = p * 130 - 30 + "vh";
    }
    flick(t);
  }
  function start() {
    if (!cv) buildStatic();
    cv.hidden = scan.hidden = false;
    if (roll) roll.hidden = LV < 3;
    noise();
    if (!reduce && !raf) {
      nextFlick = performance.now() + 2000;
      raf = requestAnimationFrame(loop);
    }
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (cv) {
      cv.hidden = scan.hidden = true;
      if (roll) roll.hidden = true;
      flash.style.opacity = 0;
    }
  }
  let btn = null;
  function toggleButton() {
    if (btn) return;
    const b = (btn = document.createElement("button"));
    b.type = "button";
    b.className = "static-toggle";
    const label = () => {
      b.textContent = "static: " + (on ? "on" : "off");
      b.setAttribute("aria-pressed", on);
    };
    label();
    b.addEventListener("click", () => {
      on = !on;
      try {
        localStorage.setItem(KEY, on ? "on" : "off");
      } catch (e) {}
      on ? start() : stop();
      drawStrings();
      label();
    });
    (document.getElementById("nwkdisp") || body).appendChild(b); // v78u: into the Display bar when there is one
  }
  document.addEventListener("visibilitychange", () => {
    if (!LV || !on || lite()) return;
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!reduce && !raf) raf = requestAnimationFrame(loop);
  });

  /* pages can raise or lower the static while open (the game's Blood Moon does) */
  window.nwkLook = () => {
    drawStrings();
    look();
  }; // the game's Display settings call this after a change
  window.nwkStatic = {
    level(n) {
      n = Math.max(0, Math.min(4, n | 0));
      if (n === LV) return;
      LV = n;
      ALPHA = [0, 0.035, 0.065, 0.1, 0.13][LV] || 0;
      if (!LV) {
        stop();
        return;
      }
      if (lite()) return;
      toggleButton();
      if (!cv) buildStatic();
      scan.style.opacity = (0.25 + LV * 0.12).toFixed(2);
      if (LV >= 3 && !roll) {
        roll = document.createElement("div");
        roll.className = "roll";
        body.prepend(roll);
      }
      if (roll) roll.hidden = LV < 3 || !on;
      if (on) start();
    },
    /* any strength between the levels' (Blue to Gray fades its static in with this); the scanlines go with it */
    alpha(a) {
      ALPHA = Math.max(0, Math.min(0.13, a));
      if (scan) scan.style.opacity = Math.min(1, ALPHA / 0.065) * 0.49;
      if (cv && on && reduce && Math.abs(ALPHA - drawnA) > 0.01) {
        drawnA = ALPHA;
        noise();
      } // (no movement: the one still frame shows the new strength, now and then)
    },
    refresh() {
      if (lite() || !LV) {
        stop();
        if (btn) btn.hidden = true;
        return;
      }
      toggleButton();
      btn.hidden = false;
      if (on) start();
    },
  }; // v71j: after Data saving is switched
  function go() {
    drawStrings();
    look();
    if (LV > 0 && !lite()) {
      toggleButton();
      if (on) start();
    }
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", go);
  else go();
  let lw = innerWidth,
    tm;
  addEventListener("resize", () => {
    clearTimeout(tm);
    tm = setTimeout(() => {
      if (Math.abs(innerWidth - lw) > 40) {
        drawStrings();
        lw = innerWidth;
      }
    }, 200);
  });
})();

/* the game's soft click on every page: buttons, links, cards and choices answer a press with the same small sound.
   It follows the game's sound switch (sound: on/off), and stays quiet while a game is running (the game plays its own). */
(function () {
  let ac = null,
    last = 0;
  const on = () => {
    try {
      return localStorage.getItem("ec-sound") !== "off";
    } catch (e) {
      return true;
    }
  };
  function tone(f, t, dur, peak) {
    const o = ac.createOscillator(),
      g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.004 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function click() {
    const n = Date.now();
    if (n - last < 40) return;
    last = n;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const t = ac.currentTime + 0.01;
      tone(1320, t, 0.03, 0.03);
      tone(660, t, 0.04, 0.017);
    } catch (e) {}
  }
  document.addEventListener(
    "click",
    (e) => {
      if (!on() || !e.target.closest) return;
      if (window.__EC && window.__EC.G && !window.__EC.G.over) return; // in a game, the game's own sounds answer
      if (
        e.target.closest(
          "button,a[href],summary,label,select,.card,[role=button],[role=tab]",
        )
      )
        click();
    },
    true,
  );
})();

/* v71j: the first visit to an Ether's Crossroads page asks once how its pages should load: Default, Data saving or Poor
   connection. The X keeps the default. In the game, its own settings take the answer (window.ecSetNet); elsewhere it is saved
   with the game's display settings ("ec-prefs2": net, netAsked) and applied at once. */
(function () {
  const D = document.documentElement;
  if (!D.classList.contains("ecpage")) return;
  let P = {};
  try {
    P = JSON.parse(localStorage.getItem("ec-prefs2") || "{}");
  } catch (e) {
    return;
  }
  if (!P || typeof P !== "object") P = {};
  if (P.netAsked) return; // v78j
  function apply(n) {
    if (window.ecSetNet) {
      window.ecSetNet(n, true);
      return;
    }
    let Q = {};
    try {
      Q = JSON.parse(localStorage.getItem("ec-prefs2") || "{}");
    } catch (e) {}
    if (!Q || typeof Q !== "object" || Array.isArray(Q)) Q = {};
    Q.net = n;
    Q.netAsked = 1;
    try {
      localStorage.setItem("ec-prefs2", JSON.stringify(Q));
    } catch (e) {}
    D.classList.toggle("lite", n > 0);
    D.classList.toggle("poor", n > 1);
    if (window.nwkLook) window.nwkLook();
    if (window.nwkStatic && window.nwkStatic.refresh)
      window.nwkStatic.refresh();
    if (n > 0 && window.ECMusic) window.ECMusic.stop();
  }
  function show() {
    if (document.getElementById("netask")) return;
    const w = document.createElement("div");
    w.id = "netask";
    w.setAttribute("role", "dialog");
    w.setAttribute("aria-modal", "true");
    w.setAttribute("aria-labelledby", "netaskT");
    w.innerHTML = `<div class="nabox"><button type="button" class="nax" aria-label="Close: keep the default">×</button>
<h2 id="netaskT">How should Ether's Crossroads load?</h2>
<p class="nadim">For this device. You can change it any time in the Menu, or in the Display bar during a game.</p>
<div class="naopts">
<button type="button" data-n="0"><b>Default</b><span>Everything: the art, the fonts, the music and the animations.</span></button>
<button type="button" data-n="1"><b>Data saving</b><span>Your device's own fonts, a plain background, nothing moving, and lighter online play. The music still plays: it is made on your device.</span></button>
<button type="button" data-n="2"><b>Poor connection</b><span>For a weak or unreliable connection: all of Data saving, fewer online updates, and longer patience when the connection drops. The music still plays.</span></button>
</div></div>`;
    document.body.appendChild(w);
    const done = (n) => {
      w.remove();
      apply(n);
    };
    w.querySelector(".nax").onclick = () => done(0);
    w.querySelectorAll("[data-n]").forEach(
      (b) => (b.onclick = () => done(+b.dataset.n)),
    );
    w.addEventListener("keydown", (e) => {
      if (e.key === "Escape") done(0);
    });
    w.querySelector("[data-n='0']").focus();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", show);
  else show();
})();
/* v78u: Display (bottom right, on every page but the game, on a computer): a bar like the game's, "Display ▴" beside the static
   switch; it opens "Fill the screen", which lets the page use the whole width of the window instead of a column in the middle */
(function () {
  const KEY = "nwk-fill",
    root = document.documentElement;
  let on = false;
  try {
    on = localStorage.getItem(KEY) === "on";
  } catch (e) {}
  // v78v: a computer by what the device says it is; a touchscreen laptop reports a touch pointer just as a phone does
  const pc = () => {
    const n = navigator,
      ua = n.userAgent || "";
    if (n.userAgentData && n.userAgentData.mobile) return false;
    if (
      /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|Opera Mini|IEMobile/i.test(
        ua,
      )
    )
      return false;
    return !(/Macintosh/.test(ua) && n.maxTouchPoints > 1);
  }; // an iPad says it is a Mac
  const apply = () => root.classList.toggle("fillscreen", on && pc());
  apply();
  function build() {
    if (
      document.querySelector("main.game") ||
      document.getElementById("nwkdisp")
    )
      return; // the game has its own Display bar
    const st = document.querySelector("button.static-toggle");
    if (!pc() && !st) return; // a phone with no static has nothing to show
    const d = document.createElement("div");
    d.id = "nwkdisp";
    d.innerHTML =
      '<span id="nwkmore" hidden><button type="button" class="nwktog" id="nwkfill"></button></span>' +
      '<button type="button" class="nwktog" id="nwkdispb" aria-expanded="false" aria-controls="nwkmore">Display ▴</button>' +
      '<button type="button" class="nwktog" id="nwkcol"></button>';
    document.body.appendChild(d);
    const m = d.querySelector("#nwkmore"),
      b = d.querySelector("#nwkdispb"),
      f = d.querySelector("#nwkfill"),
      c = d.querySelector("#nwkcol");
    if (!pc()) {
      m.remove(); // Fill the screen is for a computer
      b.remove();
    }
    if (st) d.insertBefore(st, c); // the static switch joins the bar, as in the game
    // I want a small button that folds the whole bar away, and it stays folded on the next page
    let folded = false;
    try {
      folded = localStorage.getItem("nwk-bar") === "folded";
    } catch (e) {}
    const paint = () => {
      f.textContent = "Fill the screen: " + (on ? "On" : "Off");
      f.setAttribute("aria-pressed", on);
      b.textContent = m.hidden ? "Display ▴" : "Display ▾";
      b.setAttribute("aria-expanded", !m.hidden);
      d.classList.toggle("folded", folded);
      c.textContent = folded ? "◂" : "▸";
      c.setAttribute(
        "aria-label",
        folded ? "Show the display options" : "Hide the display options",
      );
      c.setAttribute("aria-expanded", !folded);
    };
    paint();
    c.addEventListener("click", () => {
      folded = !folded;
      if (folded) m.hidden = true;
      try {
        localStorage.setItem("nwk-bar", folded ? "folded" : "open");
      } catch (e) {}
      paint();
    });
    b.addEventListener("click", () => {
      m.hidden = !m.hidden;
      paint();
    });
    f.addEventListener("click", () => {
      on = !on;
      try {
        localStorage.setItem(KEY, on ? "on" : "off");
      } catch (e) {}
      apply();
      paint();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !m.hidden) {
        m.hidden = true;
        paint();
      }
    });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", build);
  else build();
})();

/* Blue to Gray (No. 54): the sky behind the page (site.css draws it and turns it grey from 35 s on), and the rest of the
   timing. The static fades in while the grey comes and keeps getting worse; once the grey has set in, the lines and bars
   (hidden until then) fade in, and the static eases back a little so the text stays easy to read. The clock is the
   page's own, from the moment it opened, the same as the grey's. */
(function () {
  const D = document.documentElement;
  if (!D.classList.contains("th-bluegray")) return;
  const R = Math.random,
    GREY = 61, // s: the grey has set in (35 s of blue, then 26 s of turning: site.css)
    LINES = 72; // s: the lines and bars come
  function sky() {
    const s = document.createElement("div");
    s.className = "sky";
    s.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 9; i++) {
      const c = document.createElement("i"),
        t = 150 + R() * 130; // (each cloud takes 2.5 to 4.5 minutes to cross)
      c.style.cssText =
        `--y:${(R() * 95 - 15).toFixed(1)}%;--w:${(45 + R() * 45).toFixed(1)}vmax;` +
        `--t:${t.toFixed(0)}s;--d:${(-R() * t).toFixed(0)}s;--x:${(R() * 100 - 30).toFixed(0)}vw`;
      s.appendChild(c);
    }
    document.body.prepend(s);
  }
  const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a))),
    ease = (u) => u * u * (3 - 2 * u);
  let lines = false;
  function tick() {
    const t = performance.now() / 1000,
      a =
        0.06 * seg(t, GREY - 14, GREY) ** 2 +
        0.06 * ease(seg(t, GREY, LINES)) -
        0.035 * ease(seg(t, LINES, LINES + 8));
    if (window.nwkStatic && window.nwkStatic.alpha) window.nwkStatic.alpha(a);
    if (!lines && t >= LINES) {
      lines = true;
      D.classList.add("bg-lines");
    }
    if (t < LINES + 9) setTimeout(tick, 120);
  }
  function go() {
    sky();
    tick();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", go);
  else go();
})();

/* The Night Never Ends (No. 56): lone orange street lights, only their light, sliding away from the reader toward a
   vanishing point, like looking far down a road at night. Two rows (higher and lower, both to the left of the road).
   Each light is a faint soft haze with no edge, never a disc; the rows run on and on into ever smaller, fainter specks,
   as if the road never ends. Now and then (rarely) one light flickers. Still, with reduced motion or Data saving: one
   quiet frame. */
(function () {
  const D = document.documentElement;
  if (!D.classList.contains("th-night")) return;
  const R = Math.random,
    still =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      D.classList.contains("lite"),
    NEAR = 1.7, // depth where a light comes in: already a way off
    FAR = 110, // depth where it is gone, a speck at the vanishing point
    SPEED = 0.6, // depth per second
    GAP = 5, // depth between two lights in a row
    ROWS = [
      { x: -1.5, y: -0.55, off: 0 },
      { x: -1.5, y: 0.8, off: GAP / 2 },
    ];
  const cv = document.createElement("canvas");
  cv.className = "nightlights";
  cv.setAttribute("aria-hidden", "true");
  const g = cv.getContext("2d");
  let W = 0,
    H = 0,
    dpr = 1,
    vx = 0,
    vy = 0,
    F = 0,
    flick = null,
    nextFlick = 12 + R() * 25;
  function size() {
    dpr = Math.min(1.5, devicePixelRatio || 1);
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = W > H;
    // the vanishing point: on a wide screen out in the right margin, so the far specks stay clear of the words and the
    // near lights come in through the left margin; on a phone a little right of the middle
    vx = W * (wide ? 0.84 : 0.62);
    vy = H * (wide ? 0.36 : 0.3);
    F = wide ? W * 0.33 : Math.min(W, H) * 0.34;
  }
  // one light: a faint orange haze, thickest in the middle and thinning out slowly, so it has no edge to read as a
  // circle; the far ones are only a soft speck
  function glow(x, y, r, a) {
    if (a <= 0.004) return;
    if (r < 2.5) {
      // the tiniest fade with their size, so the far end thins into the dark instead of drawing a line
      a *= Math.max(0, (r - 0.5) / 2) ** 1.5;
      if (a <= 0.004) return;
      g.fillStyle = `rgba(240,128,44,${a})`;
      g.beginPath();
      g.arc(x, y, Math.max(0.8, r), 0, 6.2832);
      g.fill();
      return;
    }
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(250,150,70,${a})`);
    gr.addColorStop(0.12, `rgba(240,128,44,${a * 0.78})`);
    gr.addColorStop(0.3, `rgba(214,100,30,${a * 0.42})`);
    gr.addColorStop(0.55, `rgba(180,76,20,${a * 0.14})`);
    gr.addColorStop(0.8, `rgba(150,60,14,${a * 0.035})`);
    gr.addColorStop(1, "rgba(130,50,10,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, 6.2832);
    g.fill();
  }
  function draw(t) {
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    const span = FAR - NEAR;
    ROWS.forEach((row, ri) => {
      for (let k = 0; k * GAP < span + GAP; k++) {
        const z = NEAR + ((t * SPEED + row.off + k * GAP) % (span + GAP));
        if (z > FAR) continue;
        const s = F / z,
          x = vx + row.x * s * 2.2,
          y = vy + row.y * s * 2.2,
          r = 0.5 * s,
          a =
            0.3 *
            Math.min(1, (z - NEAR) / 1.5) * // comes in softly
            (NEAR / z) ** 0.28 * // dimmer the further it goes
            (1 - (z / FAR) ** 3); // and gone at the end
        let f = 1;
        if (flick && flick.row === ri && flick.k === k) {
          const p = (t - flick.at) / 0.9;
          if (p >= 0 && p < 1)
            f = [0.2, 1, 0.35, 0.9, 0.15, 1][Math.floor(p * 6)];
        }
        glow(x, y, r, a * f);
      }
    });
    g.globalCompositeOperation = "source-over";
  }
  let t0 = null;
  function frame(now) {
    if (t0 === null) t0 = now;
    const t = (now - t0) / 1000;
    if (t > nextFlick) {
      flick = { row: R() < 0.5 ? 0 : 1, k: Math.floor(R() * 8), at: t };
      nextFlick = t + 18 + R() * 30;
    }
    draw(t + 40);
    requestAnimationFrame(frame);
  }
  function go() {
    document.body.prepend(cv);
    size();
    addEventListener("resize", () => {
      size();
      if (still) draw(40);
    });
    if (still) draw(40);
    else requestAnimationFrame(frame);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", go);
  else go();
})();
