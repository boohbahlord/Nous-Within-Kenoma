/* ---------------- v57: King of the Hill ----------------
   A 25 by 25 night field. In the middle, a 5 by 5 Hill, white and glowing, never in the fog. Mountains (tiles that don't
   exist) wind around it in a ring two deep with 2-wide gaps, a looser ring further out, and a few scattered peaks; forests
   grow on the open ground. Spawns are 2 deep and 3 wide on the edges and corners, with potions along them.
   - Scoring: at the end of every round (after the attack phase) each side holding at least one Hill tile scores 1 (2 with
     Double points). Contest: when more than one side holds it, nobody scores. First to the target wins (30, 50, or a
     Marathon of 100). Tug of war (two teams): one shared bar from −25 to +25 that the holder pulls its way.
   - Team mode (default): Side A and Side B, not necessarily even. A Hill tile shows its side's color, outlined in the
     holder's own color.
   - Sight is a circle of 2 (Scouts: a circle of 4, and they move up to 3 in any direction); a meteor can fall on any turn
     (one in twenty). Other ways to win still count. */
let SEAT_KOTH_TEAM=true;
const KOTH_N=25,KOTH_C=12,HILL=[10,14],TEAM_COL=["#d7333b","#4c92e6"];
const kothOn=()=>!!(G&&G.opts&&G.opts.layout==="koth"&&G.opts.koth);
const isHill=(r,c)=>r>=HILL[0]&&r<=HILL[1]&&c>=HILL[0]&&c<=HILL[1];

/* ---------- the field ---------- */
const KOTH_SPOTS=[{side:"top",r:0,c:0},{side:"top",r:0,c:11},{side:"top",r:0,c:22},{side:"right",r:11,c:23},{side:"bottom",r:23,c:22},{side:"bottom",r:23,c:11},{side:"bottom",r:23,c:0},{side:"left",r:11,c:0}];   // clockwise from the top left
function kothSeat(sp){const back=[],zone=[];
  for(let a=0;a<3;a++)for(let d=0;d<2;d++){let r,c;
    if(sp.side==="top"){r=d;c=sp.c+a}else if(sp.side==="bottom"){r=KOTH_N-1-d;c=sp.c+a}else if(sp.side==="left"){r=sp.r+a;c=d}else{r=sp.r+a;c=KOTH_N-1-d}
    zone.push([r,c]);if(!d)back.push([r,c])}
  return {side:sp.side,rot:SIDES[sp.side].rot,fwd:SIDES[sp.side].fwd,back,zone}}
/* which spot each player takes: apart (far enough, not as far as can be), or next to enemies */
function kothSpots(o){const n=o.players.length,K=o.koth||{},team=K.team,start=5;
  if(!team){if(n===2)return K.near?[5,6]:[5,2];const step=K.near?1:8/n;return o.players.map((p,i)=>(start+Math.round(i*step))%8)}
  const A=o.players.map((p,i)=>i).filter(i=>!(o.players[i].team|0)),B=o.players.map((p,i)=>i).filter(i=>o.players[i].team|0),out=[];
  if(K.near){const ring=[5,6,7,0,1,2,3,4];let ia=0,ib=0;for(let k=0;k<n;k++){const useA=(k%2===0&&ia<A.length)||ib>=B.length;out[useA?A[ia++]:B[ib++]]=ring[k]}return out}
  const sideA=[5,6,4,7,3,0,2,1],sideB=[1,2,0,3,7,4,6,5],used=new Set();
  A.forEach((i,k)=>{const s=sideA.find(x=>!used.has(x));used.add(s);out[i]=s});B.forEach(i=>{const s=sideB.find(x=>!used.has(x));used.add(s);out[i]=s});return out}
