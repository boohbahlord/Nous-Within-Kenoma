/* ---------------- v73c: the Cross, and the two-armed Cross (large maps) ----------------
   The Cross is a real cross: four arms around a middle shaped like a diamond (a square turned on its point).
   - Standard: each arm 6 wide and 6 long, around a diamond: a square about 14 on a side (v76a; it was 12) turned on its point, so its sides
     show between the arms and each point reaches into an arm. Small: arms 3 by 3 around a diamond about 6 on a side (on an
     odd grid, so the 3-wide arms line up on its middle).
   - The middle can have a hole in its very center (2 by 2; 1 tile on the small Cross), and on the standard size four hollows
     (2 by 2 each, v76a) out on the diagonals, one tile from the hole and one from the diamond's edge. Both are off by default.
   - Spawns: one player at the end of each arm, two rows deep and as wide as the arm. 2v2: teammates on opposite arms, on
     arms side by side, or (standard size) both on one arm, each in a box 3 wide and 2 deep.
   - The two-armed Cross keeps only the top and bottom arms: up to 4 players on the standard size (two to an arm, in boxes
     3 wide and 2 deep, once there are more than two), 2 on the small one.
   - The old 10 by 10 plus is now Cross Map 2. */
function crossPlan(o){const two=o.big==="cross2",X=o.cross||{},small=X.size==="small",A=small?3:6,N=small?13:26,c0=(N-1)/2,R=small?4:10;   // v76a: the diamond: a square about 14 across (6 small) turned on its point
  let theme=o.map||"random";if(theme==="random")theme=pick(["keep","sahel","forest","dungeon"]);if(theme==="river"||theme==="hill")theme="keep";
  const lo=c0-(A-1)/2,hi=c0+(A-1)/2,band=x=>x>=lo&&x<=hi;
  const V=Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>!(Math.abs(r-c0)+Math.abs(c-c0)<=R||band(c)||!two&&band(r))));
  const holes=[],koth=o.layout==="koth";
  const cf=Math.floor(c0),cc=Math.ceil(c0);
  if(X.hole&&!koth)holes.push(...(small?[[cf,cf]]:[[cf,cf],[cf,cc],[cc,cf],[cc,cc]]));
  // v76a: four hollows, 2 by 2, out on the diagonals: one tile from the hole and one from the diamond's edge, all four alike
  if(X.hollow&&!small)for(const sr of [-1,1])for(const sc of [-1,1])for(const a of [2.5,3.5])for(const b of [2.5,3.5])holes.push([c0+sr*a,c0+sc*b]);
  for(const [r,c] of holes)V[r][c]=true;
  const n=o.players.length,L=o.layout||"duel";
  // a tile at the end of an arm: d rows in from the edge, a tiles from the player's own left
  const tile=(sd,d,a)=>sd==="bottom"?[N-1-d,lo+a]:sd==="top"?[d,hi-a]:sd==="left"?[lo+a,d]:[hi-a,N-1-d];
  const seatOf=(sd,a0,w)=>{const back=[],zone=[];for(let d=0;d<2;d++)for(let a=a0;a<a0+w;a++){const t=tile(sd,d,a);zone.push(t);if(!d)back.push(t)}
    return {side:sd,rot:SIDES[sd].rot,fwd:SIDES[sd].fwd,back,zone}};
  const arm=sd=>seatOf(sd,0,A),box=(sd,k)=>seatOf(sd,k*3,3);
  const seats=[],teams=[],pt=o.players.map(p=>p.team|0);
  if(koth){   // v73d: King of the Hill on the Cross: one to an arm, then two (in boxes); in team mode each side holds two arms
    const team=!!(o.koth&&o.koth.team),slots=n<=4||small?(n===2?["bottom","top"]:n===3?["bottom","left","right"]:["bottom","left","top","right"]).map(sd=>arm(sd)):
      [box("bottom",0),box("top",0),box("left",0),box("right",0),box("bottom",1),box("top",1),box("left",1),box("right",1)];
    if(team&&!small&&n>2){const arms=[["bottom","top"],["left","right"]];pt.forEach((t,i)=>{const mates=pt.map((g,j)=>g===t?j:-1).filter(j=>j>=0),k=mates.indexOf(i),sd=arms[t?1:0][k%2];
      seats.push(mates.length<=2?arm(sd):box(sd,Math.floor(k/2)));teams.push(t?1:0)})}
    else o.players.forEach((p,i)=>{seats.push(slots[i]);teams.push(team?(pt[i]?1:0):i)})}
  else if(L==="factions"&&!two){   // v73d: each faction holds an arm, its two players side by side (one alone holds the whole end)
    const facs=[...new Set(pt)],sides=facs.length===3?["bottom","left","right"]:["bottom","left","top","right"];
    pt.forEach((f,i)=>{const sd=sides[facs.indexOf(f)],mates=pt.map((g,j)=>g===f?j:-1).filter(j=>j>=0);seats.push(mates.length>1&&!small?box(sd,mates.indexOf(i)):arm(sd));teams.push(f)})}
  else if(L.startsWith("team")&&n>4&&!two&&!small){   // v73d: two teams of up to four, two to an arm, on opposite arms or arms side by side
    const arms=L==="team-side"?[["bottom","left"],["top","right"]]:[["bottom","top"],["left","right"]];
    pt.forEach((t,i)=>{const k=pt.slice(0,i).filter(x=>x===t).length,sd=arms[t?1:0][k%2];seats.push(box(sd,Math.floor(k/2)));teams.push(t?1:0)})}
  else if(two){
    if(n<=2||small){seats.push(arm("bottom"),arm("top"));teams.push(0,1)}
    else{const order=[box("bottom",0),box("top",0),box("bottom",1),box("top",1)].slice(0,n);seats.push(...order);teams.push(...order.map((_,i)=>L==="ffa"?i:i%2))}   // teammates share an arm
  }else if(L==="ffa"){(n===3?["bottom","left","right"]:["bottom","left","top","right"]).slice(0,n).forEach((sd,i)=>{seats.push(arm(sd));teams.push(i)})}
  else if(L==="team-same"&&!small){seats.push(box("bottom",0),box("top",0),box("bottom",1),box("top",1));teams.push(0,1,0,1)}
  else if(L==="team-side"){["bottom","right","left","top"].forEach((sd,i)=>{seats.push(arm(sd));teams.push(i%2)})}   // teammates on arms side by side
  else if(L.startsWith("team")){["bottom","left","top","right"].forEach((sd,i)=>{seats.push(arm(sd));teams.push(i%2)})}   // teammates on opposite arms
  else{seats.push(arm("bottom"),arm("top"));teams.push(0,1)}
  return {theme,cols:N,rows:N,mid:true,corners:false,bridge:"left",void:V,seed:(Math.random()*1e9)|0,layout:L,seats,teams,big:o.big,large:true,
    cross:{small,two,hole:!!X.hole,hollow:!!X.hollow&&!small}}}
{const _mp=mapPlan;mapPlan=function(o){if(o&&(o.big==="cross"||o.big==="cross2")&&o.mode!=="survival"&&o.layout!=="coop"){const M=crossPlan(o);if(o.layout==="koth"){const c=(M.cols-1)/2;HILL[0]=Math.floor(c);HILL[1]=Math.ceil(c)}return M}   // v73d: the Hill is the very middle
  if(o&&o.layout==="koth"){HILL[0]=10;HILL[1]=14}return _mp.apply(this,arguments)}}
