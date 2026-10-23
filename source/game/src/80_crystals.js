/* ---------- v71n: Field Automation and the crystals ----------
   "Focus on crystals" (beside Target bases, Every option): at the end of your prep phase your field sends a stack to guard
   each crystal that no enemy holds, for your Miners, until it's dug out. Its options (a fold that shows once it's checked):
   - Depends on the stance: it guards only while the field defends or holds the center.
   - Depends on Lives: Preserve guards only where it's safe, Balanced unless badly outnumbered, Throw them in whatever comes.
     With neither of these two, guarding comes before everything else, whatever the ranking; with either, they come first
     and then its place in the ranking.
   - Only with a Miner: only while you have a Miner in your deck, your hand or on the field (not one in an Ace's slot).
   - Ask me first: a question before a stack sets out (yes, no, or no but these stacks can, up to five), at most once every
     five rounds, and only if you have a stack that can go. Ask how long (shown under it) adds the number of rounds.
   - Show the guard: a soft ring around the crystal and around its guard, joined by a dashed line, for you and your team;
     when the guard stands on the crystal the two rings lie one in the other.
   - Fight over crystals: enemy stacks on crystals are worth more to attack, and cards near them go for them.
   The guard is marked on its cards (c.faCrys={r,c,until,on}), so it goes wherever they go. Selecting a guard offers Stop
   guarding the crystal: every guard stands down for five rounds and Field Automation stays on. */
const crysCfg=pl=>{const s=faState(pl);return faEff(s&&s.cfg)};
const crysRest=pl=>{const P=G.p[pl];return !!(P&&P.crysOff!=null&&G.moon.round<P.crysOff)};
const crysMd=(a,b,c,d)=>Math.abs(a-c)+Math.abs(b-d);
/* the cards of a stack that would set out (not bases, locked cards, Miners, or what keeps an Ace) */
const crysGrp=st=>st.cards.filter(x=>!isBase(x)&&!x.faLock&&x.unit!=="miner"&&!(hasBase(st)&&x.unit&&(x.unit==="repair"||UNIT[x.unit].shooter)));
const crysFighter=x=>!(x.unit&&UNIT[x.unit]&&UNIT[x.unit].noDef);
/* the stacks that can go: a fighter among the cards that would set out, all of them under Field Automation, free to move */
function crysCands(pl,c){return stacksOf(pl).filter(({st})=>{if(st.stun||st.pin)return false;const g=crysGrp(st);return g.length>0&&g.some(crysFighter)&&g.every(x=>faControls(x,c))&&!g.some(x=>x.faCrys)})}
function crysGuards(pl){const out=[];for(const {st,r,c} of stacksOf(pl)){const cards=st.cards.filter(x=>x.faCrys);if(cards.length)out.push({st,r,c,g:cards[0].faCrys,cards})}return out}
const crysHasMiner=pl=>{const P=G.p[pl];return [...P.hand,...P.deck].some(x=>x.unit==="miner")||stacksOf(pl).some(({st})=>!hasBase(st)&&st.cards.some(x=>x.unit==="miner"))};
const crysFree=pl=>(G.crystals||[]).filter(x=>{const t=G.board[x.r][x.c];return !(t&&isEnemy(pl,t.owner))});
const crysKey=(r,c)=>r+"."+c;
/* a guard stands down when its crystal is gone, its rounds are up, or Focus on crystals is off or resting */
function crysTidy(pl,c){const off=!c.crys||crysRest(pl);
  for(const {st} of stacksOf(pl))for(const x of st.cards){const g=x.faCrys;if(!g)continue;
    if(off||isBase(x)||!crystalAt(g.r,g.c)||g.until!=null&&G.moon.round>g.until)delete x.faCrys}}
function crysSet(pl,list,x,len){const until=len?G.moon.round+len-1:null;
  for(const {st} of list)for(const y of crysGrp(st))y.faCrys={r:x.r,c:x.c,until,on:true}}
