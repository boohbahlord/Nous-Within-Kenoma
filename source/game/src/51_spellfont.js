/* ---------------- v47: spell names in blackletter (the default); the Display bar and the Menu can turn it off ---------------- */
{
  const _ap = applyPrefs;
  applyPrefs = function () {
    _ap.apply(this, arguments);
    document.body.classList.toggle("spbl", PREF.spellBL !== false);
    const b = $("#pSpellBL");
    if (b) {
      b.textContent =
        "Spell font: " + (PREF.spellBL !== false ? "Old English" : "Plain");
      b.setAttribute("aria-pressed", PREF.spellBL !== false);
    }
  };
}
{
  const _mb = mountBar;
  mountBar = function () {
    _mb.apply(this, arguments);
    const r = $("#pReset");
    if (!r || $("#pSpellBL")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.id = "pSpellBL";
    b.className = "gtog";
    b.onclick = () => {
      PREF.spellBL = PREF.spellBL === false;
      savePrefs();
      applyPrefs();
    };
    r.parentNode.insertBefore(b, r);
    applyPrefs();
  };
}
