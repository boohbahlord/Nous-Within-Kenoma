/* ---------------- Prompt 12, part 4a (v32): the look of the field, and the first animations ----------------
   Fog of war is a slow mist (one sheet across every fogged tile). The New Moon darkens the field and the mist; the Full Moon lets
   moonlight through it.
   Animations, in the schools' colors (Necromancy dark violet-blue, Enchantment gold, Curse crimson, Sorcery deep green, Illusion
   orange, Conjuring mana blue, Astrology teal), in three kinds:
     particular — on one thing: a card, a tile, the grave, the Ether, a player's bars, the sky;
     area — over many tiles at once (Peace, War, Bird's Eye, Quiet Eyes, the Firmament's fog, fire);
     special — both at once (a Heavenly Body changing the sky: the sky and the whole field).
   Moves slide, attacks strike, wounds flash, the dead go up in smoke, sacrifices raise the lead sign of Saturn (bigger for a
   Sacrificial Suicide) with a small "+N", and a shuffled deck flicks its cards. Nothing is animated that the fog or blindness
   hides from you, in fast games, or with reduced motion. */

const FX={
  on(){return !!G&&!G.opts.fast&&PREF.fx!==false&&(PREF.fxCards!==false||PREF.fxMagic!==false)&&!document.hidden&&!matchMedia("(prefers-reduced-motion: reduce)").matches},
  layer(){let l=document.getElementById("fx");if(!l){l=document.createElement("div");l.id="fx";l.setAttribute("aria-hidden","true");document.body.appendChild(l)}return l},
  tile(r,c){const t=document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`);return t?t.getBoundingClientRect():null},
  rectOf(el){return el?el.getBoundingClientRect():null},
  sees(r,c){const V=view();return !totalBlind(V)&&!fogTile(V,r,c)},
  seesStack(r,c){const V=view();return FX.sees(r,c)&&!(G.board[r]&&G.board[r][c]&&hiddenFrom(V,r,c))},
  make(cls,rect,o={}){if(!rect)return null;const e=document.createElement("div");e.className="fx "+cls;
    const w=o.w!=null?o.w:rect.width,h=o.h!=null?o.h:rect.height;
    Object.assign(e.style,{left:(rect.left+rect.width/2-w/2+(o.dx||0))+"px",top:(rect.top+rect.height/2-h/2+(o.dy||0))+"px",width:w+"px",height:h+"px"});
    if(o.col)e.style.setProperty("--fc",o.col);if(o.html)e.innerHTML=o.html;FX.layer().appendChild(e);return e},
  play(e,frames,dur,delay=0,ease="ease-out"){if(!e)return;const a=e.animate(frames,{duration:dur,delay,easing:ease,fill:"both"});a.onfinish=()=>e.remove();setTimeout(()=>e.remove(),dur+delay+400)},
  // particular: a ring that opens on one thing
  burst(rect,col,big){if(!rect)return;const s=Math.max(rect.width,rect.height)*(big?1.3:.9);
    FX.play(FX.make("ring",rect,{w:s,h:s,col}),[{transform:"scale(.25)",opacity:1},{transform:"scale(1.15)",opacity:0}],big?850:620);
    FX.play(FX.make("glow",rect,{w:s*.8,h:s*.8,col}),[{opacity:0,transform:"scale(.6)"},{opacity:.85,transform:"scale(1)",offset:.35},{opacity:0,transform:"scale(1.2)"}],big?900:650)},
  // area: a wash over many tiles, spreading from the middle
  area(tiles,col,strength=.5){const rs=tiles.map(([r,c])=>[r,c,FX.tile(r,c)]).filter(x=>x[2]);if(!rs.length)return;
    const mr=rs.reduce((a,x)=>a+x[0],0)/rs.length,mc=rs.reduce((a,x)=>a+x[1],0)/rs.length;
    for(const [r,c,rect] of rs){const d=Math.hypot(r-mr,c-mc);FX.play(FX.make("wash",rect,{col}),[{opacity:0},{opacity:strength,offset:.4},{opacity:0}],900,d*70)}},
  all(){const t=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!isVoid(r,c))t.push([r,c]);return t},
  strike(a,b,col){if(!a||!b)return;const x1=a.left+a.width/2,y1=a.top+a.height/2,x2=b.left+b.width/2,y2=b.top+b.height/2,len=Math.hypot(x2-x1,y2-y1),ang=Math.atan2(y2-y1,x2-x1)*180/Math.PI;
    const e=document.createElement("div");e.className="fx streak";e.style.setProperty("--fc",col);Object.assign(e.style,{left:x1+"px",top:(y1-2)+"px",width:len+"px",transform:`rotate(${ang}deg)`});FX.layer().appendChild(e);
    FX.play(e,[{clipPath:"inset(0 100% 0 0)",opacity:1},{clipPath:"inset(0 0 0 0)",opacity:1,offset:.55},{clipPath:"inset(0 0 0 100%)",opacity:.2}],320,0,"ease-in")},
  hit(rect,col="#fff"){FX.play(FX.make("flash",rect,{col}),[{opacity:.75},{opacity:0}],260,120)},
  slide(a,b,col){if(!a||!b)return;const e=FX.make("ghost",a,{col,w:a.width*.82,h:a.height*.82});if(!e)return;
    FX.play(e,[{transform:"translate(0,0)",opacity:.9},{transform:`translate(${b.left-a.left}px,${b.top-a.top}px)`,opacity:.15}],300,0,"cubic-bezier(.3,.7,.4,1)")},
  smoke(rect){if(!rect)return;for(let i=0;i<5;i++){const s=rect.width*(.25+Math.random()*.2),dx=(Math.random()-.5)*rect.width*.5;
    FX.play(FX.make("puff",rect,{w:s,h:s,dx,dy:rect.height*.15}),[{transform:"translateY(0) scale(.5)",opacity:.7},{transform:`translateY(${-rect.height*(.45+Math.random()*.3)}px) scale(1.4)`,opacity:0}],750+i*80,i*40)}},
  sigil(rect,big){if(!rect)return;const s=big?Math.max(56,rect.height*1.1):Math.max(28,rect.height*.6);
    FX.play(FX.make("sigil"+(big?" big":""),rect,{w:s,h:s,html:"♄",col:SCHOOL_COL.Necromancy}),[{transform:"translateY(6px) scale(.6)",opacity:0},{transform:"translateY(-4px) scale(1)",opacity:1,offset:.3},{transform:`translateY(${big?-34:-18}px) scale(${big?1.35:1.1})`,opacity:0}],big?1300:900);
    if(big)FX.burst(rect,SCHOOL_COL.Necromancy,true)},
  pop(rect,text,col){if(!rect)return;FX.play(FX.make("popn",rect,{w:60,h:22,html:esc(text),col,dx:rect.width*.35}),[{transform:"translateY(4px)",opacity:0},{transform:"translateY(-6px)",opacity:1,offset:.25},{transform:"translateY(-26px)",opacity:0}],1000)},
  shuffle(rect){if(!rect)return;const k=Date.now();if(FX._sh&&k-FX._sh<350)return;FX._sh=k;
    for(let i=0;i<3;i++){const e=FX.make("minicard",rect,{w:10,h:14,dx:-rect.width/2+18+i*4,dy:-rect.height/2-6});
      FX.play(e,[{transform:"translate(0,0) rotate(0)"},{transform:`translate(${(i-1)*10}px,-6px) rotate(${(i-1)*14}deg)`,offset:.35},{transform:`translate(${(1-i)*8}px,-3px) rotate(${(1-i)*10}deg)`,offset:.7},{transform:"translate(0,0) rotate(0)",opacity:.0}],650,i*40,"ease-in-out")}}
};
/* where a player's bars are on screen */
function pboxEl(pl){const V=view();if(pl===V)return $("#me");const others=G.p.map(P=>P.i).filter(i=>i!==V&&!isNPC(i));
  if(others.length===1)return others[0]===pl?$("#foe"):null;const i=others.indexOf(pl);return i>=0?document.querySelectorAll("#foe .pbox.sub")[i]:null}
const barOf=(pl,cls)=>{const b=pboxEl(pl);return b&&b.querySelector(cls)};
const later=f=>setTimeout(()=>{try{if(FX.on())f()}catch(e){console.error(e)}},0);

/* ---------- the field's look: mist, New Moon, Full Moon ---------- */
{const _rd=render;render=function(){_rd.apply(this,arguments);if(!G)return;const B=$("#board");if(!B)return;const m=G.moon;
  B.classList.toggle("newmoon",!m.gone&&m.i===0&&!m.blood);B.classList.toggle("fullmoon",!m.gone&&m.i===4&&!m.blood);B.classList.toggle("bloodfield",!!m.blood)}}

/* ---------- moves, placing, attacks, wounds, deaths ---------- */
{const _dm=doMove;doMove=function(r,c){const s=G.sel,own=s&&G.board[s.r][s.c]?G.board[s.r][s.c].owner:null;
  const show=FX.on()&&s&&(own===view()||!isEnemy(own,view())||FX.seesStack(s.r,s.c)&&FX.sees(r,c));
  const a=show?FX.tile(s.r,s.c):null,b=show?FX.tile(r,c):null,col=own!=null&&G.p[own]?G.p[own].color:"#ccc";
  const out=_dm.apply(this,arguments);if(show)later(()=>FX.slide(a,b,col));return out}}
{const _pl=place;place=function(card,r,c){const out=_pl.apply(this,arguments);const pl=card&&card.owner;
  later(()=>{if(pl===view()||!isEnemy(pl,view())||FX.seesStack(r,c))FX.burst(FX.tile(r,c),G.p[pl]?G.p[pl].color:"#ccc")});return out}}
{const _at=attack;attack=function(r1,c1,r2,c2,mode){const A=G.board[r1]&&G.board[r1][c1];
  const show=FX.on()&&A&&(A.owner===view()||FX.seesStack(r1,c1)||FX.sees(r2,c2));
  const a=show&&FX.seesStack(r1,c1)||show&&A.owner===view()?FX.tile(r1,c1):null,b=show?FX.tile(r2,c2):null;
  if(show&&a&&b)FX.strike(a,b,G.p[A.owner].color);
  return _at.apply(this,arguments)}}
{const _dg=damage;damage=function(r,c,n,defending){const vis=FX.on()&&n>0&&FX.sees(r,c),rect=vis?FX.tile(r,c):null;
  const out=_dg.apply(this,arguments);if(rect&&out!==0)later(()=>FX.hit(rect,"#ff5a4a"));return out}}
{const _bu=bury;bury=function(card,r,c,st){const rect=FX.on()&&FX.sees(r,c)?FX.tile(r,c):null;const out=_bu.apply(this,arguments);if(rect)later(()=>{FX.smoke(rect);FX.skull(rect)});return out}}

/* ---------- sacrifices ---------- */
{const _sac=sacrifice;sacrifice=function(card,from){const pl=G.active,V=view(),P=G.p[pl];let rect=null,btn=null,m0=effMana(pl);
  if(FX.on()){if(from==="hand"){const i=P.hand.indexOf(card);if(pl===V){rect=FX.rectOf(document.querySelectorAll("#hand .hc")[i]);btn=FX.rectOf(document.querySelector(`#hand [data-sh="${i}"]`))}else rect=FX.rectOf(barOf(pl,".manabar"))}
    else if(from&&from.r!=null&&(pl===V||FX.sees(from.r,from.c)))rect=FX.tile(from.r,from.c)}
  const ok=_sac.apply(this,arguments);
  if(ok&&rect){const got=effMana(pl)-m0;later(()=>{FX.sigil(rect,false);FX.pop(btn||rect,`+${Math.max(0,got)}`,"#8f80ee")})}
  return ok}}
{const _js=jokerSuicide;jokerSuicide=async function(r,c,st,pl){const rect=FX.on()&&(pl===view()||FX.sees(r,c))?FX.tile(r,c):null;
  if(rect)FX.sigil(rect,true);return _js.apply(this,arguments)}}