/* whether each guard guards this turn: the stance, Lives and the Miner, as checked */
function crysLive(pl,c,ctx){const k=ctx&&ctx.W&&ctx.W.k,stanceOk=!c.crysStance||k==="def"||k==="center",minerOk=!c.crysMiner||crysHasMiner(pl);
  for(const gd of crysGuards(pl)){let on=stanceOk&&minerOk;
    if(on&&c.crysLives&&c.lives!=="throw"){const mine=AI.value({cards:gd.cards,owner:pl}),foe=AI.enemyStacks(pl).filter(e=>crysMd(e.r,e.c,gd.g.r,gd.g.c)<=2).reduce((a,e)=>a+AI.value(e.st),0);
      on=foe<=mine*(c.lives==="preserve"?.8:1.5)}
    for(const x of gd.cards)x.faCrys.on=on}}
const crysNames=st=>{const n=st.cards.filter(x=>!isBase(x)).map(x=>nameOf(x));return n.length>3?n.slice(0,3).join(", ")+` and ${n.length-3} more`:n.join(", ")};
const crysShort=x=>x.puppet?"Puppet":x.unit?UNIT[x.unit].name:x.rank==="JK"?"Joker":x.rank+(SUITS[x.suit]||"");
const crysLabel=s=>{const n=s.st.cards.filter(x=>!isBase(x)).map(crysShort);return `${coord(s.r,s.c)} · ${n.length>4?n.slice(0,4).join(" ")+" +"+(n.length-4):n.join(" ")}${hasBase(s.st)?" (from the base)":""}`};
/* the end of the prep phase, before the field moves: tidy, find guards (or ask), then which of them guard this turn */
async function crysPrep(pl){const P=G.p[pl],c=crysCfg(pl);crysTidy(pl,c);if(!c.crys||crysRest(pl))return;
  if(!c.crysMiner||crysHasMiner(pl)){
    const taken=new Set(crysGuards(pl).map(gd=>crysKey(gd.g.r,gd.g.c))),free=crysFree(pl).filter(x=>!taken.has(crysKey(x.r,x.c)));
    let cands=crysCands(pl,c);
    if(free.length&&cands.length){
      if(c.crysAsk){if(P.crysAskAt==null||G.moon.round>=P.crysAskAt+5){   // at most once every five rounds
        const near=s=>Math.min(...free.map(x=>crysMd(s.r,s.c,x.r,x.c))),open=cands.filter(s=>!hasBase(s.st)),pool=open.length?open:cands;
        const prop=pool.reduce((a,s)=>near(s)<near(a)?s:a),x=free.reduce((a,y)=>crysMd(prop.r,prop.c,y.r,y.c)<crysMd(prop.r,prop.c,a.r,a.c)?y:a);
        P.crysAskAt=G.moon.round;
        const a=await ask(pl,{kind:"crysguard",id:"crysguard",title:`Guard the crystal on ${coord(x.r,x.c)}?`,at:[x.r,x.c],left:x.left,prop:[prop.r,prop.c],propName:crysNames(prop.st),
          stacks:cands.map(s=>({r:s.r,c:s.c,label:crysLabel(s)})),how:!!c.crysHow,max:5,ai:()=>({v:"yes",stacks:[[prop.r,prop.c]],len:0})});
        if(!G.over&&a&&(a.v==="yes"||a.v==="other")&&Array.isArray(a.stacks)){cands=crysCands(pl,c);const ok=new Map(cands.map(s=>[crysKey(s.r,s.c),s]));
          const keys=[...new Set(a.stacks.filter(v=>Array.isArray(v)&&v.length===2).map(([r,cc])=>crysKey(+r,+cc)))].filter(k=>ok.has(k)).slice(0,5);
          crysSet(pl,keys.map(k=>ok.get(k)),x,Math.max(0,Math.min(20,Math.round(+a.len||0))))}}}
      else{const fighting=stacksOf(pl).filter(({st})=>crysGrp(st).some(crysFighter)).length;let n=crysGuards(pl).length;const cap=Math.max(1,Math.floor(fighting/2));   // never more than half the field
        for(const x of free){if(n>=cap)break;const cs=crysCands(pl,c).filter(s=>!hasBase(s.st));if(!cs.length)break;
          crysSet(pl,[cs.reduce((a,s)=>crysMd(s.r,s.c,x.r,x.c)<crysMd(a.r,a.c,x.r,x.c)?s:a)],x,0);n++}}}}
  crysLive(pl,c,faCtx(pl))}
{const _fr=faRun;faRun=async function(pl,ph){
  if(ph==="prep"&&G&&!G.over&&faOn(pl)&&!blindPause(pl)){const was=G.busy;G.busy=true;try{await crysPrep(pl)}catch(e){console.error(e)}G.busy=was}
  return _fr.apply(this,arguments)}}
