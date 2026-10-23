/* ---------------- v74b: the enemies' boxes, minimal; the dice and log row's More options ----------------
   - An enemy's box no longer carries its own dice box: everyone's latest rolls are in the Dice rolls fold under your hand
     (and in fullscreen's dice row), each opening its history.
   - In fullscreen, each other player is one compact line at the top left: their symbol and name, a small deck bar and a
     small mana bar with their numbers, and their hand; nothing to scroll.
   - The dice row's ⚙ has More options: how many rolls and how many log lines it shows, whose (everyone, your team, only
     yours; the log always keeps the game's events), and its text size. */
{const _pb=pboxHTML;pboxHTML=function(pl,top){const h=_pb.apply(this,arguments);return top?h.replace(/<div class="traywrap">[\s\S]*$/,""):h}}

/* ---------- fullscreen: the other players, one line each ---------- */
function fsFoesHTML(){const V=view(),E=typeof nepEcState==="function"&&nepEcState(V);
  const L=G.p.filter(P=>P.i!==V&&!isNPC(P.i));
  return L.map(P=>{const n=P.deck.length,N=Math.max(1,P.start||n||1),m=mana(P.i)-(P.debt||0),cap=soulCap(P.i),act=P.i===G.active&&G.phase!=="setup";
    const pct=x=>Math.max(0,Math.min(100,x*100)).toFixed(0),q=E?"?":null;
    const nm=E&&E.names&&E.names[P.i]!=null?E.names[P.i]:P.name;   // v78j: Neptune's eclipse lies here too
    return `<div class="fsfoe${P.out?" out":""}${act?" act":""}" style="--pc:${P.color}" title="${esc(nm)}${!E&&P.cpu&&P.cpu!=="horde"?" · computer, "+P.cpu:""}">
<span class="fsfn">${solidSVG(P.solid,P.color,13)}<b>${esc(nm)}</b>${!E&&!isEnemy(P.i,V)?'<i class="fsally">ally</i>':""}${P.out?'<i class="fsout">out</i>':act?'<i class="fsact">▸</i>':""}</span>
${P.cpu==="horde"?"":`<span class="fsfm" title="Deck ${q||n}"><span class="fsfbar"><i style="width:${q?50:pct(Math.min(n,N)/N)}%"></i></span><em>${q||n}</em></span>
<span class="fsfm mana" title="Mana ${q||m}/${q||cap}"><span class="fsfbar"><i style="width:${q?50:pct(Math.max(0,m)/Math.max(1,cap))}%"></i></span><em>${q?"?/?":`${m}/${cap}`}</em></span>
<span class="fsfh" title="Hand">✋${P.hand.length}</span>${handOpen(P.i,V)&&P.hand.length?`<span class="fsfh seenmark" title="seen">${P.hand.map(c=>esc(short(c))).join(" ")}</span>`:""}`}</div>`}).join("")}   // v78j: Naked Hand and the suns' eclipse here too
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G||!fsOn())return;const f=$("#foe");if(f)f.innerHTML=fsFoesHTML()}}

/* ---------- the dice and log row: More options ---------- */
const fsN=k=>[1,2,3,5].includes(PREF[k])?PREF[k]:1,fsWho=k=>["all","team","me"].includes(PREF[k])?PREF[k]:"all";
const fsWhoOk=(pl,who)=>{const V=view();return who==="all"||pl===V||who==="team"&&pl!=null&&G.p[pl]&&!isEnemy(pl,V)};
fsRollHTML=function(){if(G.passing)return `<span class="dim">The dice are hidden while the device changes hands.</span>`;const who=fsWho("fsDiceWho"),N=fsN("fsDiceN");
  const rows=[];for(const P of G.p){if(isNPC(P.i)||!fsWhoOk(P.i,who))continue;for(const e of P.hist||[])if(e.kind==="roll")rows.push({P,e})}
  rows.sort((a,b)=>b.e.t-a.e.t);const top=rows.slice(0,N);if(!top.length)return `<span class="dim">No rolls yet.</span>`;
  const die=s=>{const m=/^d(\d+):(\d+)/.exec(s);return m?{s:+m[1],v:+m[2]}:null};
  return top.map(({P,e},k)=>`<span class="fsroll" style="--pc:${P.color}"><b>${esc(P.name)}</b> <small>${esc(e.name||"")}</small> <span class="dice">${(e.dice||[]).map(die).filter(Boolean).map(d=>dieSVG(d,P.color)).join("")||'<span class="dim">no dice</span>'}</span>${e.line?` <em>${esc(e.line)}</em>`:""}</span>${k===0?`<button type="button" class="link fshist" data-fshist="${P.i}">History</button>`:""}`).join("<br>")};
