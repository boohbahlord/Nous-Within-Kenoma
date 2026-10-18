/* ---------------- Prompt 6: the Goatbull's stomp, Joyful Theft, Teleport's return, prices; card info, comparisons, status, menus ---------------- */

function priceLabel(s,round){
  const P=round?G.roundPrices||{}:G.prices||{};
  if(s.id==="deconj")return `2 / ${P.deconj??"2+1d2"} mana`;
  if(s.id==="joy")return `${P.joyA??"1+1d2"} / ${P.joyB??"1d3−1"} mana`;
  if(round)return P[s.id]!=null?P[s.id]:s.dice;
  const c=spellCost(s);return c?c+" mana":"free";
}

/* ---------- the Goatbull's Stomp: the stack is Behooved (pinned) ---------- */
function abilityRolls(goat,target){
  const gd=goat.lostAdv?rollN(1,20):rollN(2,20),sam=hasK(target,"samson"),vd=sam?rollN(1,20):rollN(2,20);
  const gv=Math.max(...gd.map(d=>d.v)),vv=sam?vd[0].v:Math.min(...vd.map(d=>d.v));
  if(gd.length>1){const k=gd.findIndex(d=>d.v===gv);gd.forEach((d,i)=>{if(i!==k)d.x=true})}
  if(vd.length>1){const k=vd.findIndex(d=>d.v===vv);vd.forEach((d,i)=>{if(i!==k)d.x=true})}
  return{gd,vd,gv,vv};
}
function stomp(r1,c1,r2,c2){
  const A=G.board[r1][c1],D=G.board[r2][c2],g=A.cards[0];
  A.attacked=true;G.lastAttack=G.turnNo;
  const {gd,vd,gv,vv}=abilityRolls(g,D);
  tray(A.owner,"Stomp",gd,`${gv} vs ${vv}`);tray(D.owner,"Ability check",vd,`${vv} vs ${gv}`,true);
  let turns=0;if(gv>vv)turns=sum(rollN(2,2));else if(gv===vv)turns=R(2);
  log(`<b>${plName(A.owner)}</b>'s Goatbull stomps from ${coord(r1,c1)} on ${coord(r2,c2)}: ability check ${gv}${g.lostAdv?"":" (advantage)"} against ${vv}${hasK(D,"samson")?"":" (disadvantage)"}.${turns?` The stack is <b>Behooved</b> for ${turns} of its turns.`:" The stack shakes it off."}`,"combat");
  if(turns){D.pin={turns,by:g.id,k:1};notify(A.owner,`The Goatbull pins ${esc(G.p[D.owner].name)}'s stack on ${coord(r2,c2)}: Behooved for ${turns} turns.`)}
  if(turns&&gv>=16&&vv<gv){G.fight={A,D,atkPl:A.owner,defPl:D.owner};log("The hooves land: 1 damage.");damage(r2,c2,1,true);G.fight=null}
  render();return{win:!!turns,line:`${gv} vs ${vv}`};
}
function findCard(id){for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){const s=G.board[r][c];if(s&&s.cards.some(x=>x.id===id))return{st:s,r,c}}return null}
/* the start of a player's own turn: pinned stacks, teleported cards */
function turn3(pl){
  const P=G.p[pl];
  if(P.returning&&P.returning.length){for(const c of P.returning.splice(0)){if(P.hand.length<handCap(pl))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}}log(`${plName(pl)}'s teleported card${P.hand.length?"":"s"} come back.`)}
  for(const {st,r,c} of stacksOf(pl)){
    if(!st.pin)continue;const g=findCard(st.pin.by);
    if(!g){st.pin=null;log(`${plName(pl)}'s stack on ${coord(r,c)} is free: the Goatbull is gone.`);continue}
    st.pin.k++;const need=16-5*(st.pin.k-1),{gd,vd,gv,vv}=abilityRolls(g.st.cards[0],st);
    tray(g.st.owner,"Behooved check",gd,`${gv} vs ${vv}`,true);
    if(gv>=need&&vv<gv){log(`Behooved: the Goatbull rolls ${gv} (needs ${need}) against ${vv}; ${plName(pl)}'s stack on ${coord(r,c)} takes 1 damage.`);G.fight={A:g.st,D:st,atkPl:g.st.owner,defPl:pl};damage(r,c,1,true);G.fight=null}
    else log(`Behooved: the Goatbull rolls ${gv} (needs ${need}) against ${vv}; no damage.`);
  }
}
function end3(pl){for(const {st,r,c} of stacksOf(pl))if(st.pin){st.pin.turns--;if(st.pin.turns<=0){st.pin=null;log(`${plName(pl)}'s stack on ${coord(r,c)} is no longer Behooved.`)}}}
/* Joyful Theft: each damage to the caster's units takes 1 mana from whoever dealt it */
function stealOnDamage(st){
  const P=G.p[st.owner],F=G.fight;if(!P||!P.theft||!F)return;
  const dealer=st===F.D?F.atkPl:st===F.A?F.defPl:null;if(dealer==null||dealer===st.owner||!G.p[dealer])return;
  const Q=G.p[dealer];if(!Q.souls.length)return;
  Q.souls.sort((a,b)=>soulOf(a)-soulOf(b));const c=Q.souls.shift();if(!addSoul(st.owner,c))toGrave(c,"spent");
  log(`Joyful Theft: ${plName(st.owner)} takes ${soulOf(c)} mana from ${plName(dealer)}.`);
}