/* a card that comes back to the field comes back free */
{const _p=place;place=function(card){if(card&&card.faCrys)delete card.faCrys;return _p.apply(this,arguments)}}

/* ---------- the pull: a guard heads for its crystal and holds it; Fight over crystals ---------- */
const crysOn=E=>(G.crystals||[]).find(x=>G.board[x.r]&&G.board[x.r][x.c]===E)||null;
{const _fc=faCtx;faCtx=function(pl){const ctx=_fc.apply(this,arguments),c=crysCfg(pl);if(!c.crys||crysRest(pl))return ctx;
  const sc=faScales(c,pl),over=!c.crysStance&&!c.crysLives,w=over?8:2.2*sc.crystals,stay=over?2:1;   // with neither, it outweighs everything the ranking does, and once there it holds
  const foeCr=c.crysFight?(G.crystals||[]).filter(x=>{const t=G.board[x.r][x.c];return t&&isEnemy(pl,t.owner)}):[];
  const held=new Set(crysGuards(pl).map(gd=>crysKey(gd.g.r,gd.g.c)));
  ctx.crys=(S,r,cc,walk)=>{const g=S.cards.find(x=>x.faCrys&&x.faCrys.on);
    if(g){const d=walk(r,cc,g.faCrys.r,g.faCrys.c);return w*Math.min(d,30)-(d===0?stay:0)}
    if(foeCr.length){let d=99;for(const x of foeCr)d=Math.min(d,walk(r,cc,x.r,x.c));return .45*sc.crystals*Math.min(d,5)}   // the cards within a few steps: "some cards"
    return 0};
  ctx.first=st=>st.cards.some(x=>x.faCrys&&x.faCrys.on)?1:0;
  const gm=ctx.gainMul;ctx.gainMul=E=>{let m=gm(E);const at=crysOn(E);if(at){if(c.crysFight)m*=1+.8*sc.crystals;else if(held.has(crysKey(at.r,at.c)))m*=1.4}return m};
  return ctx}}

