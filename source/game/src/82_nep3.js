/* ---------- v71p: Neptune's eclipse, more lies ----------
   - A stranger's stack picked up looks like your own: its move or attack tiles (73_neptune.js), and a Selected box that
     reads "Your stack" with your own buttons (any of them is acting with it, and costs 1d2 deck cards). Under the eclipse
     no box or tip names a stack's owner, and the Selected box shows its cards in the same stranger's colors as the field.
   - Card patterns, metal sheen and the cards' frames lie with the colors: each stack takes a stranger's pattern and frame too.
   - Every player's deck and mana meters show, but filled with static, and their numbers are random, numerator and
     denominator, rolling again every moment (with Data saving or reduced motion, at each redraw). */
const nepDisg=(st,E)=>COLORS[nepHash(st.cards[0].id+"|"+E.seed)%COLORS.length][1];
const nepPat=(st,E)=>nepHash(st.cards[0].id+"|p|"+E.seed)%(PATTERNS.length+1)-1;   // −1: none
{const _rs=renderSel;renderSel=function(){const S=G&&G.sel,V=G?view():null,st=S&&S.nepFoe&&nepEcFor(V)&&G.board[S.r]&&G.board[S.r][S.c];
  if(!st)return _rs.apply(this,arguments);
  const keep={owner:st.owner,moved:st.moved,attacked:st.attacked},vis=G._vis;st.owner=V;st.moved=false;st.attacked=false;G._vis=null;
  try{return _rs.apply(this,arguments)}finally{Object.assign(st,keep);G._vis=vis}}}   // drawn as yours, then given back
{const _i=infoHTML1;infoHTML1=function(st){const h=_i.apply(this,arguments),E=G&&nepEcState(view());if(!E||!st||!st.cards||!st.cards[0])return h;
  return h.replace(/ <span class="dim">· [^<]*<\/span>/,"").replace(/style="--pc:[^"]*"/,`style="--pc:${nepDisg(st,E)}"`)}}
const nepPaint=(el,col,p)=>{if(col){el.style.setProperty("--pc",col);el.style.setProperty("--pcb",`color-mix(in oklab,${col} 44%,#211b16)`);el.style.setProperty("--ca",`color-mix(in oklab,${col} 55%,#f3e7d2)`)}   // the frame lies too
  el.style.setProperty("--cbpat",p<0?"none":`var(--pat${p})`);el.classList.remove("sheen")};
function nepMeters(){if(!document.documentElement.classList.contains("nepec"))return;
  const roll=(lo,hi)=>lo+Math.floor(Math.random()*(hi-lo+1));
  for(const b of document.querySelectorAll(".meters .meter b.mv,#foe.minis .mline b")){const deck=!!b.closest(".meter:not(.mana)")||/^Deck/.test((b.parentNode.querySelector("span")||{}).textContent||"");
    b.textContent=deck?`${roll(0,60)}/${roll(1,60)}`:`${roll(0,24)}/${roll(1,20)}`;b.classList.add("nepnum");b.classList.remove("neg")}
  for(const bar of document.querySelectorAll(".meters .deckbar,.meters .manabar"))bar.setAttribute("aria-label",`${bar.classList.contains("deckbar")?"Deck":"Mana"}: lost in Neptune's eclipse`)}
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;const V=view(),E=nepEcState(V);if(!E)return;
  for(const t of document.querySelectorAll("#board button.tile")){const st=G.board[+t.dataset.r][+t.dataset.c];if(!st||!st.cards[0])continue;const p=nepPat(st,E);
    const col=nepDisg(st,E);for(const el of t.querySelectorAll(".v61"))nepPaint(el,col,p)}
  const box=$("#selbox"),S=G.sel,st=S&&G.board[S.r]&&G.board[S.r][S.c];
  if(box&&st&&st.cards[0]){const col=nepDisg(st,E),p=nepPat(st,E);for(const el of box.querySelectorAll(".v61,.cin"))nepPaint(el,col,p);
    const h=box.querySelector("p>b");if(h){let t=h.textContent;for(const P of G.p)if(P.name&&E.names[P.i])t=t.split(P.name).join(E.names[P.i]);if(t!==h.textContent)h.textContent=t}}
  nepMeters()}}
setInterval(()=>{if(!G||document.hidden)return;const h=document.documentElement;if(!h.classList.contains("nepec")||h.classList.contains("lite")||matchMedia("(prefers-reduced-motion: reduce)").matches)return;nepMeters()},1400);

if(window.__EC)Object.assign(window.__EC,{nepMetersW:()=>nepMeters()});
