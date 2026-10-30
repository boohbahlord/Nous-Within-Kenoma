/* ---------------- v78q: moving into the fog: Card Blocks Path ----------------
   A tile in the fog looks empty to you, so a stack may try to move there (or through it, on a two-tile step). If a hidden
   enemy card stands there, the move stops ("Card Blocks Path", or "Cards Block Path" for a stack), the stack keeps its
   move, and the tile shows to you and your side for a round (through your next turn). The computer weighs only what it
   could see anyway and never steps in blind. */
const fogHid = (me, r, c) => {
  const t = G.board[r] && G.board[r][c];
  return !!(t && isEnemy(t.owner, me) && hiddenFrom(me, r, c));
};
function fogBump(r, c) {
  const s = G.sel,
    st = s && G.board[s.r] && G.board[s.r][s.c];
  if (!st || aiSel || !G.p[st.owner] || G.p[st.owner].cpu) return false;
  const me = st.owner,
    dr = Math.abs(r - s.r),
    dc = Math.abs(c - s.c),
    at = [];
  if ((dr + dc === 2 && (dr === 0 || dc === 0)) || (dr === 2 && dc === 2))
    at.push([(r + s.r) / 2, (c + s.c) / 2]);
  at.push([r, c]);
  const hit = at.find(([a, b]) => fogHid(me, a, b));
  if (!hit) return false;
  const [a, b] = hit,
    t = G.board[a][b],
    many = t.cards.length > 1,
    name = many ? "Cards Block Path" : "Card Blocks Path";
  G.fogPeek = (G.fogPeek || []).filter((p) => tnOf(p.pl) <= p.until);
  G.fogPeek.push({ pl: me, r: a, c: b, until: tnOf(me) + 1 });
  G._vis = null;
  G.mode = null;
  log.fog = {
    by: me,
    seen: G.p.map((P) => !isEnemy(me, P.i) || !isEnemy(t.owner, P.i)),
    alt: "",
  };
  const where = a === r && b === c ? "there" : `on ${coord(a, b)}, on the way`;
  log(
    `<b>${name}</b>: ${plName(me)}'s move to ${coord(r, c)} runs into ${many ? "hidden cards" : "a hidden card"} ${where}. The stack keeps its move, and ${coord(a, b)} shows to ${plName(me)} for a round.`,
    "event",
  );
  if (me === view())
    flash(
      `${name}: ${many ? "hidden cards stand" : "a hidden card stands"} on ${coord(a, b)}. Your stack keeps its move.`,
    );
  return true;
}
const fogPeekAt = (V, r, c) =>
  !!(
    G &&
    G.fogPeek &&
    V != null &&
    G.p[V] &&
    !totalBlind(V) &&
    G.fogPeek.some(
      (p) =>
        p.r === r && p.c === c && !isEnemy(p.pl, V) && tnOf(p.pl) <= p.until,
    )
  );
{
  const _s = seesTile;
  seesTile = function (V, r, c) {
    if (fogPeekAt(V, r, c)) return true;
    return _s.apply(this, arguments);
  };
}
{
  const _f = fogTile;
  fogTile = function (V, r, c) {
    if (fogPeekAt(V, r, c)) return false;
    return _f.apply(this, arguments);
  };
}
/* the move highlights treat a hidden enemy's tile as the empty ground it looks like */
{
  const _mt = moveTargets;
  moveTargets = function () {
    const s = G.sel,
      st = s && G.board[s.r] && G.board[s.r][s.c];
    if (!st || aiSel || !G.p[st.owner] || G.p[st.owner].cpu)
      return _mt.apply(this, arguments);
    const hid = [];
    for (let r = 0; r < G.rows; r++)
      for (let c = 0; c < COLS; c++) {
        const t = G.board[r][c];
        if (t && t !== st && fogHid(st.owner, r, c)) hid.push([r, c, t]);
      }
    if (!hid.length) return _mt.apply(this, arguments);
    for (const [r, c] of hid) G.board[r][c] = null;
    try {
      return _mt.apply(this, arguments);
    } finally {
      for (const [r, c, t] of hid) G.board[r][c] = t;
    }
  };
}
{
  const _dm = doMove;
  doMove = function (r, c) {
    if (fogBump(r, c)) return;
    return _dm.apply(this, arguments);
  };
}
