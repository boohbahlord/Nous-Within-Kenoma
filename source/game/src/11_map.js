/* ---------------- maps: size, shape and battle-map art (all drawn in code, all at night) ---------------- */
const MAPS={
  keep:  {name:"Keep",           sub:"A stone keep, a graveyard on the midline and the enemy's barracks."},
  sahel: {name:"Sahel",          sub:"Red laterite and dry grass of the far north at night, with mud-brick walls and thatched huts."},
  forest:{name:"Forest",         sub:"A clearing in deep woods, with a palisade keep and a camp of tents."},
  dungeon:{name:"Dungeon",       sub:"Flagstones, pillars and torchlight, with no castle and no barracks."},
  river: {name:"River",          sub:"A wide brown river like the Ogun near Lagos, crossed by one bridge. Always 7 wide with the midline, and 1v1 only."},
  none:  {name:"No map",         sub:"Plain tiles."},
  hill:  {name:"The Hill",       sub:"King of the Hill only: a 25 by 25 night field, forests and mountains around a glowing Hill."}
};
/* layouts: duel (two sides), ffa (3 or 4 players, one to each edge), team-side / team-across (2v2 on the edges),
   team-same (2v2, teammates side by side on one side), coop (Survival with several players on one side) */
const SIDES={bottom:{rot:0,fwd:[-1,0]},left:{rot:1,fwd:[0,1]},top:{rot:2,fwd:[1,0]},right:{rot:3,fwd:[0,-1]}};
function edgeTiles(side,rows,cols){const o=[];if(side==="bottom")for(let c=0;c<cols;c++)o.push([rows-1,c]);if(side==="top")for(let c=0;c<cols;c++)o.push([0,c]);if(side==="left")for(let r=0;r<rows;r++)o.push([r,0]);if(side==="right")for(let r=0;r<rows;r++)o.push([r,cols-1]);return o}
function mapPlan(o){
  if(o.layout==="koth")return kothPlan(o);   // v57: King of the Hill has its own 25 by 25 field
  const n=o.players.length,L=o.layout||"duel";
  let theme=o.map||"random";
  if(theme==="random")theme=pick(["keep","sahel","forest","dungeon"]);   // the special maps (River, no map) are only played when chosen
  if((o.mode==="survival"||L!=="duel")&&theme==="river")theme="keep";   // the river needs a two-sided field with every midline tile in play
  let cols=Math.max(5,Math.min(7,+o.cols||5)),mid=o.mode==="survival"||o.mid!==false,corners=!!o.corners,bridge=o.bridge==="right"?"right":"left",rows;
  if(theme==="river"){cols=7;mid=true;corners=false}
  const clamp=(v,a,b,d)=>{v=+v;return v>=a&&v<=b?Math.round(v):d};
  if(L==="ffa"||L==="team-side"||L==="team-across"){cols=rows=clamp(o.size,5,9,7);corners=o.corners!==false;mid=true}
  else if(L==="team-same"){cols=clamp(o.cols,6,8,6);rows=clamp(o.rows,4,6,6);mid=rows>4}
  else if(L==="coop"){const h=n-1;cols=clamp(o.cols,Math.max(5,h*2),9,h===2?6:h===3?9:8);rows=clamp(o.rows,5,6,h===2?5:6);mid=true;corners=false}
  else{rows=o.mode==="survival"||theme==="river"?5:clamp(o.rows,4,6,mid?5:4);mid=o.mode==="survival"||rows>4}   // v62: 1v1 can be 6 tall (two midlines); the default is 6 by 6
  /* v56: the large maps: 10 long by 6 wide (1v1, and 2v2 on one end), 10 by 10, a 10 by 10 plus (arms 4 wide), and the plus
     with a round middle. All of them use the large-map camera. */
  const big=["long","sq","plus","round"].includes(o.big)&&o.mode!=="survival"&&L!=="coop"?o.big:null;
  if(big){if(big==="long"&&!(L==="duel"||L==="team-same"))o={...o,big:"sq"};const b=o.big;cols=b==="long"?6:10;rows=10;mid=true;corners=false;if(theme==="river")theme="keep"}
  const V=Array.from({length:rows},()=>Array(cols).fill(false));
  if(big&&(o.big==="plus"||o.big==="round"))for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const arm=(r>=3&&r<=6)||(c>=3&&c<=6),disc=o.big==="round"&&Math.hypot(r-4.5,c-4.5)<=3.7;V[r][c]=!(arm||disc)}
  if(corners)for(const r of [0,rows-1])for(const c of [0,cols-1])V[r][c]=true;
  if(theme==="river"){const r=2;for(let c=0;c<cols;c++)V[r][c]=!(bridge==="left"?c<2:c>=cols-2)}
  // seats: where each player spawns (zone), where their Aces go (back), which way is forward, how the view turns for them
  const seats=[],teams=[];
  const mk2=(side,cs,lines)=>{const S=SIDES[side],back=[],zone=[];
    for(let k=0;k<lines;k++)for(const c of cs){const r=side==="bottom"?rows-1-k:k;(k===0?back:zone).push([r,c]);zone.push([r,c])}
    return{side,rot:S.rot,fwd:S.fwd,back,zone:[...new Map(zone.map(t=>[t.join(),t])).values()]}};
  const allc=[...Array(cols).keys()];
  const lines=cols<=6&&rows<=6?1:2,coopLines=cols<=5&&rows<=5?1:2;   // v70: 6 by 6 and smaller have one spawn line a side (survival keeps its own)
  // v70: with three or more players on a field 7 by 7 or larger, each spawn line is the five tiles in the middle of its edge
  const five=t=>{const ok=t.filter(([r,c])=>!V[r][c]);if(n<3||cols<7||rows<7||ok.length<=5)return ok;const m=Math.floor((ok.length-5)/2);return ok.slice(m,m+5)};
  if(big&&(o.big==="plus"||o.big==="round"))allc.splice(0,allc.length,3,4,5,6);   // the plus: spawn at the ends of the arms   // v53: a field 5 by 5 or smaller has one spawn line a side, the backline
  if(L==="duel"){seats.push(mk2("bottom",allc,lines),mk2("top",allc,lines));teams.push(0,1)}
  else if(L==="ffa"||L==="team-side"||L==="team-across"){
    const sides=L==="ffa"?(n===3?["bottom","left","right"]:["bottom","left","top","right"]):L==="team-side"?["bottom","right","left","top"]:["bottom","left","top","right"];
    const bigEdge=sd=>{const len=sd==="left"||sd==="right"?rows:cols,lo=o.big==="plus"||o.big==="round"?3:2,hi=len-1-lo,back=[],zone=[];
      for(let d=0;d<2;d++)for(let a=lo;a<=hi;a++){const r=sd==="bottom"?rows-1-d:sd==="top"?d:a,c=sd==="left"?d:sd==="right"?cols-1-d:a;if(V[r][c])continue;zone.push([r,c]);if(!d)back.push([r,c])}
      return {back,zone}};
    sides.slice(0,n).forEach((sd,i)=>{const t=five(big?bigEdge(sd).back:edgeTiles(sd,rows,cols));seats.push({side:sd,rot:SIDES[sd].rot,fwd:SIDES[sd].fwd,back:t,zone:t});teams.push(L==="ffa"?i:i%2)});
  }else if(L==="team-same"){
    // v78a: teammates on the same side hold both spawn rows, half the width each (sharing comes only by leave: Diplomacy)
    const h=Math.floor(allc.length/2),L1=allc.slice(0,h),R1=allc.slice(h);   // v78j: half of the columns that spawn
    seats.push(mk2("bottom",L1,2),mk2("top",L1,2),mk2("bottom",R1,2),mk2("top",R1,2));teams.push(0,1,0,1);
  }else if(L==="coop"){
    const h=n-1,w=Math.floor(cols/h);
    for(let i=0;i<h;i++){seats.push(mk2("bottom",allc.slice(i*w,i===h-1?cols:(i+1)*w),coopLines));teams.push(0)}
    seats.push(mk2("top",allc,coopLines));teams.push(1);
  }
  // the hole in the middle (off by default; never with the river): one or two tiles each way, doubled or tripled where there's room
  const hole=+o.hole||0;
  if(hole&&theme!=="river"&&o.mode!=="survival"){
    const inZone=new Set(seats.flatMap(S=>S.zone.map(t=>t.join())));
    const rs=rows%2?[(rows-1)/2]:[rows/2-1,rows/2],cs=cols%2?[(cols-1)/2]:[cols/2-1,cols/2],g=hole-1;
    for(let r=rs[0]-g;r<=rs[rs.length-1]+g;r++)for(let c=cs[0]-g;c<=cs[cs.length-1]+g;c++){
      if(r<0||c<1||r>=rows||c>=cols-1||inZone.has(r+","+c))continue;   // never in anyone's lines, and the outer columns stay open
      if(hole===2&&!rs.includes(r)&&!cs.includes(c))continue;   // doubled: a cross; tripled: the full square
      V[r][c]=true}
  }
  return{theme,cols,rows,mid,corners,bridge,void:V,seed:(Math.random()*1e9)|0,layout:L,seats,teams,big:big?o.big:null,large:cols>9||rows>9};
}
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const PAL={
  keep:  {ground:"#26321e",patch:["#2d3a23","#1f2a18","#34432a"],tuft:"#5c703e",stone:"#6a6962",stone2:"#4f4e48",wood:"#5e4328",wood2:"#3e2c1a",tent:"#7a6646",dirt:"#3a2e20",grave:"#8a897f"},
  sahel: {ground:"#4c2d1b",patch:["#573421","#3f2516","#62402a"],tuft:"#8a7746",stone:"#8f5a33",stone2:"#6a4026",wood:"#7a5530",wood2:"#55391e",tent:"#937a45",dirt:"#52331e",grave:"#9a856c"},
  forest:{ground:"#1d3020",patch:["#233a26","#172719","#2a452c"],tuft:"#46683e",stone:"#57604f",stone2:"#3f463a",wood:"#5e4228",wood2:"#3e2b19",tent:"#66603f",dirt:"#2f2619",grave:"#7c8276"},
  dungeon:{ground:"#232229",patch:["#2a2931","#1b1a20","#323039"],tuft:"#3b3a42",stone:"#4f4e58",stone2:"#3b3a43",wood:"#4a3622",wood2:"#2f2216",tent:"#4a443c",dirt:"#28252a",grave:"#77757f"},
  hill:  {ground:"#1f2c1c",patch:["#26341f","#1a2617","#2c3b24"],tuft:"#55703c",stone:"#6a6962",stone2:"#4f4e48",wood:"#5e4328",wood2:"#3e2c1a",tent:"#7a6646",dirt:"#3a2e20",grave:"#8a897f"},
  river: {ground:"#4a2819",patch:["#55301e","#3d2114",""+"#5e3a24"],tuft:"#55783a",stone:"#6e4a30",stone2:"#503420",wood:"#6e4c2a",wood2:"#4a3018",tent:"#6e5c3a",dirt:"#4a2a1a",grave:"#86745e",water:"#3b3622",water2:"#6a6040"}
};
const f1=n=>n.toFixed(1);
/* the ground under the whole board, seen through the gaps between tiles */
function mapGround(){
  const M=G.map;if(M.theme==="none")return "";
  const P=PAL[M.theme],W=COLS*100,H=G.rows*100,rnd=rng(M.seed);let s=`<rect width="${W}" height="${H}" fill="${P.ground}"/>`;
  for(let i=0;i<COLS*G.rows*5;i++)s+=`<ellipse cx="${f1(rnd()*W)}" cy="${f1(rnd()*H)}" rx="${f1(14+rnd()*40)}" ry="${f1(8+rnd()*26)}" fill="${P.patch[Math.floor(rnd()*P.patch.length)]}" opacity=".7"/>`;
  if(M.theme==="dungeon")for(let x=0;x<W;x+=25)s+=`<path d="M${x},0V${H}" stroke="#0c0b0e" stroke-width="1.2"/>`;
  return `<svg class="mapground" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}<rect width="${W}" height="${H}" fill="#14204a" opacity=".14"/></svg>`;
}
/* the art inside one tile. role: fort | barracks | field | grave | water | bridge | void ; edge: "top" | "bottom" (the outer side of a backline) */
function tileArt(r,c,role,edge){
  const M=G.map;if(M.theme==="none")return "";
  const P=PAL[M.theme],T=M.theme,rnd=rng(M.seed+r*131+c*17);let s="";
  const rr=(a,b)=>a+rnd()*(b-a);
  const tufts=n=>{for(let i=0;i<n;i++){const x=rr(6,94),y=rr(6,84);s+=`<path d="M${f1(x)},${f1(y)}l-2,-5M${f1(x)},${f1(y)}l0,-6M${f1(x)},${f1(y)}l2,-5" stroke="${P.tuft}" stroke-width="1.1" stroke-linecap="round"/>`}};
  const rocks=n=>{for(let i=0;i<n;i++)s+=`<ellipse cx="${f1(rr(8,92))}" cy="${f1(rr(8,82))}" rx="${f1(rr(2,5))}" ry="${f1(rr(1.5,4))}" fill="${P.stone2}"/>`};
  const flags=(col1,col2)=>{for(let y=0;y<90;y+=18)for(let x=-(y/18%2)*12;x<100;x+=24)s+=`<rect x="${f1(x+1)}" y="${f1(y+1)}" width="22" height="16" rx="1.5" fill="${rnd()<.5?col1:col2}" stroke="#0008" stroke-width=".8"/>`};
  const tree=(x,y,R,col)=>{s+=`<circle cx="${f1(x+2)}" cy="${f1(y+3)}" r="${f1(R)}" fill="#0007"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="${col}"/><circle cx="${f1(x-R*.3)}" cy="${f1(y-R*.3)}" r="${f1(R*.45)}" fill="#ffffff0d"/>`};
  const palm=(x,y,R)=>{for(let k=0;k<7;k++){const a=k/7*Math.PI*2+rnd()*.4;s+=`<path d="M${f1(x)},${f1(y)}q${f1(Math.cos(a+.4)*R*.6)},${f1(Math.sin(a+.4)*R*.6)} ${f1(Math.cos(a)*R)},${f1(Math.sin(a)*R)}" stroke="#2f4a22" stroke-width="2.4" fill="none" stroke-linecap="round"/>`}s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="2.2" fill="#3a2a18"/>`};
  const acacia=(x,y,R)=>{s+=`<ellipse cx="${f1(x+2)}" cy="${f1(y+2)}" rx="${f1(R)}" ry="${f1(R*.7)}" fill="#0006"/><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(R)}" ry="${f1(R*.7)}" fill="#3a3a1e"/><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(R*.55)}" ry="${f1(R*.38)}" fill="#47462a"/>`};
  let turn=0;if(edge==="left"){turn=90;edge="bottom"}else if(edge==="right"){turn=-90;edge="bottom"}
  const wallY=edge==="top"?0:78;
  if(role==="void"){
    if(T==="forest"||T==="river")for(let i=0;i<4;i++)tree(rr(10,90),rr(10,80),rr(10,18),T==="river"?"#203a1c":"#173018");
    else{s+=`<rect width="100" height="90" fill="#0006"/>`;rocks(9)}
  }else if(role==="water"){
    s+=`<rect width="100" height="90" fill="${P.water}"/>`;
    for(let i=0;i<7;i++){const y=rr(8,82),x=rr(-10,70);s+=`<path d="M${f1(x)},${f1(y)}q8,-3 16,0t16,0" stroke="${P.water2}" stroke-width="1.4" fill="none"/>`}
    for(let i=0;i<2;i++){const x=rr(10,90),y=rr(15,75);s+=`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rr(8,16))}" ry="2" fill="#c8d4ff" opacity=".06"/>`}
    s+=`<path d="M0,2Q50,${f1(rr(5,10))} 100,2" stroke="#5a3a22" stroke-width="3" fill="none" opacity=".7"/><path d="M0,88Q50,${f1(rr(80,85))} 100,88" stroke="#5a3a22" stroke-width="3" fill="none" opacity=".7"/>`;
  }else if(role==="bridge"){
    s+=`<rect width="100" height="90" fill="${P.water}"/>`;
    for(let x=6;x<94;x+=11)s+=`<rect x="${x}" y="0" width="10" height="90" fill="${rnd()<.5?P.wood:P.wood2}" stroke="#0008" stroke-width=".8"/>`;
    s+=`<path d="M3,0V90M97,0V90" stroke="#2a1a0e" stroke-width="3"/>`;
  }else if(role==="fort"&&T!=="dungeon"&&T!=="river"){
    if(T==="sahel"){flags("#5a3520","#4f2e1b");s+=`<rect x="0" y="${wallY}" width="100" height="12" fill="${P.stone}"/>`;for(let x=2;x<100;x+=12)s+=`<path d="M${x},${edge==="top"?12:78}l5,${edge==="top"?5:-5}l5,${edge==="top"?-5:5}z" fill="${P.stone}"/>`}
    else if(T==="forest"){for(let y=0;y<90;y+=12)s+=`<rect x="0" y="${y}" width="100" height="11" fill="${rnd()<.5?P.wood:P.wood2}" opacity=".85"/>`;s+=`<rect x="0" y="${wallY}" width="100" height="12" fill="#3a2614"/>`;for(let x=3;x<100;x+=9)s+=`<circle cx="${x}" cy="${wallY+6}" r="4" fill="#4a3220" stroke="#0007"/>`}
    else{flags(P.stone,P.stone2);s+=`<rect x="0" y="${wallY}" width="100" height="12" fill="#5a5a55" stroke="#0009"/>`;for(let x=0;x<100;x+=14)s+=`<rect x="${x+2}" y="${edge==="top"?12:72}" width="8" height="6" fill="#5a5a55" stroke="#0009" stroke-width=".8"/>`}
    if(c===0||c===COLS-1){const x=c===0?14:86;s+=`<circle cx="${x}" cy="${edge==="top"?14:76}" r="12" fill="${T==="sahel"?P.stone:"#5f5f59"}" stroke="#000a" stroke-width="1.2"/><circle cx="${x}" cy="${edge==="top"?14:76}" r="6" fill="#0006"/>`}
  }else if(role==="barracks"&&T!=="dungeon"&&T!=="river"){
    s+=`<rect width="100" height="90" fill="${P.dirt}" opacity=".7"/>`;
    if(T==="sahel"){for(let i=0;i<2;i++){const x=rr(25,75),y=rr(25,65),R=rr(12,16);s+=`<circle cx="${f1(x+2)}" cy="${f1(y+2)}" r="${f1(R)}" fill="#0007"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="${P.tent}"/>`;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;s+=`<path d="M${f1(x)},${f1(y)}L${f1(x+Math.cos(a)*R)},${f1(y+Math.sin(a)*R)}" stroke="#4a3a1e" stroke-width=".8"/>`}}}
    else{const n=rnd()<.5?1:2;for(let i=0;i<n;i++){const R=n===1?rr(20,24):rr(14,17),x=n===1?rr(38,62):(i?rr(66,78):rr(22,34)),y=rr(34,56);
      s+=`<circle cx="${f1(x+3)}" cy="${f1(y+3)}" r="${f1(R)}" fill="#0008"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="${P.tent}" stroke="#000a" stroke-width="1"/>`;
      for(let k=0;k<8;k++){const a=k/8*Math.PI*2;s+=`<path d="M${f1(x)},${f1(y)}L${f1(x+Math.cos(a)*R)},${f1(y+Math.sin(a)*R)}" stroke="#0005" stroke-width="1"/>`}
      s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="2.2" fill="#2a1e12"/>`;
      for(let k=0;k<4;k++){const a=k/4*Math.PI*2+.4;s+=`<path d="M${f1(x+Math.cos(a)*R)},${f1(y+Math.sin(a)*R)}l${f1(Math.cos(a)*6)},${f1(Math.sin(a)*6)}" stroke="#a89878" stroke-width=".7"/>`}}
      for(let i=0;i<2;i++){const x=rr(8,88),y=rr(72,84);s+=`<rect x="${f1(x)}" y="${f1(y)}" width="9" height="6" fill="${P.wood}" stroke="#0008" stroke-width=".7"/>`}}
    if(rnd()<.4){const x=rr(70,88),y=rr(60,80);s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="#ff8a2a" opacity=".18"/><circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="#ffb24a" opacity=".8"/>`}
  }else if(role==="grave"&&T!=="river"){
    s+=`<rect width="100" height="90" fill="${P.dirt}" opacity=".55"/>`;
    const n=2+Math.floor(rnd()*3);
    for(let i=0;i<n;i++){const x=rr(10,82),y=rr(10,70);
      if(T==="sahel")s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="${P.grave}"/><circle cx="${f1(x+4)}" cy="${f1(y+3)}" r="4" fill="#5d4c3c"/><circle cx="${f1(x+1)}" cy="${f1(y+6)}" r="3.5" fill="#6a5848"/>`;
      else if(rnd()<.3)s+=`<path d="M${f1(x+4)},${f1(y)}v14M${f1(x)},${f1(y+4)}h8" stroke="${P.grave}" stroke-width="2.2"/>`;
      else s+=`<rect x="${f1(x+1.5)}" y="${f1(y+1.5)}" width="10" height="14" rx="4" fill="#0008"/><rect x="${f1(x)}" y="${f1(y)}" width="10" height="14" rx="4" fill="${P.grave}"/><rect x="${f1(x+2)}" y="${f1(y+16)}" width="6" height="7" fill="#1a140e" opacity=".7"/>`}
    if(T==="dungeon")s+=`<path d="M${f1(rr(10,40))},${f1(rr(40,80))}l12,-4m-6,-3l3,8" stroke="#a8a294" stroke-width="1.6"/>`;
    else rocks(2);
  }else if(T==="dungeon"){
    flags(P.stone,P.stone2);
    if(rnd()<.35)s+=`<path d="M${f1(rr(10,60))},${f1(rr(10,40))}l9,7l-3,8l10,6" stroke="#0b0a0d" stroke-width="1.2" fill="none"/>`;
    if((role==="fort"||role==="barracks")&&rnd()<.5){const x=c%2?84:16;s+=`<circle cx="${x}" cy="45" r="9" fill="#2a292f" stroke="#000" stroke-width="1.2"/>`}
    if(rnd()<.18){const x=rr(10,90);s+=`<circle cx="${f1(x)}" cy="${edge==="top"?6:84}" r="14" fill="#ff9a3a" opacity=".12"/><circle cx="${f1(x)}" cy="${edge==="top"?6:84}" r="2.4" fill="#ffc06a"/>`}
  }else{ // open ground: frontlines, and the backlines of the river map
    if(T==="sahel"){tufts(5);for(let i=0;i<3;i++){const y=rr(10,80);s+=`<path d="M${f1(rr(0,40))},${f1(y)}q12,-3 24,0" stroke="#4a2c1a" stroke-width="1.2" fill="none"/>`}if(rnd()<.3)acacia(rr(18,82),rr(18,72),rr(9,13))}
    else if(T==="forest"){tufts(4);if(rnd()<.5)tree(c%2?rr(78,92):rr(8,22),rr(10,80),rr(8,13),"#173018");rocks(1)}
    else if(T==="river"){tufts(4);rocks(1);if(rnd()<.45)palm(rr(15,85),rr(15,75),rr(12,17));if(role!=="field"&&rnd()<.5)tree(rr(10,90),rr(10,80),rr(7,11),"#203a1c")}
    else{tufts(6);rocks(2);if(rnd()<.25)s+=`<path d="M0,${f1(rr(30,60))}q50,${f1(rr(-10,10))} 100,0" stroke="#2c2618" stroke-width="5" fill="none" opacity=".6"/>`}
  }
  if(turn)s=`<g transform="rotate(${turn} 50 45) scale(1.12) translate(-5.4,-4.8)">${s}</g>`;
  return `<svg class="tart" viewBox="0 0 100 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}<rect width="100" height="90" fill="#14204a" opacity=".12"/></svg>`;
}
function tileRole(r,c){
  if(G.map.theme==="river"&&r===2)return isVoid(r,c)?"water":"bridge";
  if(isVoid(r,c))return "void";
  const b=G.backz[r][c];
  if(b>=0){if(G.map.layout==="duel"||G.map.layout==="coop"||G.map.layout==="team-same")return seat(b).side==="bottom"?"fort":"barracks";return b%2?"barracks":"fort"}
  if(G.zone[r][c]>=0)return "field";
  if(G.map.layout==="duel")return G.rows===5&&r===2?"grave":"field";
  if(G.rows===G.map.cols&&G.rows>=7)return Math.max(Math.abs(r-(G.rows-1)/2),Math.abs(c-(COLS-1)/2))<=1?"grave":"field";
  return r>=2&&r<=G.rows-3?"grave":"field";
}
/* which side of a tile is the outer edge, as the viewer sees it */
function outerEdge(r,c,rot){
  const b=G.backz[r][c];if(b<0)return "bottom";
  const order=["bottom","left","top","right"],i=order.indexOf(seat(b).side);
  return order[(i-rot+4)%4];
}