/* ---------- the question: yes, no, or no but these stacks can (up to five), and for how long ---------- */
const CRYS_LENS=[0,1,2,3,4,5,6,8,10];
{const _ah=askHuman;askHuman=function(pl,spec){if(!spec||spec.kind!=="crysguard")return _ah.apply(this,arguments);
  return new Promise(res=>{const all=spec.stacks||[],max=Math.max(1,Math.min(5,spec.max||5)),k=s=>s.r+"."+s.c,pk=spec.prop[0]+"."+spec.prop[1];
    let ans="yes",rows=[],len=0;
    const who=G.p.filter(P=>!P.cpu).length>1&&!G.opts.online?`<p class="dim">${esc(G.p[pl].name)} chooses.</p>`:"";
    const firstOther=()=>{const o=all.find(s=>k(s)!==pk)||all[0];return o?k(o):null};
    const chosen=()=>ans==="yes"?[pk,...rows]:rows;
    const sel=(i,v)=>{const me=ans==="yes"?i+1:i,used=new Set(chosen().filter((x,j)=>j!==me));   // a stack chosen in another row isn't offered again
      return `<select data-cs="${i}" aria-label="Which stack">${all.filter(s=>k(s)===v||!used.has(k(s))).map(s=>`<option value="${k(s)}" ${k(s)===v?"selected":""}>${esc(s.label)}</option>`).join("")}</select>`};
    const paint=()=>{const n=chosen().length,left=all.filter(s=>!chosen().includes(k(s))).length,more=ans!=="no"&&n<max&&left>0;
      ovShow(`<div class="ovbox crysbox" role="dialog" aria-labelledby="crysh"><button type="button" class="xclose" id="crysX" aria-label="Close: no">×</button>
<h2 id="crysh">${esc(spec.title)}</h2>${who}
<p>Your stack on ${coord(spec.prop[0],spec.prop[1])} (${esc(spec.propName)}) can guard the crystal on ${coord(spec.at[0],spec.at[1])} for a Miner until it's dug out${spec.left!=null?` (${spec.left} mana left in it)`:""}.</p>
<div class="opts crysans">${[["yes","Yes"],["no","No"],["other","No, but this stack can"]].map(([v,t])=>`<label class="opt"><input type="radio" name="crysans" value="${v}" ${ans===v?"checked":""}><span>${t}</span></label>`).join("")}</div>
${ans==="no"?"":`<div class="crysrows">${rows.map((v,i)=>`<p class="crysrow">${ans==="other"&&!i?"<span>Stack</span>":"<span>And this stack too</span>"}${sel(i,v)}${ans==="other"&&!i?"":`<button type="button" class="btn ghost sm crysdel" data-cdel="${i}" aria-label="Take this stack off">×</button>`}</p>`).join("")}
${more?`<p class="crysrow"><button type="button" class="btn ghost sm" id="crysPlus" title="Another stack guards it as well (up to ${max})">+ And this stack too</button></p>`:""}</div>`}
${spec.how&&ans!=="no"?`<label class="f crysrow"><span>For how long</span><select id="crysLen">${CRYS_LENS.map(v=>`<option value="${v}" ${len===v?"selected":""}>${v?`${v} round${v>1?"s":""}`:"Until it's dug out"}</option>`).join("")}</select></label>`:""}
<p class="acts"><button type="button" class="btn" id="crysOk">${ans==="no"?"No":"Guard it"}</button></p></div>`);
      document.querySelectorAll("input[name=crysans]").forEach(i=>i.onchange=()=>{ans=i.value;rows=ans==="other"?[firstOther()].filter(Boolean):[];paint()});
      document.querySelectorAll("[data-cs]").forEach(s=>s.onchange=()=>{rows[+s.dataset.cs]=s.value;paint()});
      document.querySelectorAll("[data-cdel]").forEach(b=>b.onclick=()=>{rows.splice(+b.dataset.cdel,1);paint()});
      const plus=$("#crysPlus");if(plus)plus.onclick=()=>{const o=all.find(s=>!chosen().includes(k(s)));if(o){rows.push(k(o));paint()}};
      const ls=$("#crysLen");if(ls)ls.onchange=()=>{len=+ls.value};
      $("#crysX").onclick=()=>{ovHide();res(null)};
      $("#crysOk").onclick=()=>{ovHide();if(ans==="no"||!chosen().length){res(null);return}res({v:ans,stacks:chosen().map(v=>v.split(".").map(Number)),len:spec.how?len:0})}};
    paint()})}}

/* ---------- Stop guarding the crystal (the Selected box): every guard stands down for five rounds ---------- */
function crysStop(pl){if(!G||!G.p[pl]||NET.ctx!=null&&NET.ctx!==pl)return false;
  for(const {st} of stacksOf(pl))for(const x of st.cards)delete x.faCrys;
  G.p[pl].crysOff=G.moon.round+5;render();return true}
for(const [name,get,set] of [["crysStop",()=>crysStop,f=>crysStop=f]])netAny(name,get,set);
{const _rs=renderSel;renderSel=function(live){_rs.apply(this,arguments);if(!G||!G.sel)return;const V=view(),st=selStack(),box=$("#selbox");
  if(!box||!st||st.owner!==V||!faOn(V)||!st.cards.some(x=>x.faCrys))return;
  let row=box.querySelector(".falockrow");if(!row){box.insertAdjacentHTML("beforeend",`<p class="falockrow"><span class="dim">Field Automation:</span></p>`);row=box.querySelector(".falockrow")}
  row.insertAdjacentHTML("beforeend",` <button type="button" class="btn sm ghost" id="crysStopB" title="All your stacks stop guarding crystals for five rounds. Field Automation stays on.">Stop guarding the crystal</button>`);
  $("#crysStopB").onclick=()=>{crysStop(V);flash("Your field stops guarding crystals for five rounds.")}}}

/* ---------- the rings and the dashed line (the guard's own player and their team) ----------
   Drawn in the board's own coordinates (the tiles' offsets), so the camera's zoom and pan carry them along. */
