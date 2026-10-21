/* ---------- v71n: Field Automation and the crystals ----------
   A stack set to guard a crystal carries st.guard={r,c,until} (it moves with the stack). Its owner (and their teammates)
   sees a soft ring around the crystal and one around the stack, joined by a dashed line; when the stack stands on the
   crystal's tile the two rings lie one over the other. */
function guardSVG(){const B=$("#board");if(!B||!G)return;B.querySelector("svg.guards")?.remove();const V=view();if(V==null)return;
  const BR=B.getBoundingClientRect(),at=(r,c)=>{const t=B.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);if(!t)return null;const R=t.getBoundingClientRect();
    return {x:R.left-BR.left+R.width/2,y:R.top-BR.top+R.height/2,s:Math.min(R.width,R.height)}};
  let h="";
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){const st=G.board[r]&&G.board[r][c];if(!st||!st.guard||isEnemy(st.owner,V)||st.owner!==V&&!alliesOf(V).includes(st.owner))continue;
    const g=st.guard,a=at(r,c),b=at(g.r,g.c);if(!a||!b||!crystalAt(g.r,g.c))continue;const col=G.p[st.owner].color,same=a.x===b.x&&a.y===b.y;
    h+=`<g style="--gc:${col}">`+(same?"":`<line class="gl" x1="${b.x.toFixed(1)}" y1="${b.y.toFixed(1)}" x2="${a.x.toFixed(1)}" y2="${a.y.toFixed(1)}"/>`)+
      `<circle class="gc gcry" cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="${(b.s*(same?.5:.44)).toFixed(1)}"/><circle class="gc" cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="${(a.s*.44).toFixed(1)}"/></g>`}
  if(h)B.insertAdjacentHTML("beforeend",`<svg class="guards" aria-hidden="true">${h}</svg>`)}
