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
    return `<div class="fsfoe${P.out?" out":""}${act?" act":""}" style="--pc:${P.color}" title="${esc(P.name)}${P.cpu&&P.cpu!=="horde"?" · computer, "+P.cpu:""}">
<span class="fsfn">${solidSVG(P.solid,P.color,13)}<b>${esc(P.name)}</b>${!isEnemy(P.i,V)?'<i class="fsally">ally</i>':""}${P.out?'<i class="fsout">out</i>':act?'<i class="fsact">▸</i>':""}</span>
${P.cpu==="horde"?"":`<span class="fsfm" title="Deck ${q||n}"><span class="fsfbar"><i style="width:${q?50:pct(Math.min(n,N)/N)}%"></i></span><em>${q||n}</em></span>
<span class="fsfm mana" title="Mana ${q||m}/${q||cap}"><span class="fsfbar"><i style="width:${q?50:pct(Math.max(0,m)/Math.max(1,cap))}%"></i></span><em>${q?"?/?":`${m}/${cap}`}</em></span>
<span class="fsfh" title="Hand">✋${P.hand.length}</span>`}</div>`}).join("")}
{const _r=render;render=function(){_r.apply(this,arguments);if(!G||!fsOn())return;const f=$("#foe");if(f)f.innerHTML=fsFoesHTML()}}

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
