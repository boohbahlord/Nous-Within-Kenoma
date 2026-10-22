/* ---------------- the round counter at the top of the play page, in blackletter (v49; v52: rounds only) ----------------
   A round is every player's turn once; a turn is one player's draw, prep and attack phases. The top shows the round, and a
   small label in the style of the line names sits at the top right of the field. */
{const _r=render;render=function(){rSafe(_r,this,arguments);const h=document.querySelector(".game header");if(!h)return;let t=$("#turnctr");
  if(!t){t=document.createElement("div");t.id="turnctr";t.setAttribute("aria-live","off");h.appendChild(t)}
  if(!G){t.hidden=true;return}t.hidden=false;const n=Math.max(1,G.moon?G.moon.round:1);
  t.innerHTML=`<span>Round</span> <b>${n}</b>`;t.title=`Round ${n}: every player has a turn each round`;
  const B=$("#board");if(B&&B.parentNode){let f=$("#fieldround");if(!f){f=document.createElement("div");f.id="fieldround";B.parentNode.insertBefore(f,B)}f.textContent=`Round ${n}`}}}