function kothPlan(o){const N=KOTH_N,C=KOTH_C,spots=kothSpots(o),seats=spots.map(k=>kothSeat(KOTH_SPOTS[k]));
  const zone=new Set(seats.flatMap(S=>S.zone.map(t=>t.join()))),near=(r,c)=>[...zone].some(z=>{const [a,b]=z.split(",").map(Number);return Math.abs(a-r)<=2&&Math.abs(b-c)<=2});
  const cheb=(r,c)=>Math.max(Math.abs(r-C),Math.abs(c-C));
  let V=null;
  for(let tries=0;tries<30&&!V;tries++){const W=Array.from({length:N},()=>Array(N).fill(false));
    const ring=(d,thick,gaps)=>{for(let side=0;side<4;side++){const offs=[];for(let g=0;g<gaps;g++)offs.push(-(d-2)+Math.floor(Math.random()*(2*(d-2)-1)));
      for(let k=-d;k<=d;k++){if(offs.some(o=>k>=o&&k<=o+1))continue;for(let t=0;t<thick;t++){const dd=d+t;const kk=Math.max(-dd,Math.min(dd,k));
        const [r,c]=side===0?[C-dd,C+kk]:side===1?[C+kk,C+dd]:side===2?[C+dd,C-kk]:[C-kk,C-dd];if(r>=0&&c>=0&&r<N&&c<N)W[r][c]=true}}}};
    ring(4,2,1);ring(8,1,2);   // the ring two deep with 2 by 2 gaps, and a looser ring outside it
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!W[r][c]&&cheb(r,c)>6&&Math.random()<.05)W[r][c]=true;   // scattered peaks
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(cheb(r,c)<=3||near(r,c))W[r][c]=false;   // the Hill's ground and the spawns stay open
    // every spawn must reach the Hill
    const seen=Array.from({length:N},()=>Array(N).fill(false)),q=[[C,C]];seen[C][C]=true;
    while(q.length){const [r,c]=q.pop();for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=r+dr,b=c+dc;if(a<0||b<0||a>=N||b>=N||seen[a][b]||W[a][b])continue;seen[a][b]=true;q.push([a,b])}}
    if(seats.every(S=>S.zone.every(([r,c])=>seen[r][c])))V=W}
  if(!V)V=Array.from({length:N},()=>Array(N).fill(false));
  const teams=o.players.map((p,i)=>o.koth&&o.koth.team?(p.team|0):i);
  return {theme:"hill",cols:N,rows:N,mid:true,corners:false,bridge:"left",void:V,seed:(Math.random()*1e9)|0,layout:"koth",seats,teams,big:"koth",large:true}}

/* ---------- the Hill: who holds it, the points, the win ---------- */
const kothGroup=pl=>G.opts.koth.team?"t"+G.p[pl].team:"p"+pl;
const kothGroupName=g=>g[0]==="t"?(g==="t0"?"Side A":"Side B"):G.p[+g.slice(1)].name;
const kothGroupColor=g=>g[0]==="t"?TEAM_COL[+g.slice(1)]||"#ddd":G.p[+g.slice(1)].color;
function kothHolders(){const h=new Map();
  for(let r=HILL[0];r<=HILL[1];r++)for(let c=HILL[0];c<=HILL[1];c++){const st=G.board[r][c];if(!st||isNPC(st.owner)||isHorde(st.owner)||!G.p[st.owner]||G.p[st.owner].out)continue;const g=kothGroup(st.owner);h.set(g,(h.get(g)||0)+1)}
  return h}
function kothRound(){const K=G.opts.koth,S=G.koth||(G.koth={score:{},tug:0,last:null});if(G.moon.round<1)return;
  const h=[...kothHolders().keys()],pts=K.double?2:1;
  if(!h.length){S.last="Nobody holds the Hill.";return}
  if(K.tug){if(h.length>1){S.last="Both sides hold the Hill: the rope doesn't move.";log(S.last);return}
    S.tug=Math.max(-25,Math.min(25,S.tug+(h[0]==="t0"?-pts:pts)));S.last=`${kothGroupName(h[0])} pulls the rope (${S.tug>0?"+":""}${S.tug}).`;log(`<b>King of the Hill</b>: ${S.last}`,"event");
    if(Math.abs(S.tug)>=25)kothWin(S.tug<0?"t0":"t1","pulled the rope all the way");return}
  if(K.contest&&h.length>1){S.last="The Hill is contested: nobody scores.";log(`<b>King of the Hill</b>: ${S.last}`);return}
  for(const g of h)S.score[g]=(S.score[g]||0)+pts;
  S.last=h.map(g=>`${kothGroupName(g)} +${pts} (${S.score[g]})`).join(", ");log(`<b>King of the Hill</b>: ${S.last}.`,"event");
  const won=h.filter(g=>S.score[g]>=K.target).sort((a,b)=>S.score[b]-S.score[a])[0];if(won)kothWin(won,`held the Hill to ${S.score[won]} points`)}
function kothWin(g,why){if(G.over)return;const w=g[0]==="t"?alive().find(i=>!isNPC(i)&&G.p[i].team===+g.slice(1)):+g.slice(1);if(w==null)return;end(w,`${kothGroupName(g)} ${why}`)}
{const _nr=newRound;newRound=async function(){if(kothOn()&&!G.over)try{kothRound()}catch(e){console.error(e)}if(G.over)return;return _nr.apply(this,arguments)}}