/* off the map is darker on the crosses, so their shape reads at a glance */
{const _r=render;render=function(){_r.apply(this,arguments);const B=$("#board");if(B)B.classList.toggle("bigvoid",!!(G&&G.map&&["plus","round","cross","cross2"].includes(G.map.big)))}}
/* a large map opens on your own spawn (and on the next player's, when the device changes hands) */
let camHomeKey=null;
function camHome(V){const w=document.querySelector(".camwrap.on"),S=G&&G.map.seats[V];if(!w||!S)return;const ts=S.back.length?S.back:S.zone,[r,c]=ts[Math.floor(ts.length/2)]||[0,0];
  const t=document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`);if(!t)return;const wr=w.getBoundingClientRect(),tr=t.getBoundingClientRect();
  w.scrollLeft+=tr.left+tr.width/2-(wr.left+wr.width/2);w.scrollTop+=tr.top+tr.height/2-(wr.top+wr.height/2)}
{const _r=render;render=function(){_r.apply(this,arguments);if(!G||!isLarge()||fsOn()||!G.map.seats)return;const V=view(),key=G.map.seed+":"+V;if(camHomeKey===key)return;camHomeKey=key;requestAnimationFrame(()=>camHome(V))}}
/* the setup: the Cross's own options show under Large maps when a Cross is picked */
function crossUp(n,big){const b=val("obig"),box=$("#crossopts");if(!box)return;const on=b==="cross"||b==="cross2";box.hidden=!on;if(!on)return;
  const sm=document.querySelector('input[name=oxsize][value=small]'),smOk=!(b==="cross2"&&n>2)&&!big;   // the small two-armed Cross holds two; factions and big teams need the standard size
  sm.disabled=!smOk;sm.closest(".opt").classList.toggle("off",!smOk);if(!smOk&&sm.checked)document.querySelector('input[name=oxsize][value=std]').checked=true;
  const small=val("oxsize")==="small",h=$("#oxhollow");h.disabled=small;h.closest(".chk").classList.toggle("off",small);if(small)h.checked=false}
const crossOpts=()=>({size:val("oxsize")||"std",hole:!!($("#oxhole")&&$("#oxhole").checked),hollow:!!($("#oxhollow")&&$("#oxhollow").checked)&&val("oxsize")!=="small"});

if(window.__EC)Object.assign(window.__EC,{crossPlan:o=>crossPlan(o)});

/* ---------- v73d: factions on the 10 by 10 map: each faction an edge, its players in boxes 3 wide and 2 deep, side by side ---------- */
{const _mp=mapPlan;mapPlan=function(o){if(!(o&&o.layout==="factions"&&o.big!=="cross"))return _mp.apply(this,arguments);
  const M=_mp.call(this,Object.assign({},o,{layout:"ffa",big:"sq",players:o.players.slice(0,4)})),N=M.cols,pt=o.players.map(p=>p.team|0),facs=[...new Set(pt)];
  const sides=facs.length===3?["bottom","left","right"]:["bottom","left","top","right"];
  const tile=(sd,d,a)=>sd==="bottom"?[N-1-d,a]:sd==="top"?[d,N-1-a]:sd==="left"?[a,d]:[N-1-a,N-1-d];
  const seatOf=(sd,a0,w)=>{const back=[],zone=[];for(let d=0;d<2;d++)for(let a=a0;a<a0+w;a++){const t=tile(sd,d,a);if(M.void[t[0]][t[1]])continue;zone.push(t);if(!d)back.push(t)}return {side:sd,rot:SIDES[sd].rot,fwd:SIDES[sd].fwd,back,zone}};
  const seats=[],teams=[];
  pt.forEach((f,i)=>{const sd=sides[facs.indexOf(f)],mates=pt.map((g,j)=>g===f?j:-1).filter(j=>j>=0);seats.push(mates.length>1?seatOf(sd,mates.indexOf(i)?5:2,3):seatOf(sd,3,4));teams.push(f)});
  return Object.assign(M,{layout:"factions",seats,teams})}}