fsLogHTML=function(){const who=fsWho("fsLogWho"),N=fsN("fsLogN"),V=view();
  const L=G.log.filter(l=>!(l.fog&&l.fog.alt===""&&!l.fog.seen[V]&&isEnemy(l.fog.by,V))&&(l.pl==null||fsWhoOk(l.pl,who))).slice(0,N);   // the game's events (no one's) always show
  if(!L.length)return `<span class="fslog"><span class="dim">Nothing in the log yet.</span></span>`;
  return L.map(l=>`<span class="fslog"${l.pl!=null&&G.p[l.pl]?` style="--pc:${G.p[l.pl].color}"`:""}>${l.t?`<time>${clock(l.t)}</time> `:""}${l.fog&&!l.fog.seen[V]&&isEnemy(l.fog.by,V)?l.fog.alt:l.html}</span>`).join("<br>")};
function fsRowMore(){const o=fsOv("fsrowmore");const r=(name,cur,opts)=>`<div class="opts">${opts.map(([v,t])=>`<label class="opt"><input type="radio" name="${name}" value="${v}" ${String(cur)===String(v)?"checked":""}><span>${t}</span></label>`).join("")}</div>`;
  const nums=[[1,"1"],[2,"2"],[3,"3"],[5,"5"]],whos=[["all","Everyone"],["team","My team"],["me","Only mine"]];
  o.innerHTML=`<div class="ovbox fsrmbox" role="dialog" aria-modal="true" aria-labelledby="fsrmh"><button type="button" class="xclose" id="fsrmX" aria-label="Close">×</button><h2 id="fsrmh">The dice and log row</h2>
<p class="clsh">Rolls it shows</p>${r("fsrmDN",fsN("fsDiceN"),nums)}<p class="clsh">Whose rolls</p>${r("fsrmDW",fsWho("fsDiceWho"),whos)}
<p class="clsh">Log lines it shows</p>${r("fsrmLN",fsN("fsLogN"),nums)}<p class="clsh">Whose log lines</p>${r("fsrmLW",fsWho("fsLogWho"),whos)}<p class="dim">The game's own events (the sky, the Bank, the Horde…) always show.</p>
<p class="clsh">Text size</p>${r("fsrmSZ",["s","m","l"].includes(PREF.fsRowSz)?PREF.fsRowSz:"s",[["s","Small"],["m","Medium"],["l","Large"]])}
<p class="acts"><button type="button" class="btn" id="fsrmOk">Done</button></p></div>`;
  o.hidden=false;const close=()=>{o.hidden=true};$("#fsrmX").onclick=$("#fsrmOk").onclick=close;o.onclick=e=>{if(e.target===o)close()};
  const map={fsrmDN:["fsDiceN",Number],fsrmDW:["fsDiceWho",String],fsrmLN:["fsLogN",Number],fsrmLW:["fsLogWho",String],fsrmSZ:["fsRowSz",String]};
  o.querySelectorAll("input[type=radio]").forEach(i=>i.onchange=()=>{const [k,f]=map[i.name];PREF[k]=f(i.value);PREF.fsRowOpen=true;savePrefs();fsPaint()})}
{const _p=fsPaint;fsPaint=function(){_p.apply(this,arguments);if(!G||!fsOn())return;const M=$("#fsrowM");if(M&&!M.querySelector("#fsrowMore")){M.insertAdjacentHTML("beforeend",`<button type="button" class="btn ghost sm" id="fsrowMore">More options…</button>`);
    $("#fsrowMore").onclick=()=>{M.hidden=true;$("#fsrowC").setAttribute("aria-expanded","false");fsRowMore()}}
  const row=$("#fsrow");if(row){row.dataset.sz=["s","m","l"].includes(PREF.fsRowSz)?PREF.fsRowSz:"s";document.documentElement.style.setProperty("--fsrowh",row.offsetHeight+"px")}}}

if(window.__EC)Object.assign(window.__EC,{fsFoesHTML:()=>fsFoesHTML()});

