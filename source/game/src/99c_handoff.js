/* ---------------- v78j: questions on a shared device, and the phase timer's answer ----------------
   Last of all, so these wrap every kind of question (the sky's bids and the crystal guards draw their own windows). */
/* v78j: the question on screen, so the phase timer can answer it when time runs out (as the computer would) */
let askOpen = null;
const ASK_SAFE = { yesno: false, bid: null, crysguard: null }; // v78p: what time running out answers: No, Pass, no guard
const askSafe = ({ pl, spec }) =>
  spec.kind in ASK_SAFE
    ? ASK_SAFE[spec.kind]
    : spec.cancel
      ? null
      : spec.ai
        ? spec.ai()
        : AI.choose(pl, spec);
{
  const _ah = askHuman;
  askHuman = function (pl, spec) {
    return new Promise((res) => {
      let open = true;
      const q = (askOpen = {
        pl,
        spec,
        answer: (v) => {
          if (!open) return;
          open = false;
          ovHide();
          res(v);
        },
      });
      _ah.call(this, pl, spec).then((v) => {
        if (askOpen === q) askOpen = null;
        if (open) {
          open = false;
          res(v);
        }
      });
    });
  };
}
/* v78j: two or more people on one device: a question for someone other than the person holding it (a trade, the Full
   Moon's toll, a vote) passes the device to them first, shows their own view, and passes it back after */
{
  const _ah = askHuman;
  askHuman = async function (pl, spec) {
    if (
      !G ||
      G.opts.online ||
      G.atDevice == null ||
      pl === G.atDevice ||
      G.p.filter((P) => !P.cpu).length < 2
    )
      return _ah.apply(this, arguments);
    const g = G,
      back = G.atDevice;
    await passScreen(`A question for ${G.p[pl].name}`, pl);
    G.viewAs = pl;
    render();
    try {
      return await _ah.apply(this, arguments);
    } finally {
      if (G === g) {
        G.viewAs = null;
        if (!G.over && G.p[back] && !G.p[back].out)
          await passScreen(`Back to ${G.p[back].name}`, back);
      }
    }
  };
}
