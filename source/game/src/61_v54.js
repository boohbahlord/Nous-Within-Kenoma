/* ---------------- v54: Grave automation, and rankings by kinds of card ----------------
   - A fourth tab in Configure Automation, Grave: when a spell or the moon lets you raise cards from the grave, it picks them
     for you. Which kinds it takes (with a Yes-and list for single kinds), and in what order (a ranking). When nothing in the
     grave matches, it can ask you instead, or stop.
   - Every ranking of kinds starts grouped (Special, Base, Standard, Support, Wildcard) and can be split into single kinds
     (the King, the 7…) by switching "Rank by kinds of card" off. Suits never count. */

/* ---------- a plain ranking: one row per entry, ▲ and ▼ ---------- */
function kindRankHTML(order,attr,names){
  return `<ol class="krank">${order.map((k,i)=>`<li><span class="farank">${i+1}</span><b>${esc(names[k]||k)}</b><span class="facolbtns"><button type="button" class="btn ghost sm" ${attr}="up:${k}" aria-label="Higher" ${i?"":"disabled"}>▲</button><button type="button" class="btn ghost sm" ${attr}="down:${k}" aria-label="Lower" ${i<order.length-1?"":"disabled"}>▼</button></span></li>`).join("")}</ol>`}
const rankMove=(order,v)=>{const [a,k]=v.split(":"),o=[...order],i=o.indexOf(k),j=a==="up"?i-1:i+1;if(i<0||j<0||j>=o.length)return o;[o[i],o[j]]=[o[j],o[i]];return o};

/* ---------- the field's target ranking, by kinds ---------- */
const TGROUP={wildcards:"wildcard",joker:"special",king:"special",queen:"special",jack:"special",assassin:"special",ace:"base",wall:"base",tree:"base",
  cannon:"standard",archer:"standard",infantry:"standard",grunt:"standard",puppet:"standard",healer:"support",repair:"support",ram:"support",miner:"support",claimer:"support",scout:"support"};
const TGROUP_NAMES={wildcard:"Wildcards",special:"Special",base:"Base",standard:"Standard",support:"Support"};
{const _tf=faTargetFactor;faTargetFactor=function(cfg){if(!cfg.tprio||!cfg.tgroup)return _tf(cfg);
  const go=cfg.tgorder,N=Math.max(1,go.length-1);
  return E=>{const best=Math.min(...E.cards.map(x=>{const i=go.indexOf(TGROUP[faTKind(x,cfg)]||"standard");return i<0?go.length:i}));return Math.max(.2,1.6-1.2*best/N)}}}
{const _fw=faWire;faWire=function(root){_fw(root);
  root.querySelectorAll("[data-tgact]").forEach(b=>b.onclick=()=>{const c=faMine();c.tgorder=rankMove(c.tgorder,b.dataset.tgact);faSave(c)})}}

/* ---------- Grave automation: the settings ---------- */
const GR_GROUPS=["special","base","standard","support","wildcard"];
const GR_DEF={on:false,kinds:[],extra:[],minus:[],rank:true,group:true,gorder:[...GR_GROUPS],korder:[],strong:true,askNone:true};
const grKeys=()=>{const k=lhKeyList().map(x=>x[0]),r=["JK","A","K","Q","J","10","9","8","7","6","5","4","3","2"];return [...r.filter(x=>k.includes(x)),...k.filter(x=>!r.includes(x))]};   // strongest first
function grClean(c){c=c&&typeof c==="object"?c:{};const o=JSON.parse(JSON.stringify(GR_DEF)),cats=new Set(RD_KINDS.map(x=>x[0])),keys=grKeys();
  for(const k of ["on","rank","group","strong","askNone"])if(typeof c[k]==="boolean")o[k]=c[k];
  if(Array.isArray(c.kinds))o.kinds=c.kinds.filter(k=>cats.has(k));
  for(const k of ["extra","minus"])if(Array.isArray(c[k]))o[k]=c[k].filter(x=>keys.includes(x));o.minus=o.minus.filter(x=>!o.extra.includes(x));
  if(Array.isArray(c.gorder))o.gorder=[...c.gorder.filter(k=>GR_GROUPS.includes(k)),...GR_GROUPS.filter(k=>!c.gorder.includes(k))];
  o.korder=[...(Array.isArray(c.korder)?c.korder.filter(k=>keys.includes(k)):[]),...keys.filter(k=>!(c.korder||[]).includes(k))];
  return o}
const grMine=()=>grClean(PREF.gr);
function grSave(c){PREF.gr=grClean(c);savePrefs();autoSync();paintFA();if(G)render()}
/* the seat carries the settings, so the host can pick for a player online */
{const _sc=setAutoCfg;setAutoCfg=function(pl,key,cfg){if(key!=="grCfg")return _sc.apply(this,arguments);
  if(NET.role==="guest"){const rid=++NET.rid;sendHost({t:"cmd",fn:"setAutoCfg",args:netClean([pl,key,cfg]),ui:uiSnap(),rid});return}
  if(G&&G.p[pl])G.p[pl].grCfg=grClean(cfg)}}
{const _as=autoSync;autoSync=function(){_as.apply(this,arguments);if(!G||G.over)return;const V=view(),P=G.p[V];if(!P||P.cpu||isNPC(V))return;
  const cfg=grMine(),j=JSON.stringify(cfg),k=V+"grCfg";if(autoSent[k]===j&&(NET.role==="guest"||JSON.stringify(P.grCfg)===j))return;autoSent[k]=j;setAutoCfg(V,"grCfg",cfg)}}