let crysSig="";
function guardSVG(){const B=$("#board");if(!B||!G)return;const V=view();let list=[];
  if(V!=null&&!G.over)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){const st=G.board[r]&&G.board[r][c];if(!st||st.owner==null||!G.p[st.owner]||isEnemy(st.owner,V)||isNPC(st.owner))continue;
    const own=st.owner,fa=G.p[own].fa;if(!fa||!fa.on||!faAllowed()||!fa.cfg||fa.cfg.crysShow===false||crysRest(own))continue;
    const seen=new Set();for(const x of st.cards){const g=x.faCrys;if(!g||!g.on||seen.has(crysKey(g.r,g.c))||!crystalAt(g.r,g.c)||g.until!=null&&G.moon.round>g.until)continue;seen.add(crysKey(g.r,g.c));list.push([r,c,g.r,g.c,own])}}
  const old=B.querySelector(":scope>svg.guards");
  if(!list.length){if(old)old.remove();crysSig="";return}
  const sig=JSON.stringify([list,B.offsetWidth,B.offsetHeight]);if(old&&sig===crysSig&&old===B.lastElementChild)return;crysSig=sig;
  const at=(r,c)=>{const t=B.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);if(!t)return null;let x=0,y=0,e=t;while(e&&e!==B){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent}   // up through the row to the board
    if(e!==B){const R=t.getBoundingClientRect(),Q=B.getBoundingClientRect();x=R.left-Q.left;y=R.top-Q.top}
    return {x:x+t.offsetWidth/2,y:y+t.offsetHeight/2,s:Math.min(t.offsetWidth,t.offsetHeight)}};
  const f=v=>v.toFixed(1);let rings="",lines="";const crys=new Map();
  for(const [r,c,gr,gc,own] of list){const a=at(r,c),b=at(gr,gc);if(!a||!b)continue;let col=G.p[own].color;if(darkCol(col))col="#a59d92";const pc=cbMap(col);
    const same=r===gr&&c===gc,R1=b.s*.47,R2=a.s*(same?.36:.4);
    if(!crys.has(crysKey(gr,gc)+own))crys.set(crysKey(gr,gc)+own,`<g style="--gc:${pc}"><circle class="gh" cx="${f(b.x)}" cy="${f(b.y)}" r="${f(R1+3)}"/><circle class="gc gcry" cx="${f(b.x)}" cy="${f(b.y)}" r="${f(R1)}"/></g>`);
    rings+=`<g style="--gc:${pc}"><circle class="gc" cx="${f(a.x)}" cy="${f(a.y)}" r="${f(R2)}"/></g>`;
    if(!same){const dx=a.x-b.x,dy=a.y-b.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;if(L>R1+R2+4)   // from ring to ring, never across them
      lines+=`<line class="gl" style="--gc:${pc}" x1="${f(b.x+ux*(R1+2))}" y1="${f(b.y+uy*(R1+2))}" x2="${f(a.x-ux*(R2+2))}" y2="${f(a.y-uy*(R2+2))}"/>`}}
  const svg=`<svg class="guards" aria-hidden="true" width="${B.scrollWidth}" height="${B.scrollHeight}">${lines}${[...crys.values()].join("")}${rings}</svg>`;
  if(old)old.remove();B.insertAdjacentHTML("beforeend",svg)}
{const _r=render;render=function(){rSafe(_r,this,arguments);try{guardSVG()}catch(e){console.error(e)}}}
if(typeof ResizeObserver==="function"){let q=0;const ro=new ResizeObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;crysSig="";if(G)guardSVG()})});
  const hook=()=>{const B=$("#board");if(B&&!B.dataset.crysRo){B.dataset.crysRo="1";ro.observe(B)}};
  {const _r=render;render=function(){rSafe(_r,this,arguments);hook()}}}

if(window.__EC)Object.assign(window.__EC,{crysPrep:(...a)=>crysPrep(...a),crysStop:(...a)=>crysStop(...a),crysGuards:pl=>crysGuards(pl),guardSVG:()=>guardSVG(),crysCands:(pl,c)=>crysCands(pl,c||crysCfg(pl)),faSaveW:c=>faSave(c),faMineW:()=>faMine(),faCleanW:c=>faClean(c)});
