/* ---------------- v43: the game's side of the Ether's Crossroads music (the songs themselves are in ec-music.js) ----------------
   The songs play in every theme (v71; before, only with the Ether's Crossroads theme): the game opens with its own song, then plays every song once in a shuffled order
   (songs heard longest ago lean to the front) before shuffling again. The Display bar has the Music switch and its volume
   (0 to 150%, in steps of 5%); the sound switch turns the music off with everything else. */
const MUSV = () =>
  Math.max(0, Math.min(1.5, PREF.musicVol == null ? 1 : +PREF.musicVol));
function musicSync() {
  const b = $("#pMusic"),
    on = true; // v71: in every theme
  if (b) {
    b.hidden = !on;
    b.textContent = "Music: " + (PREF.music !== false ? "On" : "Off");
    b.setAttribute("aria-pressed", PREF.music !== false);
  }
  const v = $("#pMusicV");
  if (v) {
    v.hidden = !on;
    const n = v.querySelector("b");
    if (n) n.textContent = Math.round(MUSV() * 100) + "%";
  }
  if (window.ECMusic) window.ECMusic.sync();
}
{
  const _ap = applyPrefs;
  applyPrefs = function () {
    _ap.apply(this, arguments);
    musicSync();
  };
}
{
  const _mb = mountBar;
  mountBar = function () {
    _mb.apply(this, arguments);
    const r = $("#pReset");
    if (!r) return;
    const b = document.createElement("button");
    b.type = "button";
    b.id = "pMusic";
    b.className = "gtog";
    b.onclick = () => {
      PREF.music = PREF.music === false;
      savePrefs();
      musicSync();
    };
    const v = document.createElement("span");
    v.id = "pMusicV";
    v.className = "gctl";
    v.innerHTML = `Music <button type="button" data-mv="-1" aria-label="Quieter music">−</button><b></b><button type="button" data-mv="1" aria-label="Louder music">+</button>`;
    v.querySelectorAll("[data-mv]").forEach(
      (x) =>
        (x.onclick = () => {
          PREF.musicVol =
            Math.round(
              Math.max(0, Math.min(1.5, MUSV() + +x.dataset.mv * 0.05)) * 100,
            ) / 100;
          savePrefs();
          musicSync();
        }),
    );
    r.parentNode.insertBefore(b, r);
    r.parentNode.insertBefore(v, r);
    musicSync();
  };
}
{
  const _t = SND.toggle;
  SND.toggle = function () {
    const v = _t.apply(this, arguments);
    musicSync();
    return v;
  };
}
if (window.__EC) Object.assign(window.__EC, { musicSync });
