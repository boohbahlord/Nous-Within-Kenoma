/* ---------------- v73d: team colors ----------------
   In a game of teams (2v2, King of the Hill in teams, and the factions to come) every card of a side carries its side's color
   in its top-left and bottom-right corners (a class's color takes the other two), and each player's box names the side:
   Red, Blue, Green or Yellow. Everyone sees them; Neptune's eclipse hides them with every other color. */
const SIDE_COL=[["Red","#d7333b"],["Blue","#4c92e6"],["Green","#45b89c"],["Yellow","#e3b944"]];
function teamsOn(){if(!G||!G.map)return false;const L=G.map.layout||"";return L.startsWith("team")||!!G.opts.factions||L==="koth"&&!!(G.opts.koth&&G.opts.koth.team)}
function sideCol(pl){if(!teamsOn()||pl==null||!G.p[pl]||isNPC(pl)||G.p[pl].cpu==="horde")return null;const t=G.p[pl].team|0;return SIDE_COL[t]||null}
const sideShown=()=>!(typeof nepEcState==="function"&&nepEcState(view()));
{const _f=face;face=function(c,o={}){const h=_f.apply(this,arguments);if(!G||!c)return h;const own=o.owner!==undefined?o.owner:c.owner,s=sideCol(own);if(!s||!sideShown())return h;
  return h.replace(/class="cf /,'class="cf tmark ').replace(/style="/,`style="--tmc:${cbMap(s[1])};`)}}
{const _sd=siegeDecor;siegeDecor=function(inner,st){const h=_sd.apply(this,arguments);if(!st||!G)return h;const s=sideCol(st.owner);if(!s||!sideShown())return h;
  return h.replace(/(<div class="stack)([^"]*")( style=")/,(m,a,b,c)=>`${a} tmark${b}${c}--tmc:${cbMap(s[1])};`)}}
{const _pb=pboxHTML;pboxHTML=function(pl){const h=_pb.apply(this,arguments),s=sideCol(pl);if(!s||!sideShown())return h;
  const name=G.opts.koth&&G.opts.koth.team&&G.map.layout==="koth"?(s[0]==="Red"?"Side A":"Side B"):`${s[0]} ${G.opts.factions?"faction":"team"}`;
  return h.replace("</b>",`</b><span class="tchip" style="--tc:${cbMap(s[1])}" title="${esc(name)}">${esc(name)}</span>`)}}

if(window.__EC)Object.assign(window.__EC,{sideCol:pl=>sideCol(pl),teamsOn:()=>teamsOn()});