/* ---------- the fog: the Hill is always seen; sight is a circle ---------- */
{const _ft=fogTile;fogTile=function(V,r,c){if(kothOn()&&isHill(r,c)&&!(V!=null&&totalBlind(V)))return false;return _ft.apply(this,arguments)}}
{const _st=seesTile;seesTile=function(V,r,c){if(kothOn()&&isHill(r,c)&&!(V!=null&&totalBlind(V)))return true;return _st.apply(this,arguments)}}
/* Scouts move up to 3 tiles in any direction */
{const _mt=moveTargets;moveTargets=function(){const out=_mt.apply(this,arguments);if(!kothOn())return out;const s=G.sel,st=s&&G.board[s.r][s.c],grp=moveGroup();
  if(!st||!grp.length||!grp.every(c=>c.unit==="scout")||st.moved||st.stun||st.pin)return out;const have=new Set(out.map(t=>t.join?t.join():t[0]+","+t[1]));
  for(let dr=-3;dr<=3;dr++)for(let dc=-3;dc<=3;dc++){const r=s.r+dr,c=s.c+dc;if((!dr&&!dc)||r<0||c<0||r>=G.rows||c>=COLS||isVoid(r,c)||G.board[r][c]||have.has(r+","+c))continue;out.push([r,c])}
  return out}}
/* a meteor can fall on any turn */
{const _sb=substanceTurn;substanceTurn=function(pl){_sb.apply(this,arguments);if(kothOn()&&!G.over&&Math.random()<.05)meteor()}}