/* ---------- what a card or stack can do: the numbers behind the corner info ---------- */
const UNIT_KIND={samson:"Wildcard",antony:"Wildcard",satan:"Wildcard",leviathan:"Wildcard",bullgoat:"Wildcard",goatbull:"Wildcard",debt:"Wildcard",slavemaster:"Wildcard",slave:"Wildcard",trafficker:"Wildcard",tree:"Base"};
function cardClass(c){if(c.barb)return "Barbarian";if(isBase(c))return "Base";if(c.unit)return UNIT_KIND[c.unit]||UNIT[c.unit].kind||"Wildcard";if(isSpecial(c))return "Special";return "Standard"}
function rangeOf(st,mode){   // [min,max] of a stack's score
  const solo=st.cards.length===1&&st.cards[0].unit?st.cards[0]:null;
  if(solo&&UNIT[solo.unit].weapons){const U=UNIT[solo.unit];
    if(U.copy)return null;
    if(mode==="atk"){let lo=0,hi=0;for(const w of U.weapons){if(w.special)continue;const d=w.roll();const a=w.fixed+d.length,b=w.fixed+d.reduce((x,y)=>x+y.s,0);lo=Math.max(lo,a);hi=Math.max(hi,b)}return[lo,hi]}
    if(U.defRoll){const d=U.defRoll();return[(U.defFixed||0)+d.length,(U.defFixed||0)+d.reduce((x,y)=>x+y.s,0)]}
    return U.noDef?[0,0]:[U.nat,U.nat];
  }
  if(mode==="def"&&hasK(st,"tree"))return[0,0];
  if(st.cards.length===1&&kind(st.cards[0])==="joker")return null;
  const queen=hasK(st,"queen"),ace=hasK(st,"ace");let lo=0,hi=0;
  for(const c of st.cards){const k=kind(c);if(k==="queen"||k==="joker")continue;if(mode==="def"&&(k==="jack"||k==="slave"))continue;
    const use=mode==="atk"?k!=="ace":ace?k==="ace":queen,d=use?die(c)||0:0;lo=Math.max(lo,nat(c)+(d?1:0));hi=Math.max(hi,nat(c)+d)}
  const jb=mode==="atk"&&hasK(st,"joker")&&st.owner!=null&&G.p[st.owner]?JOKER_BONUS[G.p[st.owner].tribe]||0:0;
  return[lo+jb,hi+jb];
}
function statsOf(st){
  const n=200;let a=0,d=0;const foe={cards:[mk("8","S")],owner:null};
  for(let i=0;i<n;i++){a+=rollStack(st,"atk",foe).total;d+=rollStack(st,"def",foe).total}
  const hearts=st.cards.filter(c=>c.maxHp).map(c=>`${short(c)} ${c.hp}/${c.maxHp}`);
  const fx=[];
  if(st.odds)fx.push(st.odds==="adv"?"Divine Odds: advantage on its next fight":"Hexed Odds: disadvantage on its next fight");
  if(hated(st))fx.push("Hate: disadvantage, and its attackers have advantage");
  if(st.hypo)fx.push(`Hypostasis: untouchable, ${st.hypo} more turn${st.hypo>1?"s":""}`);
  if(st.stun)fx.push(`Lightning: immobilized, ${st.stun} more turn${st.stun>1?"s":""}`);
  if(st.pin)fx.push(`Behooved: pinned by the Goatbull, ${st.pin.turns} more turn${st.pin.turns>1?"s":""}`);
  if(st.owner!=null&&G.p[st.owner]){const P=G.p[st.owner];if(P.shield)fx.push("Please Don't Hurt Me: can't be attacked");if(P.joy)fx.push("Pleasure and Joy: its dead go back to the deck");if(P.theft)fx.push("Joyful Theft: damage to it costs the attacker mana");if(deluded(st.owner))fx.push("its player is under a Delusion")}
  if(st.moved)fx.push("has moved this turn");if(st.attacked)fx.push("has attacked this turn");
  const cap=[],pri=[];for(const c of st.cards){for(const s of c.captured||[])cap.push(s);for(const s of c.prisoners||[])pri.push(s)}
  const lead=st.cards.find(isBase)||st.cards[0];
  return{atk:{avg:a/n,r:rangeOf(st,"atk")},def:{avg:d/n,r:rangeOf(st,"def")},hearts,fx,soul:st.cards.reduce((x,c)=>x+soulOf(c),0),
    type:[...new Set(st.cards.map(cardClass))].join(" + "),cards:st.cards,cap,pri,lead,canAtk:st.cards.some(isShooter)||canAttackFrom({cards:st.cards,attacked:false})};
}
const rngTxt=r=>r?`${r[0]}–${r[1]}`:"copies its foe";
function infoHTML1(st,title){
  const S=statsOf(st),P=st.owner!=null&&G.p[st.owner]?G.p[st.owner]:null;
  return `<div class="cin" style="--pc:${P?P.color:"#bbb"}"><div class="cih"><b>${esc(title||((st.cards.length>1?`Stack of ${st.cards.length}`:nameOf(S.lead))))}</b>${P?` <span class="dim">· ${esc(P.name)}</span>`:""}</div>
<dl><dt class="k-type">Type</dt><dd>${esc(S.type)}</dd>
<dt class="k-atk">Attack</dt><dd>${S.canAtk?`avg ${S.atk.avg.toFixed(1)} · min–max ${rngTxt(S.atk.r)}`:"cannot attack"}</dd>
<dt class="k-def">Defense</dt><dd>avg ${S.def.avg.toFixed(1)} · min–max ${rngTxt(S.def.r)}</dd>
${S.hearts.length?`<dt class="k-hp">Hearts</dt><dd>${S.hearts.map(esc).join(", ")}</dd>`:""}
<dt class="k-soul">Soul worth</dt><dd>${S.soul} mana</dd>
${S.fx.length?`<dt class="k-fx">Effects</dt><dd>${S.fx.map(esc).join("<br>")}</dd>`:""}
<dt class="k-cards">Cards</dt><dd>${S.cards.map(c=>esc(nameOf(c))).join(", ")}</dd>
${S.cap.length?`<dt class="k-fx">Souls captured</dt><dd>${S.cap.map(c=>esc(nameOf(c))).join(", ")}</dd>`:""}
${S.pri.length?`<dt class="k-fx">Imprisoned</dt><dd>${S.pri.map(c=>esc(nameOf(c))).join(", ")}</dd>`:""}</dl></div>`;
}
function compareHTML(a,b,ta,tb){
  const A=statsOf(a),B=statsOf(b);
  const row=(label,x,y,fmt)=>{const cx=x>y?"gt":x<y?"lt":"eq",cy=y>x?"gt":y<x?"lt":"eq";return `<tr><th>${label}</th><td class="${cx}">${fmt?fmt(x):x}</td><td class="${cy}">${fmt?fmt(y):y}</td></tr>`};
  const hp=s=>s.cards.reduce((t,c)=>t+(c.hp||0),0);
  return `<table class="cmp"><tr><th></th><th>${esc(ta)}</th><th>${esc(tb)}</th></tr>
${row("Attack avg",A.canAtk?A.atk.avg:0,B.canAtk?B.atk.avg:0,v=>v.toFixed(1))}
${row("Attack max",A.canAtk&&A.atk.r?A.atk.r[1]:0,B.canAtk&&B.atk.r?B.atk.r[1]:0)}
${row("Attack min",A.canAtk&&A.atk.r?A.atk.r[0]:0,B.canAtk&&B.atk.r?B.atk.r[0]:0)}
${row("Defense avg",A.def.avg,B.def.avg,v=>v.toFixed(1))}
${row("Defense max",A.def.r?A.def.r[1]:0,B.def.r?B.def.r[1]:0)}
${row("Defense min",A.def.r?A.def.r[0]:0,B.def.r?B.def.r[0]:0)}
${row("Hearts",hp(a),hp(b))}${row("Cards",a.cards.length,b.cards.length)}${row("Soul worth",A.soul,B.soul)}</table>`;
}
/* one small floating box for card info, comparisons, the moon and player status */
function pop(html,x,y,cls){
  let el=$("#cinfo");if(!el){el=document.createElement("div");el.id="cinfo";document.body.appendChild(el);
    el.addEventListener("click",e=>e.stopPropagation());
    document.addEventListener("click",()=>{if(!el.hidden&&!el.dataset.hover&&Date.now()-(el._t||0)>350)el.hidden=true});
    document.addEventListener("keydown",e=>{if(e.key==="Escape")el.hidden=true})}
  el.className=cls||"";el.innerHTML=`<button type="button" class="xclose" aria-label="Close">×</button>`+html;el.hidden=false;delete el.dataset.hover;el._t=Date.now();
  el.querySelector(".xclose").onclick=()=>{el.hidden=true};
  const w=Math.min(380,innerWidth-20);el.style.width=w+"px";
  el.style.left=Math.max(10,Math.min(x,innerWidth-w-10))+scrollX+"px";el.style.top=y+scrollY+8+"px";
  return el;
}
const popHide=()=>{const el=$("#cinfo");if(el)el.hidden=true};
const stackAtTile=t=>{if(!t)return null;const r=+t.dataset.r,c=+t.dataset.c;if(isNaN(r)||hiddenFrom(view(),r,c)||showsBack(view(),r,c))return null;const st=G.board[r][c];return st?{st,r,c}:null};
const stackTitle=(s,r,c)=>`${s.cards.length>1?`Stack of ${s.cards.length}`:nameOf(s.cards[0])} on ${coord(r,c)}`;
/* the corner tab on every stack: click for info, drag onto another stack to compare */
function wireCorners(){
  document.querySelectorAll("#board .ci").forEach(t=>{
    t.onclick=e=>{e.stopPropagation();e.preventDefault()};
    t.onpointerdown=e=>{
      e.stopPropagation();e.preventDefault();const src=stackAtTile(t.closest(".tile"));if(!src)return;
      const ghost=document.createElement("div");ghost.className="ciline";document.body.appendChild(ghost);
      const x0=e.clientX,y0=e.clientY;let moved=false;
      const mv=ev=>{const dx=ev.clientX-x0,dy=ev.clientY-y0;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;
        ghost.style.cssText=`left:${x0+scrollX}px;top:${y0+scrollY}px;width:${Math.hypot(dx,dy)}px;transform:rotate(${Math.atan2(dy,dx)}rad)`};
      const up=ev=>{document.removeEventListener("pointermove",mv);document.removeEventListener("pointerup",up);ghost.remove();
        if(!moved){pop(infoHTML1(src.st,stackTitle(src.st,src.r,src.c)),e.clientX,e.clientY,"info");return}
        const el=document.elementFromPoint(ev.clientX,ev.clientY),dst=stackAtTile(el&&el.closest(".tile"));
        if(dst&&dst.st!==src.st)pop(`<div class="cih"><b>Compare</b></div>`+compareHTML(src.st,dst.st,stackTitle(src.st,src.r,src.c),stackTitle(dst.st,dst.r,dst.c)),ev.clientX,ev.clientY,"info wide");
        else flash("Drop the corner onto another stack on the field to compare.");
      };
      document.addEventListener("pointermove",mv);document.addEventListener("pointerup",up);
    };
  });
  document.querySelectorAll(".cf .ci").forEach(t=>{t.onclick=e=>{e.stopPropagation();e.preventDefault();const c=cardById(+t.dataset.cid);if(!c)return;
    pop(infoHTML1({cards:[c],owner:c.owner},nameOf(c)),e.clientX,e.clientY,"info")}});
}
function cardById(id){
  for(const P of G.p)for(const L of [P.hand,P.deck,P.souls,P.thralls||[],P.returning||[]])for(const c of L)if(c.id===id)return c;
  for(const L of [G.grave,G.dark,G.ether,G.limbo,G.unknown])for(const c of L)if(c.id===id)return c;
  const f=findCard(id);if(f)return f.st.cards.find(c=>c.id===id);
  for(const it of G.auction||[])if(it.card.id===id)return it.card;
  return G.browse&&G.browse.id===id?G.browse:null;
}
/* the card browser: compare the selected stack with any kind of card */
const BROWSE=[["Standard",["2","3","4","5","6","7","8","9","10","puppet","archer","cannon"]],["Special",["J","Q","K","A","JK","assassin"]],["Support",["scout","healer","repair","ram","miner"]],["Wildcard",["samson","antony","satan","leviathan","bullgoat","goatbull","debt","slavemaster","slave","trafficker"]],["Base",["A","tree","wall"]]];
function protoCard(k){if(k==="puppet"){const c=mk("2","S");c.puppet=true;return c}if(UNIT[k])return mkUnit(k,null);if(k==="JK")return mk("JK",null,"black");return mk(k,"S")}
function openBrowser(base,title){
  ovShow(`<div class="ovbox wide"><h2>Compare with a kind of card</h2><p class="dim">The suit doesn't matter here. Pick a category, then a card.</p>
${BROWSE.map(([cat,ks])=>`<h3>${cat}</h3><div class="pickrow">${ks.map(k=>{const c=protoCard(k);return `<button class="pk" data-bk="${k}" aria-label="${esc(nameOf(c))}">${face(c,{owner:null,noci:true})}</button>`}).join("")}</div>`).join("")}
<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;
  $("#ov").querySelectorAll("[data-bk]").forEach(b=>b.onclick=e=>{const c=protoCard(b.dataset.bk);ovHide();pop(`<div class="cih"><b>Compare</b></div>`+compareHTML(base,{cards:[c],owner:null},title,nameOf(c).replace(/ of Spades/,"")),e.clientX,e.clientY,"info wide")});
}

/* ---------- the moon (or what is in its place), hover or click ---------- */
const SKY_NAME={moon:"Fate",saturn:"No",mars:"Strife",sun:"King",mercury:"Guile",venus:"Harmony",jupiter:"Fortune"};
function moonInfoHTML(){
  const m=G.moon,V=view(),P=G.p[V],L=[];
  if(["sun","blacksun","venus","jupiter","mercury","fallen"].includes(m.gone))return planetInfoHTML(m.gone);
  if(m.gone==="off")L.push("The moon is off for this game: no phases, no gifts, no tolls.");
  else if(m.gone==="mars"){L.push("Mars hangs where the moon was. At the start of each turn, every stack of only Grunts and Infantry (Puppets too) gets advantage on its next attack on 1–5 of 1d8.");
    if(G.moonLev)L.push(`The Leviathan coils on Mars; its toll and its weak spot come every eighth round.`)}
  else if(m.gone==="saturn"){const S=G.saturnBy;L.push(S==null?"Saturn has hung in the sky from the start. Its favors go to the Bank.":`Saturn hangs where the moon was, regurgitated by ${esc(G.p[S].name)}.`);
    if(S===V)L.push(`Every enemy pays you ${1+(G.saturnDebt||0)} at the start of each of their turns.`);
    else if(P.tribe==="binah")L.push("You are Binah: you owe Saturn nothing.");
    else if(P.tribe==="firm")L.push("You are the Firmament: Saturn's tax doesn't touch you.");
    else if(S==null||isEnemy(V,S))L.push(`At the start of each of your turns you pay ${1+(G.saturnDebt||0)} (a hand card, the top deck card or 1 mana), or a Debt Collector rises.`);
    if(G.saturnDebt)L.push(`Debt Collectors still standing have raised the price by ${G.saturnDebt}.`)}
  else if(m.gone==="eaten")L.push("Yaldabaoth ate the moon. Its phases have stopped: no gifts, no tolls, no Blood Moon.");
  else{
    L.push(`<b>${MOON[m.i]}</b>${m.blood?" · <b>Blood Moon</b>":""}. The moon turns once a round, after every player has had a turn.`);
    if(m.blood)L.push("New Moon gifts at Full Moon prices; every card killed falls into the Outer Darkness, and a Joker that shoots itself sends its souls there too.");
    else if(m.i===0)L.push("New Moon: everyone raises 1d2 cards from the grave. Clairvoyance and Naked Hand cost 6."+(G.opts.moonBonus!==false?" Every defense adds 1d2.":""));
    else if(m.i===4)L.push("Full Moon: the toll is paid, decks are shuffled, no one draws and no necromancy is cast. Clairvoyance costs 2, Naked Hand is free."+(G.opts.moonBonus!==false?" Every attack adds 1d2.":""));
    else L.push(`No moon effect this phase. Next: ${MOON[(m.i+1)%8]}.`);
    if(G.moonLev)L.push(`The Leviathan (${G.moonLev.card.hp} heart${G.moonLev.card.hp===1?"":"s"}) lies on the moon. ${G.moonLev.owner===V?"Your mana cap rises with the Outer Darkness.":P.tribe==="tiph"?"You are immune to its toll.":"It takes its toll from you each New Moon: 2d4 deck cards, 2 hand cards and 1 mana."} It can be attacked only at the New Moon.`);
  }
  if(G.deconjure)L.push("Deconjured: no conjuring at the next Full Moon.");
  if(G.noGraveNext)L.push("Deconjured: no grave gift at the next New Moon.");
  if(G.noConjureRound===G.moon.round)L.push("Deconjured: no one can conjure this round.");
  if(G.moonMiner)L.push(`${esc(G.p[G.moonMiner.owner].name)}'s Miner works the moon: 1d2 − 1 mana every turn, until the moon leaves the sky or the Leviathan climbs onto it.`);
  if(G.bloodCalled)L.push("The Firmament has called a Blood Moon: the next Full Moon turns red.");
  const nm=m.gone==="saturn"?"Saturn":m.gone==="mars"?"Mars":m.gone?"No moon":"The Moon",word=m.gone==="saturn"?SKY_NAME.saturn:m.gone==="mars"?SKY_NAME.mars:m.gone?"":SKY_NAME.moon;
  return `<div class="cin sky"><div class="cih"><b>${nm}</b>${word?` <span class="skyword">“${word}”</span>`:""}</div><p>${L.join("</p><p>")}</p></div>`;
}
function wireMoon(){
  const el=$("#moon");if(!el||el.dataset.w)return;el.dataset.w=1;
  const show=e=>{if(!G)return;const r=el.getBoundingClientRect();const p=pop(moonInfoHTML(),r.left,r.bottom-scrollY+scrollY,"info");p.dataset.hover=e.type==="mouseenter"?"1":""};
  el.addEventListener("mouseenter",show);
  el.addEventListener("mouseleave",()=>{const p=$("#cinfo");if(p&&p.dataset.hover)p.hidden=true});
  el.addEventListener("click",e=>{if(G&&canAct()&&G.phase==="attack"&&G.sel&&moonAttackable(selStack()))return;e.stopPropagation();show(e);const p=$("#cinfo");if(p)delete p.dataset.hover});
}

/* ---------- a player's status: hover or click the Substance symbol ---------- */
function statusHTML(pl){
  const P=G.p[pl],T=TRIBES[P.tribe]||{name:"",sub:""},L=[];
  if(P.cpu==="horde")return `<div class="cin"><div class="cih"><b>The Horde</b></div><p>It spawns every round and never holds back.</p></div>`;
  L.push(`<dt class="k-type">Substance</dt><dd>${esc(T.name)}${P.randomSub?" (random)":""}</dd>`);
  L.push(`<dt class="k-soul">Limits</dt><dd>${handCap(pl)}-card hand · ${soulCap(pl)} mana (up to ${surCap(pl)} for a round) · ${P.deck.length} cards in the deck</dd>`);
  const fx=[];
  if(P.bolts)fx.push(`${P.bolts}/3 bolts`);if((P.thralls||[]).length)fx.push(`${P.thralls.length} thralls`);if(P.hunger)fx.push(`hunger ${P.hunger}/7`);
  if(P.shield)fx.push("Please Don't Hurt Me");if(P.joy)fx.push("Pleasure and Joy");if(P.theft)fx.push("Joyful Theft");
  if(deluded(pl))fx.push(`Delusion, ${P.delu.turns} turn${P.delu.turns>1?"s":""} (${3-(P.delu.diceCut||0)}d2 free mana)`);
  if(P.od)fx.push(`overdrawn ${P.od}`);if(P.shownBy!=null)fx.push("hand seen by Naked Hand");
  if((P.returning||[]).length)fx.push(`${P.returning.length} card${P.returning.length>1?"s":""} teleporting home`);
  if(JOKER_BONUS[P.tribe])fx.push(`Jokers +${JOKER_BONUS[P.tribe]} on attack`);
  if(fx.length)L.push(`<dt class="k-fx">Effects</dt><dd>${fx.map(esc).join("<br>")}</dd>`);
  const casts=(P.hist||[]).filter(e=>e.kind==="spell").slice(0,6);
  if(casts.length)L.push(`<dt class="k-atk">Cast</dt><dd>${casts.map(e=>`${esc(e.name)}${e.tile?" on "+e.tile:""}${e.target?" at "+esc(e.target):""} <small>${e.round?"round "+e.round:"setup"}, ${clock(e.t)}</small>`).join("<br>")}</dd>`);
  return `<div class="cin" style="--pc:${P.color}"><div class="cih">${solidSVG(P.solid,P.color,16)} <b>${esc(P.name)}</b></div><dl>${L.join("")}</dl></div>`;
}
function wireStatus(){
  document.querySelectorAll("[data-stat]").forEach(b=>{
    const show=e=>{const r=b.getBoundingClientRect();const p=pop(statusHTML(+b.dataset.stat),r.left,r.bottom,"info");p.dataset.hover=e.type==="mouseenter"?"1":""};
    b.onmouseenter=show;b.onmouseleave=()=>{const p=$("#cinfo");if(p&&p.dataset.hover)p.hidden=true};
    b.onclick=e=>{e.stopPropagation();show(e);const p=$("#cinfo");if(p)delete p.dataset.hover};
  });
}

/* ---------- the menu (it pauses the game) ---------- */
function openMenu(){
  if(!G)return;G.paused=true;
  let m=$("#menu");if(!m){m=document.createElement("div");m.id="menu";document.body.appendChild(m)}
  const sel=(id,label,opts,cur)=>`<label class="f">${label} <select id="${id}">${opts.map(([v,t])=>`<option value="${v}" ${v===cur?"selected":""}>${t}</option>`).join("")}</select></label>`;
  m.innerHTML=`<div class="ovbox"><button type="button" class="xclose" id="mX" aria-label="Resume">×</button><h2>Paused</h2><p class="dim">The game waits while this menu is open. These settings change how the table looks, not the rules.</p>
<div class="mgrid">
${sel("mTheme","Page theme",Object.entries(THEMES).map(([k,[n]])=>[k,n]),PREF.theme)}
${sel("mHand","Your hand",[["below","Under your deck and mana"],["side","Beside the field"]],PREF.hand)}
${sel("mSel","Selected stack box",[["bottom","Below the spells"],["top","Above the spells"]],PREF.sel)}
${sel("mCtl","Turn buttons",[["bottom","Under the field"],["top","At the top"]],PREF.ctl)}
${sel("mCoord","Tile names",[["0","Off"],["1","On"]],PREF.coords?"1":"0")}
${sel("mFull","Page width",[["0","Standard"],["1","Full width"]],PREF.full?"1":"0")}
${sel("mLines","Background lines",[["1","On"],["0","Off"]],PREF.lines===false?"0":"1")}
${sel("mAnimC","Card animations",[["1","On"],["0","Off"]],PREF.fxCards===false?"0":"1")}
${sel("mAnimM","Magic animations",[["1","On"],["0","Off"]],PREF.fxMagic===false?"0":"1")}
${sel("mSpeed","Computer speed",[["slow","Slow"],["normal","Normal"],["fast","Fast"]],G.opts.cpuSpeed||"normal")}
<label class="f mslide">Sound effects <input type="range" id="mSfx" min="0" max="150" step="5" value="${SND.on?Math.round(sfxV()*100):0}"><b id="mSfxV"></b></label>
<label class="f mslide">Music <input type="range" id="mMus" min="0" max="150" step="5" value="${SND.on&&PREF.music!==false?Math.round((PREF.musicVol==null?1:PREF.musicVol)*100):0}"><b id="mMusV"></b></label>
</div>
<div class="mgrid">${[["ci","Card icons",.8,1.8],["ui","Interface size",.8,1.4],["tz","Text size",.8,1.8],["bright","Brightness",.7,1.3]].map(([k,n])=>`<span class="gctl">${n} <button type="button" data-mz="${k}" data-d="-1">−</button><b id="mz${k}">${Math.round(PREF[k]*100)}%</b><button type="button" data-mz="${k}" data-d="1">+</button></span>`).join("")}</div>
${+G.opts.timer?`<p><button class="btn ghost" id="mTimer">Turn the phase timer off for this game</button></p>`:""}
<p class="acts"><button class="btn" id="mResume">Resume</button></p></div>`;
  m.hidden=false;
  const upd=()=>{savePrefs();applyPrefs();render()};
  $("#mTheme").onchange=e=>{PREF.theme=e.target.value;upd()};$("#mHand").onchange=e=>{PREF.hand=e.target.value;upd()};
  $("#mSel").onchange=e=>{PREF.sel=e.target.value;upd()};$("#mCtl").onchange=e=>{PREF.ctl=e.target.value;upd()};
  $("#mCoord").onchange=e=>{PREF.coords=e.target.value==="1";upd()};$("#mLines").onchange=e=>{PREF.lines=e.target.value==="1";upd()};$("#mAnimC").onchange=e=>{PREF.fxCards=e.target.value==="1";upd()};$("#mAnimM").onchange=e=>{PREF.fxMagic=e.target.value==="1";upd()};$("#mFull").onchange=e=>{PREF.full=e.target.value==="1";upd()};
  $("#mSpeed").onchange=e=>{G.opts.cpuSpeed=e.target.value};wireAudioSliders();
  m.querySelectorAll("[data-mz]").forEach(b=>b.onclick=()=>{const k=b.dataset.mz,lim=k==="ui"?[.8,1.4]:k==="bright"?[.7,1.3]:[.8,1.8];PREF[k]=Math.round(Math.min(lim[1],Math.max(lim[0],PREF[k]+ +b.dataset.d*.1))*10)/10;$("#mz"+k).textContent=Math.round(PREF[k]*100)+"%";upd()});
  if($("#mTimer"))$("#mTimer").onclick=()=>{G.opts.timer=0;stopTimer();log("The phase timer is switched off for the rest of the game.","event");$("#mTimer").remove()};
  $("#mResume").onclick=closeMenu;$("#mX").onclick=closeMenu;
}
function closeMenu(){const m=$("#menu");if(m)m.hidden=true;if(G){G.paused=false;render()}}

UNIT_ICON.goatbull=`<path d="M-9,-8C-11,-4 -9,-1 -6,-2 M9,-8C11,-4 9,-1 6,-2 M-6,-4C-4,-6 4,-6 6,-4L5,4C4,8 -4,8 -5,4Z M-3,5h0.1 M3,5h0.1 M-2,-1L-2.5,0 M2,-1L2.5,0 M-5,-5L-8,-9 M5,-5L8,-9"/>`;
