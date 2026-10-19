/* ---------------- UI ---------------- */
let flashT;
function flash(t){const f=$("#flash");if(!f)return;f.textContent=t;f.hidden=false;clearTimeout(flashT);flashT=setTimeout(()=>f.hidden=true,2800)}
function ovShow(html,cls){const o=$("#ov");o.className=cls||"";o.innerHTML=html;o.hidden=false;const f=o.querySelector("button");if(f)f.focus({preventScroll:true});setTimeout(decorateOv,0)}
function ovHide(){const o=$("#ov");o.hidden=true;o.className="";o.innerHTML=""}
const BOXNAME={limbo:"limbo",outer:"outer",ether:"etherbox",plain:""};
function askHuman(pl,spec){
  return new Promise(res=>{
    const who=G.opts.mode==="local"&&!G.opts.online?`<p class="dim">${esc(G.p[pl].name)} chooses.</p>`:"";
    if(spec.kind==="yesno"){
      ovShow(`<div class="ovbox"><h2>${spec.title}</h2>${who}<p>${spec.text}</p><p class="acts"><button class="btn" id="qy">${esc(spec.yes)}</button> <button class="btn ghost" id="qn">${esc(spec.no)}</button></p></div>`);
      $("#qy").onclick=()=>{ovHide();res(true)};$("#qn").onclick=()=>{ovHide();res(false)};return;
    }
    if(spec.kind==="choice"){
      ovShow(`<div class="ovbox"><h2>${esc(spec.title)}</h2>${who}<div class="choices">${spec.options.map(o=>`<button class="btn ghost choice" data-o="${esc(o.id)}"><b>${esc(o.label)}</b>${o.sub?`<small>${esc(o.sub)}</small>`:""}</button>`).join("")}</div>${spec.cancel?`<p><button class="btn ghost" id="mcancel">${esc(spec.cancel)}</button></p>`:""}</div>`);
      $("#ov").querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{ovHide();res(b.dataset.o)});
      if(spec.cancel)$("#mcancel").onclick=()=>{ovHide();res(null)};return;
    }
    if(spec.kind==="player"){
      ovShow(`<div class="ovbox"><h2>${esc(spec.title)}</h2>${who}<div class="pickrow">${spec.players.map(pl=>`<button class="btn ghost pbtn" data-p="${pl}" style="--pc:${G.p[pl].color}">${solidSVG(G.p[pl].solid,G.p[pl].color,16)} ${esc(G.p[pl].name)} <small>hand ${G.p[pl].hand.length} · deck ${G.p[pl].deck.length}</small></button>`).join("")}</div></div>`);
      $("#ov").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ovHide();res(+b.dataset.p)});return;
    }
    const cards=spec.cards;
    ovShow(`<div class="ovbox ${BOXNAME[spec.box]||""}"><h2>${spec.title}</h2>${who}${spec.sub?`<p class="dim">${esc(spec.sub)}</p>`:""}${pickCardsHTML(cards,c=>({owner:spec.box==="outer"?c.darkOwner:c.owner,price:spec.price}),spec.prices?i=>({tag:`${spec.prices[i]} mana`,off:!!(spec.offs&&spec.offs[i])}):null)}${spec.cancel?`<p><button class="btn ghost" id="mcancel">${esc(spec.cancel)}</button></p>`:""}</div>`);
    $("#ov").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ovHide();res(+b.dataset.i)});wirePickTabs($("#ov"));
    if(spec.cancel)$("#mcancel").onclick=()=>{ovHide();res(null)};
  });
}
/* v45: a long list of cards to pick from (the grave, a hand, the Outer Darkness) reads like the Ether: tabs by kind of card,
   each kind under its heading, and the same card folded into one button with a count */
const pickKey=c=>[c.unit||"",c.rank,c.suit||"",c.color||"",c.puppet?"p":"",c.hp!=null?c.hp:""].join("|");
function pickTabsHTML(groups,n){return `<div class="pktabs" role="tablist"><button type="button" class="pktab on" data-pt="all">All <b>${n}</b></button>${groups.map(([k,l])=>`<button type="button" class="pktab" data-pt="${k}">${k} <b>${l.length}</b></button>`).join("")}</div>`}
function pickCardsHTML(cards,opt,extra){const btn=(c,i,n)=>{const x=extra?extra(i):null;return `<span class="ecount${x?" priced":""}"><button class="pk" data-i="${i}" aria-label="${esc(nameOf(c))}${n>1?` (${n})`:""}${x?`, ${x.tag}`:""}" ${x&&x.off?'disabled data-tip="You can\'t afford this one."':""}>${face(c,opt(c))}</button>${n>1?`<b>×${n}</b>`:""}${x?`<small class="pkprice${x.off?" off":""}">${x.tag}</small>`:""}</span>`};
  if(cards.length<=8)return `<div class="pickrow">${cards.map((c,i)=>btn(c,i,1)).join("")}</div>`;
  const idx=new Map(cards.map((c,i)=>[c,i])),groups=pileGroups([...cards]);
  return pickTabsHTML(groups,cards.length)+groups.map(([k,l])=>{const by=new Map();for(const c of l){const key=pickKey(c);if(!by.has(key))by.set(key,[]);by.get(key).push(c)}
    return `<div class="pkgrp" data-pg="${k}"><h3>${k} <span class="dim">${l.length}</span></h3><div class="pickrow">${[...by.values()].map(x=>btn(x[0],idx.get(x[0]),x.length)).join("")}</div></div>`}).join("")}
function wirePickTabs(root,onTab){root.querySelectorAll(".pktab").forEach(b=>b.onclick=()=>{const t=b.dataset.pt;
  root.querySelectorAll(".pktab").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-selected",x===b)});
  root.querySelectorAll("[data-pg]").forEach(g=>g.hidden=t!=="all"&&g.dataset.pg!==t);if(onTab)onTab(t)})}