/* ---------- shuffling: a deck or the grave ---------- */
{const _sh=shuffle;shuffle=function(a){const out=_sh(a);if(G&&FX.on()){
  if(a===G.grave)later(()=>FX.shuffle(FX.rectOf($("#seegrave"))));
  else{const P=G.p.find(Q=>Q.deck===a);if(P&&!isHorde(P.i))later(()=>FX.shuffle(FX.rectOf(barOf(P.i,".deckbar"))))}}
  return out}}

/* ---------- spells: where they land ---------- */
const FX_SKY=new Set(["mars","sun","venus","jupiter","mercury","saturn","judge","sunfall","cry","bloodcall","lev"]);
const FX_AREA=new Set(["peace","war","buypeace","warnow","bird","quiet","ffog","rain","betray"]);
const FX_OATH=id=>id.startsWith("oath_");
{const _c=cast;cast=async function(sp){
  if(!sp||!FX.on()&&!(typeof NET!=="undefined"&&NET.role==="host"))return _c.apply(this,arguments);
  const pl=G.active,sel=G.sel?{r:G.sel.r,c:G.sel.c}:null,fires0=new Set((G.fires||[]).map(f=>f.r+","+f.c));
  const L0=G.log[0];await _c.apply(this,arguments);
  const L1=G.log.find(l=>/ casts <b>/.test(l.html));if(!L1||L1===L0||G.log.indexOf(L1)>=G.log.indexOf(L0)&&L0)return;   // it didn't go through
  const fires=(G.fires||[]).filter(f=>!fires0.has(f.r+","+f.c)).map(f=>[f.r,f.c]);
  if(typeof netFX==="function")netFX({k:"cast",id:sp.id,pl,sel,fires});   // v37: the same picture on every screen
  if(FX.on())later(()=>castFX(sp,pl,sel,fires))}}