/* ---------- on the screen: the Hill's tiles and the score ---------- */
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;let bar=$("#kothbar");
  if(!kothOn()){if(bar)bar.remove();return}
  const K=G.opts.koth,S=G.koth||(G.koth={score:{},tug:0,last:null}),hold=new Map();
  for(let r=HILL[0];r<=HILL[1];r++)for(let c=HILL[0];c<=HILL[1];c++){const t=document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`);if(!t)continue;t.classList.add("hilltile");
    const st=G.board[r][c];if(st&&!isNPC(st.owner)&&G.p[st.owner]){t.style.setProperty("--hc",kothGroupColor(kothGroup(st.owner)));t.style.setProperty("--ho",G.p[st.owner].color);t.classList.add("held")}}
  for(const [g] of kothHolders())hold.set(g,true);
  if(!bar){bar=document.createElement("div");bar.id="kothbar";const w=$(".camwrap")||$("#board");w.parentNode.insertBefore(bar,w)}
  const groups=K.team?["t0","t1"]:alive().filter(i=>!isNPC(i)&&!isHorde(i)).map(i=>"p"+i);
  bar.innerHTML=K.tug?`<b class="kt">Tug of war</b><span class="tugname" style="--tc:${TEAM_COL[0]}">Side A</span><span class="tug"><i style="left:${50+S.tug*2}%"></i><u></u></span><span class="tugname" style="--tc:${TEAM_COL[1]}">Side B</span><small>${S.tug>0?"+":""}${S.tug} of ±25</small>`
    :`<b class="kt">King of the Hill</b><small>first to ${K.target}${K.double?" · double points":""}${K.contest?" · contested scores nothing":""}</small>${groups.map(g=>`<span class="ks${hold.has(g)?" on":""}" style="--tc:${kothGroupColor(g)}" title="${hold.has(g)?"Holds the Hill":""}"><em>${esc(kothGroupName(g))}</em><i style="width:${Math.min(100,(S.score[g]||0)/K.target*100)}%"></i><b>${S.score[g]||0}</b></span>`).join("")}`}}

/* ---------- the setup: the Hill map shows only with King of the Hill ---------- */
function kothMapUp(L){const k=L==="koth";document.querySelectorAll('input[name=omap]').forEach(i=>{const off=k?i.value!=="hill":i.value==="hill";i.disabled=off;const o=i.closest(".opt");if(o)o.classList.toggle("off",off)});
  const h=document.querySelector('input[name=omap][value=hill]');if(h&&k)h.checked=true;else if(!k&&h&&h.checked){const n=document.querySelector('input[name=omap][value=none]');if(n)n.checked=true}
  const sz=$("#sizeset");if(sz)sz.classList.toggle("faded",k)}
{const _ss=showStart;showStart=function(){const out=_ss.apply(this,arguments);
  const box=document.querySelector('.ovbox.setup input[name=omap][value=none]');
  if(box&&!document.querySelector('input[name=omap][value=hill]')){box.closest(".opt").insertAdjacentHTML("afterend",`<span class="optgroup">Large maps</span><label class="opt off"><input type="radio" name="omap" value="hill" disabled><span>${MAPS.hill.name}<small>${MAPS.hill.sub}</small></span></label>`)}
  const t=$("#okteam");if(t)t.addEventListener("change",()=>{const p=$("#pcount");if(p)p.dispatchEvent(new Event("change"))});
  const p=$("#pcount");if(p)p.dispatchEvent(new Event("change"));
  return out}}

if(window.__EC)Object.assign(window.__EC,{kothPlan,kothRound,kothHolders,isHill,kothOn});

/* ---------- the Hill map in pixel art: mountains, forests, camps with potions, the pale Hill ---------- */
function pxMountain(P,rnd){const rr=(a,b)=>a+rnd()*(b-a);
  const peaks=[[rr(9,16),rr(5,10),rr(13,17)],[rr(23,31),rr(2,8),rr(14,19)]].sort((a,b)=>a[1]-b[1]).reverse();
  for(const [cx,top,hw] of peaks)for(let y=Math.floor(top);y<PXH;y++){const k=(y-top)/(PXH-top),half=Math.max(.5,k*hw+1);
    for(let x=Math.floor(cx-half);x<=cx+half;x++){const edge=x<=cx-half+1||x>=cx+half-1,left=x<cx;
      let col=left?[104,100,116]:[64,61,74];if(y<top+3.5+(pxHash(x,1,y)*2))col=left?[226,230,240]:[176,180,196];else if(pxHash(x,y,7)<.12)col=pxShade(col,.85);
      P.set(x,y,edge?[30,28,36]:col)}}}
function pxPotion(P,x,y,rnd){const L=[[200,40,52],[60,120,220],[80,190,110],[180,90,220]][Math.floor(rnd()*4)];
  P.rect(x+1,y,2,1,[120,84,50]);P.rect(x,y+1,4,4,[20,18,24]);P.rect(x+1,y+2,2,3,L);P.set(x+1,y+2,pxShade(L,1.5));P.set(x,y+5,[0,0,0],.4);P.set(x+3,y+5,[0,0,0],.4)}
{const _pt=pxTile;pxTile=function(r,c,role,edge){if(!G||!G.map||G.map.theme!=="hill")return _pt.apply(this,arguments);
  const C=PXPAL.hill,seed=(G.map.seed+r*131+c*17)|0,rnd=rng(seed),P=pxPainter(PXW,PXH),ri=(a,b)=>Math.floor(a+rnd()*(b-a+1));
  const inZone=G.zone[r][c]>=0,border=!inZone&&!isVoid(r,c)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dr,dc])=>G.zone[r+dr]&&G.zone[r+dr][c+dc]>=0);
  if(role==="void"){pxGround(P,C.ground.map(t=>pxShade(t,.6)),rnd,seed);pxMountain(P,rnd)}
  else if(isHill(r,c)){pxBricks(P,0,0,PXW,PXH,ri(9,11),ri(6,7),[[178,176,190],[192,190,202],[168,166,180],[200,198,210]],[120,118,132],seed)}
  else if(inZone){pxGround(P,[pxShade(C.dirt,.85),C.dirt,pxShade(C.dirt,1.12),pxMix(C.dirt,C.ground[2],.5)],rnd,seed,5);if(rnd()<.35)pxTent(P,ri(12,27),ri(12,24),6.5,C.tent,false);else pxCrate(P,ri(4,32),ri(24,31),C.wood)}
  else{pxGround(P,C.ground,rnd,seed);
    const forest=pxHash(Math.floor(r/4),Math.floor(c/4),G.map.seed)>.62;
    if(forest){for(let i=0;i<ri(2,4);i++)pxTree(P,ri(5,34),ri(5,30),4+rnd()*3,[22,46,24])}
    else{for(let i=0;i<5;i++)pxTuft(P,ri(2,37),ri(3,34),C.tuft);if(rnd()<.4)pxRock(P,ri(2,36),ri(3,33),C.stone2,rnd()<.4)}
    if(border&&rnd()<.6)pxPotion(P,ri(6,30),ri(6,26),rnd)}
  return P.done()}}
