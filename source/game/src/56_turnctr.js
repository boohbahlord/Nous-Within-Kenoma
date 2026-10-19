/* ---------------- v49: the turn counter at the top of the play page, in blackletter ---------------- */
{const _r=render;render=function(){_r.apply(this,arguments);const h=document.querySelector(".game header");if(!h)return;let t=$("#turnctr");
  if(!t){t=document.createElement("div");t.id="turnctr";t.setAttribute("aria-live","off");h.appendChild(t)}
  if(!G){t.hidden=true;return}t.hidden=false;const n=Math.max(1,G.turnNo||1);
  t.innerHTML=`<span>Turn</span> <b>${n}</b><small>Round ${Math.max(1,G.moon?G.moon.round:1)}</small>`;t.title=`Turn ${n} of the game, round ${Math.max(1,G.moon?G.moon.round:1)}`}}