/* where a spell lands, drawn on this screen */
function castFX(sp,pl,sel,fires){
  const col=SCHOOL_COL[sp.school]||"#ccc",tileSpell=/\bSelect\b|\bselected\b/.test(sp.text||"");
  const fresh=(fires||[]).filter(([r,c])=>FX.sees(r,c));
  if(fresh.length){FX.area(fresh,"#ff7a2a",.6);if(FX.flames)fresh.forEach(([r,c],i)=>FX.flames(FX.tile(r,c),i*40))}
  const land=(rect,big)=>{if(!rect)return;FX.burst(rect,col,big);if(FX.symbol)FX.symbol(rect,sp.school,big)};   // v33: the school's sign rises where it lands
  if(FX.spell&&FX.spell(sp,sel,pl))return;   // v33: spells with their own effect (lightning, rain, wind, fog...)
  if(sp.shop||FX_SKY.has(sp.id)){land(FX.rectOf($("#moon svg.moon")||$("#moon")),true);FX.area(FX.all().filter(([r,c])=>FX.sees(r,c)),col,.18);return}
  if(FX_OATH(sp.id)){land(FX.rectOf($("#moon svg.moon")||$("#moon")),false);FX.burst(FX.rectOf(barOf(pl,".manabar")),col);return}
  if(FX_AREA.has(sp.id)){FX.area(FX.all().filter(([r,c])=>FX.sees(r,c)),col,.38);land(FX.rectOf($("#board")),true);return}
  if(tileSpell&&sel&&(pl===view()||FX.sees(sel.r,sel.c))){land(FX.tile(sel.r,sel.c));return}
  if(sp.school==="Conjuring"){land(FX.rectOf($("#seeether")));FX.burst(FX.rectOf(barOf(pl,".deckbar")),col);return}
  if(sp.school==="Necromancy"){land(FX.rectOf($("#seegrave")));return}
  if(sp.id==="robbank"){FX.burst(FX.rectOf($("#bankslot")),SCHOOL_COL.Bank);if(FX.dollar)FX.dollar(FX.rectOf($("#bankslot")));return}
  if(!fresh.length)land(FX.rectOf(barOf(pl,".manabar")))}

if(window.__EC)Object.assign(window.__EC,{FX,cast:sp=>cast(sp),sacrifice:(...a)=>sacrifice(...a),doMove:(r,c)=>doMove(r,c),attack:(...a)=>attack(...a),damage:(...a)=>damage(...a)});