/* ---------------- v74c: Performance Settings; "At a glance" in Basics explained; the sky's cycle as a fraction ----------------
   - The Menu's Particular animations fold is now Performance Settings: the connection (Default, Data saving, Poor
     connection) at its top with a note, then (only with Data saving or Poor connection) "Show the background picture",
     then each animation on its own.
   - "What you must know" is gone as a button: its text is the first fold of Basics explained, "At a glance", which
     glows softly like Basics explained.
   - The sky's text (and its hover in fullscreen) says where its body is in its cycle: the Moon's phase 3/8, a planet's
     round 4/6, your next judgement 2/3 turns, Saturn's tolls 5/9. Neptune waits for its own answer. */
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu"),f=m&&m.querySelector("#mParts");if(!f||f.dataset.perf)return;f.dataset.perf=1;
  const s=f.querySelector(":scope>summary");if(s)s.textContent="Performance Settings";
  const net=m.querySelector("#mNet"),lab=net&&net.closest("label");
  const box=document.createElement("div");box.className="perfnet";if(lab)box.appendChild(lab);
  box.insertAdjacentHTML("beforeend",`<p class="dim">Data saving and Poor connection simply make the game run lighter: they improve performance.</p><label class="farow perfbg"${netLvl()>0?"":" hidden"}><span class="fal"><b>Show the background picture</b><small>Data saving and Poor connection leave it out; this brings it back.</small></span><input type="checkbox" id="mNetBg" ${PREF.netBg?"checked":""}></label><p class="clsh perfh">Animations</p>`);
  if(s)s.after(box);else f.prepend(box);
  $("#mNetBg").onchange=e=>{PREF.netBg=e.target.checked;savePrefs();applyPrefs()};
  if(net)net.addEventListener("change",()=>{const r=f.querySelector(".perfbg");if(r)r.hidden=!(+net.value>0)})}}
{const _ap=applyPrefs;applyPrefs=function(){_ap.apply(this,arguments);document.documentElement.classList.toggle("litebg",!!PREF.netBg)}}
/* What you must know: into Basics explained, first, as "At a glance" */
mountMustKnow=function(){const m=$("#mustknow");if(m)m.remove()};
{const _ih=infoHTML;infoHTML=function(){const h=_ih.apply(this,arguments);
  const gist=`<details class="sub mkgist"><summary>At a glance</summary><p class="mktldr"><b>In short</b> ${MK_TLDR}</p><p class="mkkey">${typeof MK_KEY==="string"?MK_KEY:""}</p><div class="mkbody">${MK_BODY}</div><details class="sub"><summary>Tell me more</summary>${MK_MORE.replace(/<h3>[^<]*<\/h3>/,"").replace(/<p class="mkpoint">[\s\S]*?<\/p>/,"")}</details></details>`;
  return h.replace('<details class="cinfo basics"><summary>Basics explained</summary>',m=>m+gist)}}
{const _ph=paintHelpHead;paintHelpHead=function(){_ph.apply(this,arguments);const l=$("#helpMk");if(l)l.remove()}}
/* the sky's place in its cycle */
function skyFrac(){if(!G||!G.moon)return "";const m=G.moon,k=sky(),V=view(),r=m.round;
  if(!m.gone)return `Phase ${m.i+1}/8`;
  const since=G.skySince!=null&&G.skySince<=r?G.skySince:r,e=r-since,cyc=e>0?`Round ${((e-1)%CYCLE)+1}/${CYCLE} of its cycle`:`Its cycle starts next round (0/${CYCLE})`;
  if(["venus","mercury","mars","jupiter","neptune"].includes(k))return cyc;
  if(k==="sun"){const P=G.p[V];if(!P||P.sunNext==null||P.tribe==="firm")return cyc;const tn=tnOf(V),from=P.sunFrom!=null&&P.sunFrom<P.sunNext?P.sunFrom:P.sunNext-2;return `${cyc} · Your judgement: turn ${Math.max(0,tn-from)}/${P.sunNext-from}`}   // v77c: the Second Sun's cycle too
  if(k==="saturn"){const P=G.p[V];return P&&P.oath==="saturn"?`${cyc} · Your tolls: ${P.satPaid||0}/9`:cyc}   // v77c: and Saturn's
  return ""}
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G)return;const mi=$("#moon .minfo");if(!mi)return;const t=skyFrac();let f=mi.querySelector(".mfrac");
  if(!t){if(f)f.remove();return}if(!f){f=document.createElement("span");f.className="mfrac";const n=mi.querySelector(".mname");if(n)n.after(f);else mi.prepend(f)}f.textContent=t;
  const sv=$("#moon svg.moon");if(sv)sv.setAttribute("aria-label",t)}}