function viewBox(title,cards,box,note,owners){
  // every pile reads the same way: grouped by card type, each type sorted, with counts
  const own=c=>owners?c.darkOwner:c.owner;
  const groups=pileGroups(cards);
  const body=cards.length?(cards.length>8?pickTabsHTML(groups,cards.length):"")+groups.map(([k,l])=>`<div class="pkgrp" data-pg="${k}"><h3>${k} <span class="dim">${l.length}</span></h3><div class="pickrow">${(()=>{const by=new Map();for(const c of l){const key=(c.unit||c.rank)+(c.rank==="JK"?c.color:"")+(c.puppet?"p":"")+(box==="ether"?"":"|"+own(c));if(!by.has(key))by.set(key,[]);by.get(key).push(c)}return [...by.values()].map(x=>`<span class="ecount">${face(x[0],{owner:box==="ether"?null:own(x[0])})}${x.length>1?`<b>×${x.length}</b>`:""}</span>`).join("")})()}</div></div>`).join(""):'<p class="dim">Empty.</p>';
  ovShow(`<div class="ovbox wide ${BOXNAME[box]||""}"><h2>${title}</h2>${note?`<p class="dim">${note}</p>`:""}${body}<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;wirePickTabs($("#ov"));
}
function passScreen(msg){
  return new Promise(res=>{
    G.passing=true;render();
    const P=me();const seen=P.seen;P.seen=false;
    ovShow(`<div class="ovbox"><h2>${esc(msg)}</h2><p>Pass the device to <b>${esc(P.name)}</b>. The cards stay dark until they confirm.</p>${seen?`<p class="seen">Your hand was seen by Naked Hand.</p>`:""}<p><button class="btn" id="ready">I'm ${esc(P.name)}: show my cards</button></p></div>`,"blackout");
    $("#ready").onclick=()=>{ovHide();G.passing=false;render();res()};
  });
}
function end(w,why){
  G.over=true;G.busy=false;stopTimer();
  const team=G.p.filter(P=>P.team===G.p[w].team).map(P=>P.i),names=team.map(plName).join(" and ");
  log(`<b>${names} win${team.length>1?"":"s"}</b>: ${why}.`,"win");render();
  const hs=G.p.filter(P=>!P.cpu);const title=hs.length===1?(team.includes(hs[0].i)?(team.length>1?"Your side wins":"You win"):"The computer wins"):`${names} win${team.length>1?"":"s"}`;
  ovShow(`<div class="ovbox"><h2>${title}</h2><p>${why}.</p><p><button class="btn" id="again">New game</button></p></div>`);$("#again").onclick=showStart;
}
const PHASES=[["draw","Draw","roll d4s to draw, or skip"],["prep","Prep","sacrifice, cast, place, move"],["attack","Attack","each stack may attack once"]];
function canAct(){return G&&!G.over&&!G.busy&&!G.passing&&!me().cpu&&!me().out&&G.active===view()}
function bars(P){
  const N=Math.max(1,P.start||P.deck.length||1),n=P.deck.length,fill=Math.min(n,N),extra=Math.max(0,n-N);
  const blocks=Array.from({length:N},(_,i)=>`<i class="${i<fill?"f":""}"></i>`).join("");
  const over=extra?`<span class="surplus" style="width:calc(${Math.min(100,extra/N*100).toFixed(2)}% - 4px);grid-template-columns:repeat(${Math.min(extra,N)},1fr)">${"<i></i>".repeat(Math.min(extra,N))}</span>`:"";
  const m=mana(P.i)-(P.debt||0);   // negative when the player owes the Bank
  return `<div class="meters"><div class="meter"><span class="bk">Deck</span><div class="deckbar" style="--pc:${P.color};grid-template-columns:repeat(${N},1fr)" role="img" aria-label="Deck ${n} cards of ${N}">${blocks}${over}</div><b class="mv">${n}${extra?` <small>+${extra}</small>`:""}</b></div>
<div class="meter mana"><span class="bk">Mana</span><div class="manabar" role="img" aria-label="Mana ${m} of ${soulCap(P.i)}">${Array.from({length:soulCap(P.i)},(_,i)=>`<i class="${i<m?"f":""}"></i>`).join("")}${m>soulCap(P.i)?`<span class="msur" title="surplus: fades at the next round">${"<i></i>".repeat(Math.min(12,m-soulCap(P.i)))}</span>`:""}</div><b class="mv${m<0?" neg":""}">${m<0?"−"+(-m):m}/${soulCap(P.i)}${m>soulCap(P.i)?` <small>surplus</small>`:""}</b></div></div>`;
}
function pboxHTML(pl,top){
  const P=G.p[pl],act=pl===G.active&&G.phase!=="setup";
  const tag=P.cpu==="horde"?"the Horde":(P.cpu?`computer · ${P.cpu} · `:"")+(TRIBES[P.tribe]?TRIBES[P.tribe].name:"");
  const V=view(),rel=pl===V?"":isEnemy(pl,V)?"":'<span class="ally">ally</span>';
  let h=`<div class="ph" style="--pc:${P.color}"><button type="button" class="subst" data-stat="${pl}" title="Status: hover or click">${solidSVG(P.solid,P.color,18)}</button><b>${esc(P.name)}</b><span class="dim">${esc(tag)}</span>${rel}${P.out?'<span class="outmark">out</span>':act?'<span class="turnmark">to play</span>':""}</div>`;
  if(P.out)return h;
  if(P.cpu==="horde"){
    const units=stacksOf(pl).reduce((a,x)=>a+x.st.cards.length,0);
    h+=`<p class="stats"><span>On the field <b>${units}</b> card${units===1?"":"s"} in <b>${stacksOf(pl).length}</b> stack${stacksOf(pl).length===1?"":"s"}</span></p>`;
  }else{
    h+=bars(P);
    const sl=[];
    if(P.tribe==="angel")sl.push(`<span class="bolts" title="Bolts for Lightning Strike">Bolts ${[0,1,2].map(i=>`<i class="${i<(P.bolts||0)?"f":""}">${unitSVG("bolt",i<(P.bolts||0)?"#8fd0ff":"#4a5a66",13)}</i>`).join("")}</span>`);
    if(P.tribe==="binah")sl.push(`<span>Thralls <b>${(P.thralls||[]).length}/10</b></span>`);
    if(P.shield)sl.push(`<span class="pinktag">Please Don't Hurt Me</span>`);
    if(deluded(pl))sl.push(`<span class="delutag">Deluded ${P.delu.turns} turn${P.delu.turns>1?"s":""} · ${3-(P.delu.diceCut||0)}d2 free a turn${P.delu.blindfold?" · Blindfold":""}${P.delu.extended?" · extended":""}</span>`);
    if(P.joy)sl.push(`<span class="joytag">Pleasure and Joy</span>`);
    sl.push(...econTags(P));
    if(P.tribe==="yald")sl.push(`<span>Hunger <b>${P.hunger||0}/7</b></span>`);
    if(P.tribe==="tiph"){const n=stacksOf(pl).reduce((a,x)=>a+x.st.cards.reduce((b,c)=>b+((c.prisoners||[]).length),0),0);sl.push(`<span>Prisoners <b>${n}</b></span>`)}
    if(sl.length)h+=`<p class="stats subline">${sl.join("")}</p>`;
    const showHand=top;
    if(showHand){
      const open=eclipseOn("sun")&&!G.passing||P.shownBy!=null&&!G.passing&&(P.shownBy===V||!isEnemy(P.shownBy,V))||!isEnemy(pl,V)&&G.p.filter(Q=>!Q.cpu).length===1&&!G.passing;
      h+=`<div class="handrow"><span class="bk">Hand ${P.hand.length}/${handCap(pl)}</span>${P.hand.map(c=>open?face(c,{cls:"sm"}):back(pl)).join("")}${open?'<span class="seenmark">seen</span>':""}</div>`;
    }else h+=`<p class="stats"><span>Hand <b>${P.hand.length}/${handCap(pl)}</b></span>${P.od?`<span class="odn">overdrawn <b>${P.od}</b></span>`:""}${P.loot?`<span class="loot" title="From the Bank heist: pours into the soul pile at the start of each turn">stash <b>${P.loot}</b></span>`:""}</p>`;
  }
  if(top)h+=`<div class="traywrap">${trayHTML(P,pl)}</div>`;
  return h;
}
function render(){
  if(!G)return;if(G.moonMiner)checkMoonMiner();
  const V=view(),T=enemiesOf(V).filter(i=>!isNPC(i))[0]??(V===0?1:0);
  if(G.placing&&G.selHand!==G.placing)G.selHand=G.placing;
  const K=G.rows===COLS?seat(V).rot:(seat(V).rot%2?0:seat(V).rot),duel=G.map.layout==="duel"&&K%2===0;
  document.body.classList.toggle("passing",!!G.passing);
  // moon
  const m=G.moon,tags=[];
  if(m.blood)tags.push('<span class="tag blood">Blood Moon</span>');
  const eff=m.gone||G.moonLev?moonNote():m.blood?"New Moon gifts at Full Moon prices · the dead go to the Outer Darkness":m.i===4?"Toll paid, decks shuffled · no drawing, no necromancy":m.i===0?"1d2 cards from the grave · Clairvoyance and Naked Hand cost 6":"";
  const rn=G.moon.round||1;
  $("#moon").classList.toggle("eclipsed",!!G.eclipse);$("#moon").classList.toggle("peacetime",peaceOn());$("#moon").classList.toggle("wartime",warOn());
  $("#moon").classList.toggle("moontarget",canAct()&&G.phase==="attack"&&!!G.sel&&moonAttackable(selStack()));
  $("#moon").innerHTML=`${moonSVG()}<div class="minfo"><span class="mname">${moonName()}</span>${tags.join("")}${moonStrip()}<span class="meff">${eff||"It turns once every player has had a turn"}</span></div>`;
  // round (survival)
  const rd=$("#round");rd.hidden=!survival();if(survival())rd.innerHTML=`<span class="label">Round</span><b class="bl">${roman(Math.max(1,G.round))}</b>`;
  // phases
  if(G.phase==="setup")$("#phases").innerHTML=`<span class="ph-c on"><b>Setup</b><em>${G.setupStep==="ace"?(hq()&&!G.p[G.active].opening.length?"click a backline tile for your second base Ace":"click a backline tile for your Ace and Jack"):"place any opening cards, then press Done"}</em></span>`;
  else if(G.phase==="moon")$("#phases").innerHTML=`<span class="ph-c on"><b>Moon</b><em>${m.i<0?"no moon turns":"the "+MOON[m.i]+" takes effect"}</em></span>`;
  else $("#phases").innerHTML=PHASES.map(([id,n,help])=>`<span class="ph-c ${G.phase===id?"on":""}${id==="draw"&&(G.turnNo===1||G.noDraw)?" skip":""}"><b>${n}</b><em>${help}</em></span>`).join('<i>→</i>');
  const who=me();
  $("#who").innerHTML=whoHTML();
  // board: turned so the viewer's side is at the bottom
  const DR=G.rows,DC=COLS;
  const toBoard=(i,j)=>K===0?[i,j]:K===2?[DR-1-i,DC-1-j]:K===1?[j,DC-1-i]:[DR-1-j,i];
  let tgt=[];const live=canAct();
  if(live&&G.sel&&G.mode==="move")tgt=moveTargets();
  if(live&&G.sel&&G.mode==="attack")tgt=attackTargets();
  const placeT=[];
  if(live&&G.phase==="setup"&&G.setupStep==="ace"){for(const [r,c] of backTiles(G.active))if(!G.board[r][c])placeT.push([r,c])}
  else if(live&&G.selHand)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(canPlace(G.selHand,r,c))placeT.push([r,c]);
  const isT=(r,c,list)=>list.some(([a,b])=>a===r&&b===c);
  const B=$("#board");B.style.setProperty("--rows",DR);B.style.setProperty("--cols",DC);B.classList.toggle("mapped",G.map.theme!=="none");B.classList.toggle("nolabels",!duel);B.dataset.map=G.map.theme;B.classList.toggle("sunlit",G.moon.gone==="sun");B.classList.toggle("blacksun",G.moon.gone==="blacksun");B.style.setProperty("--tears",G.sunTears||0);
  if(!G.map.ground)G.map.ground=mapGround();G.map.art=G.map.art||{};
  const river=G.map.theme==="river";
  B.innerHTML=`<div class="mapbg">${G.map.ground}</div>`+[...Array(DR).keys()].map(i=>{
    const r0=toBoard(i,0)[0];
    let lineName="",nm="";
    if(duel){
      lineName=r0===backRow(V)?"your backline":r0===frontRow(V)?"your frontline":r0===backRow(T)?"enemy backline":r0===frontRow(T)?"enemy frontline":river?"river":"midline";
      nm=G.opts.mode==="cpu"||survival()?lineName.replace("enemy",survival()?"Horde":"computer's"):lineName;
      if(river&&lineName==="river")nm=`river · bridge on the ${G.map.bridge}`;
    }
    return `<div class="row ${lineName.replace(/\s/g,"-")}">${duel?`<span class="rl">${nm}</span>`:""}`+[...Array(DC).keys()].map(j=>{
      const [r,c]=toBoard(i,j);
      const st=hiddenFrom(V,r,c)?null:G.board[r][c],role=tileRole(r,c),edge=outerEdge(r,c,K),key=r+"."+c+"."+edge;   // a Delusion hides what lies beyond your reach
      const art=G.map.art[key]||(G.map.art[key]=tileArt(r,c,role,edge));
      if(role==="void"||role==="water")return `<div class="tile ${role}" aria-hidden="true">${art}</div>`;
      const cls=["tile"];if(G.sel&&G.sel.r===r&&G.sel.c===c)cls.push("sel");
      if(isT(r,c,tgt))cls.push(G.mode==="attack"?"tatk":"tmove");if(isT(r,c,placeT))cls.push("tplace");
      const z=G.zone[r][c];if(!duel&&z>=0)cls.push("zone");
      let inner="";
      if(st){
        const lead=st.cards.find(isBase)||st.cards.find(x=>x.unit&&UNIT[x.unit].hp)||[...st.cards].sort((a,b)=>nat(b)-nat(a)||kind(b).localeCompare(kind(a)))[0];
        const P=G.p[st.owner],mine=st.owner===V;
        const cap=st.cards.reduce((a,x)=>a+capMana(x),0);
        const odd=lead.unit||lead.puppet,ic=odd?inkSVG(lead.puppet?"puppet":lead.unit,inkOf(lead),28):"";
        const leadHTML=odd?`<span class="lead ulead"><span class="smark">${markHTML(lead)}</span>${ic}</span>`:`<span class="lead"><b class="rk${lead.rank==="JK"?" jk":""}">${lead.rank==="JK"?"Joker":lead.rank}</b><i>${lead.rank==="JK"?"✶":SUITS[lead.suit]}</i></span>`;
        inner=`<div class="stack ${hasBase(st)?"base ":""}${mine?"mine":isEnemy(st.owner,V)?"theirs":"ally"} ${lead.color}${hated(st)?" hated":""}${shielded(st.owner)?" pink":""}${G.p[st.owner].joy?" joy":""}${lead.unit?" u-"+lead.unit:""}" style="--pc:${P.color}"><span class="so">${solidSVG(P.solid,P.color,16)}</span><span class="ci" aria-label="Card info"></span>${st.cards.length>1?`<span class="cnt">×${st.cards.length}</span>`:""}${leadHTML}${st.cards.length>1?`<span class="mini">${st.cards.map(short).join(" ")}</span>`:""}${lead.maxHp?`<span class="bhp">${heartsHTML(lead)}</span>`:""}<em class="ty">${esc(typeWord(lead))}</em>${st.stun?`<span class="stun" title="Immobilized by lightning for ${st.stun} more turn${st.stun>1?"s":""}">${unitSVG("bolt","#6fb8ff",14)}${st.stun}</span>`:""}${st.odds?`<span class="odds ${st.odds}">${st.odds==="adv"?"▲":"▼"}</span>`:""}${st.hypo?`<span class="hypo" title="Hypostasis: untouchable">◈${st.hypo}</span>`:""}${cap?`<span class="souls" title="captured souls">✦${cap}</span>`:""}${st.owner===G.active&&(st.moved||st.attacked)&&G.phase!=="setup"?`<span class="used">${st.attacked?"atk":"mv"}</span>`:""}</div>`;
      }
      if(st&&showsBack(V,r,c)){const P=G.p[st.owner];inner=`<div class="stack theirs facedown" style="--pc:${P.color}"><span class="so">${solidSVG(P.solid,P.color,16)}</span><span class="fdback">${solidSVG(P.solid,P.color,30)}</span><em class="ty">face down</em></div>`}
      else if(st){if(st.down)inner=inner.replace('class="stack ','class="stack down ');if(st.ambush&&!isEnemy(st.owner,V))inner=inner.replace('class="stack ','class="stack ambush ');inner=siegeDecor(inner,st,V,r,c)}
      inner=crystalHTML(r,c,!!st)+inner;
      if(fogTile(V,r,c))cls.push("fog");if(fireAt(r,c))cls.push("fire");
      const zc=!duel&&z>=0?` style="--zc:${G.p[z].color}"`:"";
      return `<button class="${cls.join(" ")}${role==="bridge"?" bridge":""}"${zc} data-r="${r}" data-c="${c}" aria-label="${coord(r,c)}, ${lineName||(z>=0?G.p[z].name+"'s ground":"open ground")}${role==="bridge"?" bridge":""}${st?", "+st.cards.map(nameOf).join(", "):", empty"}">${art}${PREF.coords?`<span class="coord">${coord(r,c)}</span>`:""}${inner}</button>`;
    }).join("")+"</div>";
  }).join("");
  $("#board").querySelectorAll("button.tile").forEach(b=>b.onclick=()=>tileClick(+b.dataset.r,+b.dataset.c));
  // player boxes
  const others=G.p.map(P=>P.i).filter(i=>i!==V&&!isNPC(i));
  if(others.length===1){$("#foe").classList.remove("multi");$("#foe").innerHTML=pboxHTML(others[0],true);$("#foe").style.setProperty("--pc",G.p[others[0]].color)}
  else{$("#foe").classList.add("multi");$("#foe").innerHTML=others.map(o=>`<div class="pbox sub" style="--pc:${G.p[o].color}">${pboxHTML(o,true)}</div>`).join("")}
  $("#me").innerHTML=pboxHTML(V,false);$("#me").style.setProperty("--pc",G.p[V].color);
  $("#shared").innerHTML=`<button class="link limbo-l" id="seegrave">Grave <b>${G.grave.length}</b></button><button class="link" id="seeether">Ether <b>${G.ether.length}</b></button><button class="link dark-l" id="seedark">Outer Darkness <b>${G.dark.length}</b></button>`;
  $("#seegrave").onclick=()=>viewBox("The Grave",G.grave,"limbo","Shared by every player. The dead sleep here until something raises them.");
  $("#seeether").onclick=showEther;
  $("#seedark").onclick=()=>viewDark("dark");
  const bl=$("#blindnote");if(bl)bl.hidden=!blindFor(V);
  const PV=G.p[V];
  if(G.limbo.length&&!PV.readLimbo)$("#shared").insertAdjacentHTML("beforeend",`<button class="link notice limbo-n" id="nlimbo">Limbo: Samson is wandering <b>new</b></button>`);
  if(G.unknown.length&&!PV.readUnknown)$("#shared").insertAdjacentHTML("beforeend",`<button class="link notice unk-n" id="nunk">Unknown: Antony went missing <b>new</b></button>`);
  if(!survival()||(G.auction||[]).length){$("#shared").insertAdjacentHTML("beforeend",`<button class="link auct-l" id="seeauct">Auction <b>${G.auction.length}</b></button>`);$("#seeauct").onclick=viewAuction}
  if($("#nlimbo"))$("#nlimbo").onclick=()=>{PV.readLimbo=true;viewDark("limbo");render()};
  if($("#nunk"))$("#nunk").onclick=()=>{PV.readUnknown=true;viewDark("unknown");render()};
  // hand
  const P=G.p[V];
  $("#handh").textContent=G.p.filter(Q=>!Q.cpu).length>1&&!G.opts.online?`${P.name}'s hand`:"Your hand";
  const hidden=G.passing;
  $("#hand").innerHTML=P.hand.length?P.hand.map((c,i)=>hidden?back(V):`<div class="hc"><button class="cardbtn ${G.selHand===c?"on":""}" data-h="${i}" aria-label="${esc(nameOf(c))}">${face(c)}</button>${live&&sacrificeAllowed()&&canSacCard(c)?`<button class="mini-btn" data-sh="${i}" title="Sacrifice to your soul pile: its Ether price − 1d2 + 1 (${handSacLabel(c).slice(1)} mana), rolled when you do it">sac ${handSacLabel(c)}</button>${sunSacOk(V)?`<button class="mini-btn sunsac" data-sunh="${i}" title="Sacrifice to the Second Sun (+${soulOf(c)} fire mana)">sun +${soulOf(c)}</button>`:""}`:""}</div>`).join(""):'<p class="dim">No cards in hand.</p>';
  $("#hand").querySelectorAll("[data-h]").forEach(b=>b.onclick=()=>{
    if(!canAct())return;
    if(!(G.phase==="setup"&&G.setupStep==="more"||G.phase==="prep")){flash(G.phase==="setup"?"Place your Ace and Jack first.":"Cards are placed during setup or the prep phase.");return}
    if(G.placing){flash("Put the Slave down first.");return}
    const c=P.hand[+b.dataset.h];G.selHand=G.selHand===c?null:c;G.mode=null;render()});
  $("#hand").querySelectorAll("[data-sh]").forEach(b=>b.onclick=()=>{if(!canAct())return;sacrifice(P.hand[+b.dataset.sh],"hand");render()});
  $("#hand").querySelectorAll("[data-sunh]").forEach(b=>b.onclick=()=>{if(!canAct())return;sacrificeToSun(P.hand[+b.dataset.sunh],"hand");render()});
  $("#mytray").innerHTML=hidden?"":trayHTML(P,V);
  // controls
  const ctl=[];
  if(live&&G.phase==="draw")ctl.push(`<button class="btn" id="d4" ${P.deck.length&&!overdrewNow(G.active)?"":"disabled"}>${overdrewNow(G.active)?"Overdrew: no more draws":"Roll d4 and draw"}</button>`);
  if(live&&G.phase!=="moon")ctl.push(`<button class="btn ghost" id="next">${G.phase==="setup"?"Done setting up":G.nextLabel||"Next →"}</button>`);
  if(+G.opts.timer&&!G.over)ctl.push(`<span id="timer" class="timer" aria-live="off" title="time left in this phase">${G.deadline?Math.max(0,Math.ceil((G.deadline-Date.now())/1000))+"s":""}</span>`);
  $("#controls").innerHTML=ctl.join("");
  const ap=$("#actph");if(ap)ap.innerHTML=G.over?"Game over":G.passing?"":me().cpu?`${esc(me().name)} is playing…`:G.phase==="setup"?"<b>Setup</b>":G.phase==="moon"?"<b>Moon</b>":`<b>${({draw:"Draw",prep:"Prep",attack:"Attack"})[G.phase]||""}</b> · ${esc(me().name)}`;
  if($("#d4"))$("#d4").onclick=()=>{if(!canAct())return;rollDraw();render()};
  if($("#next"))$("#next").onclick=nextPhase;
  paintSndTop();
  renderSel(live);
  renderSpells(live);fitSide();
  document.querySelectorAll("[data-hist]").forEach(b=>b.onclick=e=>{e.stopPropagation();openHist(+b.dataset.hist,b)});
  wireCorners();wireMoon();wireStatus();
  if(histOpen!=null)fillHist();
  $("#log").innerHTML=G.log.filter(l=>!(l.fog&&l.fog.alt===""&&!l.fog.seen[view()]&&isEnemy(l.fog.by,view()))).map(l=>`<li class="${l.cls}"${l.pl!=null&&G.p[l.pl]?` style="--pc:${G.p[l.pl].color}"`:""}>${l.t?`<time>${clock(l.t)}</time>`:""}<span class="lt">${l.fog&&!l.fog.seen[view()]&&isEnemy(l.fog.by,view())?l.fog.alt:l.html}</span></li>`).join("");
  mountTimerOff();
}
function showEther(){viewBox("The Ether: Souls to Materially Conjure",G.ether,"ether",`${G.ether.length} souls wait in the Ether for a conjuring. Flesh Severance sends exiled souls back here.`)}
function renderSel(live){
  const box=$("#selbox"),st=selStack();
  if(G.phase==="setup"&&G.setupStep==="ace"&&live){box.innerHTML=`<p>Your Ace rises with a Jack inside it. Click a highlighted tile on your backline.</p>`;return}
  if(G.placing&&live){box.innerHTML=`<p><b>A Slave</b> is ready. Click an empty highlighted tile of your ground to put it down.</p>${unitInfo(G.placing)}`;return}
  if(G.selHand){box.innerHTML=`${G.selHand.unit?unitInfo(G.selHand):""}<p><b>${esc(nameOf(G.selHand))}</b> selected. Click a highlighted tile in your two lines to place it${kind(G.selHand)==="ace"?" (Aces go on an empty backline tile)":kind(G.selHand)==="joker"?" (Jokers spawn onto your stack holding a card of the same color)":""}.</p>${!isBase(G.selHand)&&kind(G.selHand)!=="joker"&&!G.placing?`<label class="fdtog"><input type="checkbox" id="fdChk" ${G.faceDown?"checked":""}> Place it face down <small>Only you see it. Double disadvantage to attack, advantage to defend; it turns face up when attacked. Face-down stacks can ambush.</small></label>`:""}`;
    if($("#fdChk"))$("#fdChk").onchange=e=>{G.faceDown=e.target.checked;render()};return}
  if(!st){box.innerHTML='<p class="dim">Select a stack on the board, or a card in your hand.</p>';return}
  if(showsBack(view(),G.sel.r,G.sel.c)){box.innerHTML=`<p><b>${esc(G.p[st.owner].name)}'s face-down stack</b> on ${coord(G.sel.r,G.sel.c)}. Its face is hidden; a Scout within two tiles would show it.</p>`;return}
  const mine=st.owner===G.active&&live,s=G.sel;
  const rows=st.cards.map(c=>{
    const k=kind(c),cap=capMana(c);
    const chk=mine&&!isBase(c)&&G.phase==="prep"?`<input type="checkbox" data-pk="${c.id}" ${s.pick.has(c.id)?"checked":""} aria-label="include ${esc(nameOf(c))} in the moving group">`:"";
    const sac=mine&&sacrificeAllowed()&&canSacOnField(st,c)?`<button class="mini-btn" data-sc="${c.id}">sac +${soulOf(c)}</button>${sunSacOk(view())?`<button class="mini-btn sunsac" data-sunc="${c.id}">sun +${soulOf(c)}</button>`:""}`:"";
    const stat=c.unit&&UNIT[c.unit].desc&&!UNIT[c.unit].shooter?UNIT[c.unit].desc:c.unit&&UNIT[c.unit].weapons?UNIT[c.unit].weapons.map(w=>w.name+": "+w.text).join("; "):`${nat(c)}${die(c)?" + d"+die(c):""}`;
    return `<li>${chk}${face(c,{cls:"sm"})} ${esc(typeWord(c))} · ${esc(stat)}${c.maxHp?" · "+heartsHTML(c):""}${c.hate?' · <span class="hatetag">Hate</span>':""}${(c.prisoners||[]).length?` · ⛓ ${c.prisoners.length} prisoner${c.prisoners.length>1?"s":""}`:""}${cap?` · ✦${cap} captured`:""} ${sac}</li>`}).join("");
  const acts=siegeActs(st,mine,s);
  const owner=G.p[st.owner].name;
  box.innerHTML=`<p><b>${st.owner===G.active?"Your":esc(owner)+"'s"} stack</b> · ${st.cards.length} card${st.cards.length>1?"s":""}${st.odds?` · ${st.odds==="adv"?"Divine Odds":"Hexed Odds"}`:""}${st.hypo?` · Hypostasis (${st.hypo})`:""}${st.stun?` · immobilized by lightning (${st.stun})`:""}${shielded(st.owner)?" · Please Don't Hurt Me":""}${st.moved?" · moved":""}${st.attacked?" · attacked":""}</p><ul class="cards">${rows}</ul><div class="acts">${acts.join("")}</div>${mine&&G.phase==="prep"?`<p class="dim">${st.moved?"This stack has moved this turn.":"Highlighted tiles show where it can go: click one to move. Uncheck any card you want to leave behind. Click the stack again to let go."}</p>`:""}${mine&&G.phase==="attack"?`<p class="dim">${attackTargets().length?"Click a highlighted enemy stack to attack it.":canAttackFrom(st)||st.cards.some(x=>x.unit&&UNIT[x.unit].shooter)?"No enemy stack is in reach.":"This stack can't attack now."}</p>`:""}${mine&&G.phase==="attack"&&moonAttackable(st)?`<p><button class="btn ghost" id="atkmoon">Attack the Leviathan on the moon</button></p>`:""}`;
  if($("#atkmoon"))$("#atkmoon").onclick=()=>{if(!canAct())return;attackMoon(s.r,s.c);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render()};
  box.insertAdjacentHTML("beforeend",`<details class="selinfo" ${PREF.selInfo===false?"":"open"}><summary>Stats</summary>${infoHTML1(st,st.cards.length>1?`Stack of ${st.cards.length}`:nameOf(st.cards[0]))}</details>${mine&&G.phase==="prep"&&canAmbush(st)&&!st.moved&&!st.attacked?`<p><button class="btn ghost sm" id="ambBtn">${st.ambush?"Leave the ambush":"Set an ambush"}</button> <small class="dim">${st.ambush?"Moving or attacking also breaks it.":"Hidden and still: it strikes, with advantage, any enemy that steps beside it."}</small></p>`:""}<p class="cmpbtns"><button class="btn ghost sm" id="cmpField">${G.comparePick?"Click a stack… (cancel)":"Compare with a stack"}</button> <button class="btn ghost sm" id="cmpType">Compare with a kind of card</button></p>`);
  box.querySelector(".selinfo").ontoggle=e=>{PREF.selInfo=e.target.open;savePrefs()};
  $("#cmpField").onclick=()=>{G.comparePick=!G.comparePick;render()};
  if($("#ambBtn"))$("#ambBtn").onclick=()=>{ambushToggle(s.r,s.c);G.mode=null;render()};
  $("#cmpType").onclick=()=>openBrowser(st,st.cards.length>1?`Stack of ${st.cards.length}`:nameOf(st.cards[0]));
  box.querySelectorAll("[data-pk]").forEach(i=>i.onchange=()=>{const id=+i.dataset.pk;i.checked?s.pick.add(id):s.pick.delete(id);G.mode=autoMode(st);render()});
  box.querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>{const c=st.cards.find(x=>x.id===+b.dataset.sc);sacrifice(c,{r:s.r,c:s.c});render()});
  box.querySelectorAll("[data-sunc]").forEach(b=>b.onclick=()=>{const c=st.cards.find(x=>x.id===+b.dataset.sunc);sacrificeToSun(c,{r:s.r,c:s.c});render()});
  wireSiege(st,s);
}
/* selecting your own stack shows where it can go (prep) or what it can hit (attack) straight away */
function autoMode(st){
  if(!st||st.owner!==G.active||!canAct())return null;
  if(G.phase==="prep"&&!st.moved)return "move";
  if(G.phase==="attack"&&G.sel&&(attackOptions(G.sel.r,G.sel.c).length||blindOptions(G.sel.r,G.sel.c).length))return "attack";
  return null;
}
function tileClick(r,c){
  if(!G||G.over||G.passing)return;
  const live=canAct();
  if(live&&G.phase==="setup"&&G.setupStep==="ace"){
    if(isBack(G.active,r,c)&&!G.board[r][c]&&!isVoid(r,c)){placeOpening(G.active,r,c);render()}else flash("Your Ace goes on an empty highlighted tile of your back line.");return}
  if(live&&G.selHand){if(canPlace(G.selHand,r,c)){place(G.selHand,r,c);render()}else flash("That card can't be placed there.");return}
  if(live&&G.sel&&G.mode==="move"&&moveTargets().some(([a,b])=>a===r&&b===c)){doMove(r,c);render();return}
  if(live&&G.sel&&G.mode==="attack"&&attackTargets().some(([a,b])=>a===r&&b===c)){chooseAttack(G.sel.r,G.sel.c,r,c);return}
  if(G.comparePick&&G.sel){const a=selStack(),b=hiddenFrom(view(),r,c)?null:G.board[r][c];G.comparePick=false;
    if(a&&b&&a!==b){const t=document.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`).getBoundingClientRect();pop(`<div class="cih"><b>Compare</b></div>`+compareHTML(a,b,stackTitle(a,G.sel.r,G.sel.c),stackTitle(b,r,c)),t.left,t.bottom,"info wide")}render();return}
  if(G.busy)return;
  const st=hiddenFrom(view(),r,c)?null:G.board[r][c];
  if(!st||(G.sel&&G.sel.r===r&&G.sel.c===c)){G.sel=null;G.mode=null;render();return}
  G.sel={r,c,pick:new Set(st.cards.filter(x=>!isBase(x)).map(x=>x.id))};G.mode=autoMode(st);render();
}

/* the history behind a dice box: every roll and spell, with the tile and the time on this computer */
let histOpen=null;
function histLine(e){
  const bits=[];
  if(e.kind==="spell"){if(e.tile)bits.push(e.tile);if(e.target)bits.push("at "+esc(e.target));if(e.cost)bits.push(`${e.cost} mana`)}
  else{if(e.tile)bits.push(e.tile);if(e.dice&&e.dice.length)bits.push(e.dice.map(d=>d.replace(":"," ")).join(" "));if(e.line)bits.push(esc(e.line))}
  return `<li class="${e.kind}"><b>${esc(e.name)}</b>${bits.length?": "+bits.join(", "):""}, <time>${clock(e.t)}</time> <small>${e.round?"round "+e.round:"setup"}</small></li>`;
}
function fillHist(){
  const box=$("#histpop");if(!box||!G||histOpen==null){if(box)box.hidden=true;return}
  const P=G.p[histOpen],list=(P.hist||[]);
  box.innerHTML=`<div class="hhead"><div class="htabs">${G.p.filter(Q=>!isNPC(Q.i)).map(Q=>`<button type="button" class="htab ${Q.i===histOpen?"on":""}" data-ht="${Q.i}" style="--pc:${Q.color}">${solidSVG(Q.solid,Q.color,13)} ${esc(Q.name)}</button>`).join("")}</div><button type="button" class="hx" aria-label="Close the history">×</button></div>
<ol class="hlist">${list.length?list.map(histLine).join(""):'<li class="dim">Nothing yet.</li>'}</ol>`;
  box.querySelectorAll("[data-ht]").forEach(b=>b.onclick=e=>{e.stopPropagation();histOpen=+b.dataset.ht;fillHist()});
  box.querySelector(".hx").onclick=closeHist;
}
function openHist(pl,anchor){
  let box=$("#histpop");
  if(!box){box=document.createElement("div");box.id="histpop";box.setAttribute("role","dialog");box.setAttribute("aria-label","History of rolls and spells");document.body.appendChild(box);
    box.addEventListener("click",e=>e.stopPropagation());
    document.addEventListener("click",()=>{if(histOpen!=null)closeHist()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&histOpen!=null)closeHist()})}
  if(histOpen===pl&&!box.hidden){closeHist();return}
  histOpen=pl;box.hidden=false;fillHist();
  const r=anchor.getBoundingClientRect(),w=Math.min(420,innerWidth-20);
  box.style.width=w+"px";box.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+scrollX+"px";box.style.top=r.bottom+scrollY+4+"px";
}
function closeHist(){histOpen=null;const b=$("#histpop");if(b)b.hidden=true}

/* the quote box carries a switch that turns the phase timer off for the rest of the game */
function mountTimerOff(){
  const box=$("#quotes");if(!box)return;let b=$("#timeroff");
  if(!b){b=document.createElement("button");b.id="timeroff";b.type="button";b.className="btn ghost sm";$("#qnext").after(" ",b);
    b.onclick=()=>{if(!G||!+G.opts.timer)return;G.opts.timer=0;stopTimer();log("The phase timer is switched off for the rest of the game.","event");flash("Phase timer off. Take your time.");render()}}
  const on=G&&!G.over&&+G.opts.timer;b.hidden=!on;b.textContent=on?`Turn the ${G.opts.timer}s phase timer off`:"";
}

/* a stack with several weapons asks which one to use on this target */
async function chooseAttack(r1,c1,r2,c2){
  let opts=attackOptions(r1,c1).filter(o=>o.r===r2&&o.c===c2);if(!opts.length)opts=blindOptions(r1,c1).filter(o=>o.r===r2&&o.c===c2);
  let mode=opts[0]?opts[0].mode:null;
  if(opts.length>1){G.busy=true;
    mode=await askHuman(G.active,{kind:"choice",title:"Which attack?",options:opts.map(o=>({id:o.mode,label:o.w.name,sub:o.w.text+(o.blind?" Into the fog: if nothing is there, the shot is lost.":o.ranged?" From here a miss costs nothing.":"")})),cancel:"Cancel"});
    G.busy=false;if(mode==null){render();return}}
  attack(r1,c1,r2,c2,mode);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render();
}
/* the Outer Darkness, with Limbo and Unknown once Samson and Antony have gone there */
function viewDark(tab){
  const tabs=[["dark","Outer Darkness",G.dark]];if(G.limbo.length)tabs.push(["limbo","Limbo",G.limbo]);if(G.unknown.length)tabs.push(["unknown","Unknown",G.unknown]);
  if(!tabs.some(t=>t[0]===tab))tab="dark";
  const note={dark:"Nothing here returns. Each card bears the symbol of the player who held it when it fell.",limbo:"Samson is wandering through Limbo. His card does not return from here.",unknown:"Antony went missing. His card does not return from here."}[tab];
  const list=tabs.find(t=>t[0]===tab)[2];
  ovShow(`<div class="ovbox outer wide"><h2>The Outer Darkness</h2>${tabs.length>1?`<div class="odtabs">${tabs.map(([k,n,l])=>`<button type="button" class="odtab ${k===tab?"on":""}" data-od="${k}">${n} <b>${l.length}</b></button>`).join("")}</div>`:""}<p class="dim">${note}</p>${list.length?pileGroups(list).map(([k,l])=>`<h3>${k} <span class="dim">${l.length}</span></h3><div class="pickrow">${l.map(c=>face(c,{owner:tab==="dark"?c.darkOwner:c.owner,cls:c.unit==="satan"?"satan-od":""})).join("")}</div>`).join(""):'<p class="dim">Empty.</p>'}<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;
  $("#ov").querySelectorAll("[data-od]").forEach(b=>b.onclick=()=>{const k=b.dataset.od,V=view();if(k==="limbo")G.p[V].readLimbo=true;if(k==="unknown")G.p[V].readUnknown=true;viewDark(k);render()});
}

function unitInfo(c){const U=UNIT[c.unit];if(!U)return "";
  const w=U.weapons?U.weapons.map(x=>`<li><b>${esc(x.name)}</b>: ${esc(x.text)}</li>`).join(""):"";
  return `<div class="uinfo">${unitSVG(c.unit,"var(--amber-hi)",30)}<div><b>${esc(U.name)}</b>${c.maxHp?" "+heartsHTML(c):""}${w?`<ul>${w}</ul>`:""}</div></div>`}