/* ---------- Grave automation: the choice ---------- */
function grWants(c,cfg){const k=cardKey(c);if(cfg.minus.includes(k))return false;if(cfg.extra.includes(k))return true;return !cfg.kinds.length&&!cfg.extra.length||cfg.kinds.includes(cardCat(c))}
function grRank(c,cfg){return !cfg.rank?0:cfg.group?cfg.gorder.indexOf(cardCat(c)):cfg.korder.indexOf(cardKey(c))}
function grPick(cards,cfg){let best=-1,bv=null;cards.forEach((c,i)=>{if(!grWants(c,cfg))return;const v=[grRank(c,cfg),cfg.strong?-(soulOf(c)*10+(costOf(c)||0)):0];
  if(!bv||v[0]<bv[0]||v[0]===bv[0]&&v[1]<bv[1]){bv=v;best=i}});return best}
{const _ask=ask;ask=async function(pl,spec){const P=G&&G.p[pl],cfg=P&&!P.cpu&&P.grCfg;
  if(spec&&spec.id==="grave"&&cfg&&cfg.on&&Array.isArray(spec.cards)){const i=grPick(spec.cards,cfg);
    if(i>=0){await sleep(250);return i}
    if(!cfg.askNone){log(`Grave automation: nothing in the grave matches ${plName(pl)}'s settings.`);return null}}
  return _ask.apply(this,arguments)}}

/* ---------- Grave automation: the tab ---------- */
AUTO_TABS.push(["grave","Grave"]);
{const _st=autoStatus;autoStatus=function(k){if(k==="grave")return grMine().on?"On":"Off";return _st(k)}}
{const _am=autoMasterHTML;autoMasterHTML=function(){if(autoTab!=="grave")return _am();const on=grMine().on;
  return `<p class="fafull automaster"><button type="button" class="btn sm ${on?"":"ghost"}" data-amaster="grave" aria-pressed="${on}">Grave automation: ${on?"On":"Off"}</button><span class="dim">Picks the cards raised from the grave, as set below.</span></p>`}}
{const _ab=autoBodyHTML;autoBodyHTML=function(pfx,under){if(autoTab!=="grave")return _ab.apply(this,arguments);return autoMasterHTML()+grPanelHTML(grMine(),pfx)}}
function grPanelHTML(c,pfx){const K=cfgKit("data-gr","data-gract","gr"+pfx),{row,sec}=K,off=!c.on;
  const names=Object.fromEntries([...RD_KINDS.map(([k,t])=>[k,t]),...lhKeyList()]);
  let h=`<p class="dim fafull">Grave Blessing, the New Moon and every other raising from the grave: it picks the cards for you, best first, until the hand is full or the raising is done.</p>`;
  h+=sec("Which cards",K.chips(RD_KINDS,c.kinds,"data-grkind",off)+`<p class="dim">None ticked: any card.</p><details class="faextra"><summary>Yes, and… (single kinds: + always taken, − never taken)</summary>${K.pmChips(lhKeyList(),c.extra,c.minus,"data-grpm",off)}</details>`,"fafull");
  /* v59: the ranking folds like the Field's: ▸ closed is off (only "the strongest first" decides), ▾ open is on */
  h+=sec("In what order",`<details class="faextra fadet" data-grdet="rank" ${c.rank?"open":""}><summary>Rank the kinds of card <small class="dim">(${c.rank?"on":"off: the strongest first decides"})</small></summary>`+
    row("group",c.group,"Rank by kinds of card","On: Special, Base, Standard and so on. Off: every single kind, like the King.",off)+
    (c.group?kindRankHTML(c.gorder,"data-grg",names):kindRankHTML(c.korder,"data-grk",names))+`<p class="dim">The kinds at the top are raised first.</p></details>`+
    row("strong",c.strong,"The strongest first","Within the same rank, the card worth the most.",off),"fafull");
  h+=sec("When nothing matches",row("askNone",c.askNone,"Ask which card to raise","Off: nothing is raised.",off),"fafull");
  return h}
{const _wa=wireAuto;wireAuto=function(root){_wa(root);
  root.querySelectorAll("[data-grdet]").forEach(d=>d.addEventListener("toggle",()=>{const c=grMine(),k=d.dataset.grdet;if(!!c[k]===d.open)return;c[k]=d.open;grSave(c)}));
  root.querySelectorAll('[data-amaster="grave"]').forEach(b=>b.onclick=()=>{const c=grMine();c.on=!c.on;grSave(c)});
  root.querySelectorAll("[data-gr]").forEach(i=>{const k=i.dataset.gr;if(!k)return;i.onchange=()=>{const c=grMine();c[k]=i.checked;grSave(c)}});
  root.querySelectorAll("[data-grkind]").forEach(i=>i.onchange=()=>{const c=grMine(),k=i.dataset.grkind;c.kinds=c.kinds.filter(x=>x!==k);if(i.checked)c.kinds.push(k);grSave(c)});
  root.querySelectorAll("[data-grpm]").forEach(b=>b.onclick=()=>{const c=grMine(),[p,m]=pmCycle(c.extra,c.minus,b.dataset.grpm);c.extra=p;c.minus=m;grSave(c)});
  root.querySelectorAll("[data-grg]").forEach(b=>b.onclick=()=>{const c=grMine();c.gorder=rankMove(c.gorder,b.dataset.grg);grSave(c)});
  root.querySelectorAll("[data-grk]").forEach(b=>b.onclick=()=>{const c=grMine();c.korder=rankMove(c.korder,b.dataset.grk);grSave(c)})}}

if(window.__EC)Object.assign(window.__EC,{grMine,grClean,grPick,faWindow:t=>faWindow(t),ask:(...a)=>ask(...a),pickGrave:(...a)=>pickGrave(...a)});
