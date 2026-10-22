/* ---------- v72e: Class Structures (Field Automation) ----------
   A class is a named set of kinds of card with its own Field Automation rules: stance, lives, picking battles, formation,
   attacking or not, ambushes, bases, its own ranking of the principles, its own target priority, a low priority, and the
   classes and kinds it keeps near (cluster). A class works only while it is on, and only while Field Automation is on.
   - Which cards: the kinds ticked in it. A kind can be in one class only, unless "Choose classes on the field" is on: then
     a card follows the first class that holds its kind, unless you put it in another on the field.
   - Mixed stacks: a stack with cards of the class and others plays by the class when the class holds its strongest card,
     its weakest, only a few of its cards, or most of them, as ticked (any one is enough). Otherwise it plays by your own
     settings, and goes back to the class's rules as soon as the stack is right again.
   - Class Exceptions: right-click a stack or a hand card (on a phone, double-tap it), or use the Class line in the Selected
     box, and pick a class. That stack or card plays by the class without its kind joining the class. The class rides on the
     stack's strongest card that isn't of the class's kinds (its head): cards that leave the stack leave the class, the head
     keeps it wherever it goes, even when a stronger card of the class's own kinds leaves. "No class" takes a stack or card
     out of every class until you pick one again.
   - Its look: the class's color fills the bottom-left and top-right corners of its cards, under their accent line, with a
     sheen if you like; only you see it unless you show it to the other players. It can't be your own color, nor too like it
     or another class's (those are greyed out, as in the setup). Hidden under Neptune's eclipse.
   - Every Automated Strategy shares the same classes. */
const CLS_CFG=["noAttack","stance","lives","battles","formation","ambush","ambFocus","bases","hier","order","eq"];
const CLS_STK=["strongest","weakest","minority","majority"];
const clsList=()=>Array.isArray(PREF.faClasses)?PREF.faClasses:(PREF.faClasses=[]);
const clsPalette=()=>COLORS.map(([n,h])=>[n,h]);
function clsClean(list){const ids=new Set();const out=[];
  for(const k of Array.isArray(list)?list.slice(0,12):[]){if(!k||typeof k!=="object"||typeof k.id!=="string"||ids.has(k.id))continue;ids.add(k.id);
    const base=faClean(Object.assign({},k.cfg||{},{mode:"custom"})),cfg={};for(const f of CLS_CFG)cfg[f]=JSON.parse(JSON.stringify(base[f]));
    const st=k.stack||{},tg=k.tg||{},tst=tg.stack||{};
    out.push({id:k.id.slice(0,24),name:String(k.name||"Class").replace(/[<>]/g,"").slice(0,30),on:k.on!==false,kinds:(Array.isArray(k.kinds)?k.kinds:[]).filter(x=>FA_KINDS.includes(x)),
      color:typeof k.color==="string"&&/^#[0-9a-f]{6}$/i.test(k.color)?k.color:null,sheen:!!k.sheen,show:!!k.show,
      stack:Object.fromEntries(CLS_STK.map(x=>[x,st[x]==null?(x==="strongest"||x==="majority"):!!st[x]])),lowPrio:!!k.lowPrio&&!cfg.hier,
      cluster:(Array.isArray(k.cluster)?k.cluster:[]).filter(x=>typeof x==="string"&&x!==k.id).slice(0,24),cfg,
      tg:{on:!!tg.on,order:Array.isArray(tg.order)?[...tg.order.filter(x=>FA_TKEYS.includes(x)),...FA_TKEYS.filter(x=>!tg.order.includes(x))]:[...FA_TKEYS],weak:!!tg.weak,
        stack:Object.fromEntries(CLS_STK.map(x=>[x,tst[x]!==false]))}})}
  return out}
/* the classes go to the game with the field settings (the host plays them) */
{const _sf=setFieldAuto;setFieldAuto=function(pl,on,cfg){if(cfg&&typeof cfg==="object"&&!Array.isArray(cfg.classes)&&G&&pl===view())cfg=Object.assign({},cfg,{classes:clsClean(clsList()),classMulti:PREF.faClassMulti===true});
  return _sf.call(this,pl,on,cfg)}}
function clsResend(){savePrefs();if(G){const V=view(),s=faState(V);if(s)setFieldAuto(V,!!s.on,faMine())}paintFA();if(G)render()}
/* which class a card, or a stack, plays by (in the game: the classes the host holds for that player) */
const plClasses=pl=>{const s=G&&faState(pl);return s&&s.on&&s.cfg&&Array.isArray(s.cfg.classes)?s.cfg.classes:[]};
function clsOfCard(x,list){if(!x||isBase(x))return null;const on=list.filter(k=>k.on);
  if(x.faClass==="none")return null;if(x.faClass){const k=on.find(k=>k.id===x.faClass);if(k)return k}
  const kd=faKind(x);return on.find(k=>k.kinds.includes(kd))||null}
function stackClass(pl,st,list){list=list||plClasses(pl);if(!st||!list.some(k=>k.on))return null;const cards=st.cards.filter(x=>!isBase(x));if(!cards.length)return null;
  if(cards.some(x=>x.faClass==="none"))return null;   // "No class"
  const head=cards.find(x=>x.faClass&&list.some(k=>k.on&&k.id===x.faClass));if(head)return list.find(k=>k.id===head.faClass);   // a Class Exception
  const kd=x=>faKind(x),natural=k=>x=>k.kinds.includes(kd(x));
  const by=[...cards].sort((a,b)=>rate(b)-rate(a)),strong=by[0],weak=by[by.length-1];
  for(const k of list){if(!k.on)continue;const m=cards.filter(natural(k));if(!m.length)continue;if(m.length===cards.length)return k;
    const maj=m.length*2>cards.length,R=k.stack;
    if(R.strongest&&natural(k)(strong)||R.weakest&&natural(k)(weak)||R.minority&&!maj||R.majority&&maj)return k}
  return null}
/* the field plays a class's stacks by the class's rules */
function clsCtx(pl,k){const full=faEff(faState(pl)&&faState(pl).cfg);
  const over=Object.assign({},full,JSON.parse(JSON.stringify(k.cfg)),{mode:"custom",ctl:Object.fromEntries(Object.keys(FA_DEF.ctl).map(x=>[x,true])),extra:[],xminus:[]});delete over.classes;   // it plays all of its stacks
  if(k.tg.on)Object.assign(over,{tprio:true,tgroup:false,torder:[...k.tg.order],teq:[],tIgnoreGI:false,tSameGI:false,tWeak:k.tg.weak,tStk:Object.assign({},k.tg.stack)});
  FA_OVR={pl,cfg:faClean(over)};let cx;try{cx=faCtx(pl)}finally{FA_OVR=null}
  cx=Object.assign({pl},cx,{lowPrio:k.lowPrio&&!k.cfg.hier,clsId:k.id});
  if(k.cluster.length){const ids=new Set(k.cluster);
    cx.extraPull=(S,r,c,walk)=>{const mine=new Set(S.cards.map(x=>x.id));let d=99;
      for(const x of stacksOf(pl)){if(x.st.cards.some(y=>mine.has(y.id)))continue;const sk=stackClass(pl,x.st);if(!(sk&&ids.has(sk.id))&&!x.st.cards.some(y=>ids.has(faKind(y))))continue;d=Math.min(d,walk(r,c,x.r,x.c))}
      return d===99?0:.35*Math.min(d,6)}}
  return cx}
{const _fc=faCtx;faCtx=function(pl){const ctx=_fc.apply(this,arguments);if(FA_OVR)return ctx;
  const list=plClasses(pl);if(!list.some(k=>k.on))return ctx;const cache={};
  ctx.clsOf=st=>{const k=stackClass(pl,st,list);return k?cache[k.id]||(cache[k.id]=clsCtx(pl,k)):null};
  return ctx}}
/* target priority (yours and each class's): the weakest or strongest Grunts and Infantry first, and which stacks it goes for */
{const _tf=faTargetFactor;faTargetFactor=function(cfg){const f=_tf.apply(this,arguments);if(!cfg||!cfg.tprio)return f;const S=cfg.tStk||FA_DEF.tStk;
  return E=>{const v=f(E),cards=E.cards;if(!cards.length)return v;
    const each=cards.map(x=>f({cards:[x],owner:E.owner})),top=Math.max(...each),hunted=cards.filter((x,i)=>each[i]>=top-1e-9);
    const by=[...cards].sort((a,b)=>rate(b)-rate(a)),maj=hunted.length*2>cards.length;
    if(!(S.strongest&&hunted.includes(by[0])||S.weakest&&hunted.includes(by[by.length-1])||S.minority&&!maj||S.majority&&maj))return Math.min(v,1);   // not a stack it hunts for that
    const gi=hunted.filter(x=>!x.unit&&!x.puppet&&(kind(x)==="grunt"||kind(x)==="infantry"));if(!gi.length)return v;
    const n=Math.max(0,Math.min(1,(gi.reduce((a,x)=>a+rate(x),0)/gi.length-8)/10));return v*(cfg.tWeak?1.15-.3*n:.85+.3*n)}}}

/* ---------- Class Exceptions: right-click (or double-tap), or the Selected box ---------- */
function setCardClass(pl,ids,head,val){if(!G||!G.p[pl]||NET.ctx!=null&&NET.ctx!==pl||!Array.isArray(ids))return false;const P=G.p[pl];
  const mine=id=>{for(const r of G.board)for(const s of r)if(s&&s.owner===pl){const x=s.cards.find(y=>y.id===id);if(x)return x}return P.hand.find(y=>y.id===id)||null};
  for(const id of ids){const x=mine(id);if(x&&!isBase(x))delete x.faClass}
  const h=mine(head);if(h&&!isBase(h)&&(val==="none"||typeof val==="string"&&val))h.faClass=val;render();return true}
for(const [name,get,set] of [["setCardClass",()=>setCardClass,f=>setCardClass=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}
const clsReady=()=>{if(!G||G.over)return false;const V=view();return !!G.p[V]&&faOn(V)&&plClasses(V).length>0};
/* the head of a stack for a class: its strongest card that isn't of the class's kinds (else its strongest) */
function clsHead(st,k){const cards=st.cards.filter(x=>!isBase(x)).sort((a,b)=>rate(b)-rate(a));if(!k)return cards[0];return cards.find(x=>!k.kinds.includes(faKind(x)))||cards[0]}
function clsChoose(target,val){const V=view(),list=plClasses(V);
  if(target.card){setCardClass(V,[target.card.id],target.card.id,val);return}
  const st=target.st;if(!st)return;const k=list.find(x=>x.id===val)||null,h=clsHead(st,k);if(!h)return;
  setCardClass(V,st.cards.filter(x=>!isBase(x)).map(x=>x.id),h.id,val)}
function clsMenu(target,x,y){const V=view(),list=plClasses(V);let m=$("#clsmenu");if(!m){m=document.createElement("div");m.id="clsmenu";m.setAttribute("role","menu");document.body.appendChild(m)}
  const cur=target.card?target.card.faClass:(target.st.cards.find(c=>c.faClass)||{}).faClass;
  m.innerHTML=`<p class="clsmh">${target.card?"This card's class":"This stack's class"}</p><button type="button" role="menuitem" data-clm="none" class="${cur==="none"?"on":""}">No class</button>${list.map(k=>`<button type="button" role="menuitem" data-clm="${esc(k.id)}" class="${cur===k.id?"on":""}${k.on?"":" off"}"><i style="--clb:${k.color||"#888"}"></i>${esc(k.name)}${k.on?"":" <small>(off)</small>"}</button>`).join("")}<button type="button" role="menuitem" data-clm="" class="clsclear">As its kind says</button>`;
  m.hidden=false;const w=m.offsetWidth||180,h=m.offsetHeight||200;m.style.left=Math.max(6,Math.min(innerWidth-w-6,x))+scrollX+"px";m.style.top=Math.max(6,Math.min(innerHeight-h-6,y))+scrollY+"px";
  m.querySelectorAll("[data-clm]").forEach(b=>b.onclick=()=>{m.hidden=true;clsChoose(target,b.dataset.clm||null)});
  const f=m.querySelector("button");if(f)f.focus({preventScroll:true})}
document.addEventListener("pointerdown",e=>{const m=$("#clsmenu");if(m&&!m.hidden&&!m.contains(e.target))m.hidden=true},true);
document.addEventListener("keydown",e=>{const m=$("#clsmenu");if(e.key==="Escape"&&m&&!m.hidden)m.hidden=true});
function clsTargetAt(e){if(!clsReady())return null;const V=view();
  const t=e.target.closest&&e.target.closest("#board .tile");if(t){const st=G.board[+t.dataset.r]&&G.board[+t.dataset.r][+t.dataset.c];if(st&&st.owner===V&&st.cards.some(x=>!isBase(x)))return {st}}
  const h=e.target.closest&&e.target.closest("#hand [data-h]");if(h){const c=G.p[V].hand[+h.dataset.h];if(c&&!isBase(c))return {card:c}}
  return null}
document.addEventListener("contextmenu",e=>{const t=clsTargetAt(e);if(!t)return;e.preventDefault();clsMenu(t,e.clientX,e.clientY)});
/* a phone: a quick double-tap on the same stack or card */
let clsTap=null;
document.addEventListener("pointerup",e=>{if(e.pointerType!=="touch")return;const t=clsTargetAt(e);if(!t){clsTap=null;return}
  const key=t.card?"h"+t.card.id:"s"+t.st.cards[0].id,now=performance.now();
  if(clsTap&&clsTap.key===key&&now-clsTap.t<350){clsTap=null;setTimeout(()=>clsMenu(t,e.clientX,e.clientY),0)}else clsTap={key,t:now}});
/* the Selected box: a Class line for your stack, or for the hand card you picked */
{const _rs=renderSel;renderSel=function(){_rs.apply(this,arguments);if(!clsReady())return;const V=view(),box=$("#selbox");if(!box)return;
  let target=null;if(G.selHand&&G.p[V].hand.includes(G.selHand)&&!isBase(G.selHand))target={card:G.selHand};
  else if(G.sel){const st=G.board[G.sel.r]&&G.board[G.sel.r][G.sel.c];if(st&&st.owner===V&&st.cards.some(x=>!isBase(x)))target={st}}
  if(!target)return;const list=plClasses(V),now=target.card?clsOfCard(target.card,list):stackClass(V,target.st,list);
  box.insertAdjacentHTML("beforeend",`<p class="clsrow"><span class="dim">Class:</span> <b>${now?esc(now.name):"none"}</b> <button type="button" class="btn sm ghost" id="clsPick">Choose…</button></p>`);
  $("#clsPick").onclick=e=>{const r=e.target.getBoundingClientRect();clsMenu(target,r.left,r.bottom+4)}}}

/* ---------- the look: the class's color in two corners (only for you, unless shown) ---------- */
function clsLook(owner,k){if(!k||!k.color||!G)return null;const V=view();if(nepEcState&&nepEcState(V))return null;if(owner!==V&&!k.show)return null;return k}
const clsAttr=(h,k)=>h.replace(/class="(cf|stack) /,`class="$1 clsmark${k.sheen?" clsheen":""} `).replace(/style="/,`style="--clb:${cbMap(k.color)};`);
{const _f=face;face=function(c,o={}){const h=_f.apply(this,arguments);if(!G||!c||isBase(c))return h;const own=o.owner!==undefined?o.owner:c.owner;if(own==null)return h;
  const k=clsLook(own,clsOfCard(c,plClasses(own)));return k?clsAttr(h,k):h}}
{const _sd=siegeDecor;siegeDecor=function(inner,st){const h=_sd.apply(this,arguments);if(!st||!G)return h;const k=clsLook(st.owner,stackClass(st.owner,st));if(!k)return h;
  return h.replace(/(<div class="stack)([^"]*")( style=")/,(m,a,b,c)=>`${a} clsmark${k.sheen?" clsheen":""}${b}${c}--clb:${cbMap(k.color)};`)}}

/* ---------- the settings: Class Structures, above the Automated Strategies ---------- */
let clsUI={open:null,del:null};
const clsTaken=(id,kd)=>clsList().find(k=>k.id!==id&&k.kinds.includes(kd));
function clsRank(id,order,key,label){return `<ol class="clsrank">${order.map((x,i)=>`<li><span>${i+1}. ${esc(label(x))}</span><span><button type="button" class="btn ghost sm" data-clact="${id}|${key}up|${x}" ${i?"":"disabled"} aria-label="Higher">▲</button><button type="button" class="btn ghost sm" data-clact="${id}|${key}down|${x}" ${i<order.length-1?"":"disabled"} aria-label="Lower">▼</button></span></li>`).join("")}</ol>`}
function clsHTML(pfx){const L=clsList(),V=G?view():null,mine=V!=null&&G&&G.p[V]?G.p[V].color:null,multi=PREF.faClassMulti===true;
  const K=cfgKit("data-cl","data-clact","cl"+pfx),{row,radio}=K;
  const one=k=>{const id=k.id,c=k.cfg,o=clsUI.open===id;const near=hex=>mine&&colorNear(hex,mine)||hex===mine||L.some(x=>x.id!==id&&x.color&&(x.color===hex||colorNear(x.color,hex)));
    return `<details class="clsone" data-clid="${id}" ${o?"open":""}><summary><i class="clsdot" style="--clb:${k.color||"#888"}"></i><b>${esc(k.name)}</b> <small class="dim">${k.kinds.length?k.kinds.map(x=>esc(shortInfo(x))).join(", "):"no cards yet"}${k.on?"":" · off"}</small></summary>
${row(`${id}|on`,k.on,"Class on","Its rules play its cards by themselves (while Field Automation is on).")}
<label class="f clsname">Name <input type="text" maxlength="30" data-cl="${id}|name" value="${esc(k.name)}"></label>
<p class="clsh">Its cards</p><div class="opts fakinds">${FA_KINDS.map(kd=>{const t=clsTaken(id,kd),dis=!!t&&!multi&&!k.kinds.includes(kd);return `<label class="opt${dis?" off":""}" ${t&&!k.kinds.includes(kd)?`title="In ${esc(t.name)}"`:""}><input type="checkbox" data-cl="${id}|kind:${kd}" ${k.kinds.includes(kd)?"checked":""} ${dis?"disabled":""}><span>${esc(shortInfo(kd))}</span></label>`}).join("")}</div>
<p class="clsh">A stack mixing its cards with others plays by it when its cards are…</p>${row(`${id}|stack:strongest`,k.stack.strongest,"…the stack's strongest card","")}${row(`${id}|stack:weakest`,k.stack.weakest,"…the stack's weakest card","")}${row(`${id}|stack:minority`,k.stack.minority,"…only a few of its cards","Not the most of them.")}${row(`${id}|stack:majority`,k.stack.majority,"…most of its cards","")}
<p class="clsh">Stance</p>${radio(`${id}|stance`,c.stance,[["auto","Automatic",""],["offensive","Offensive",""],["defensive","Defensive",""],["center","Center",""],["skirmish","Skirmish",""]])}
<p class="clsh">Lives</p>${radio(`${id}|lives`,c.lives,[["preserve","Preserve",""],["balanced","Balanced",""],["throw","Throw them in",""]])}
<p class="clsh">Picking battles</p>${radio(`${id}|battles`,c.battles,[["careful","Careful",""],["normal","Normal",""],["reckless","Reckless",""]])}
<p class="clsh">Formation</p>${radio(`${id}|formation`,c.formation,[["auto","Automatic",""],["wide","Wide",""],["deep","Tall",""]])}
${row(`${id}|noAttack`,c.noAttack,"Don't attack","")}${row(`${id}|ambush`,c.ambush,"Set ambushes","")}${c.ambush?row(`${id}|ambFocus`,c.ambFocus,"Focus on ambush",""):""}${row(`${id}|bases`,c.bases,"Target bases","")}
${row(`${id}|hier`,c.hier,"Rank the principles","Its own order of the principles.")}${c.hier?clsRank(id,c.order,"h",x=>(FA_PRINC.find(p=>p[0]===x)||[x,x])[1]):""}
${row(`${id}|lowPrio`,k.lowPrio&&!c.hier,"Low priority","It moves and strikes after your other stacks. Not while it ranks the principles.",c.hier)}
<p class="clsh">Keeps near (cluster)</p><div class="opts fakinds">${[...L.filter(x=>x.id!==id).map(x=>[x.id,x.name]),...FA_KINDS.map(x=>[x,shortInfo(x)])].map(([v,t])=>`<label class="opt"><input type="checkbox" data-cl="${id}|cl:${esc(v)}" ${k.cluster.includes(v)?"checked":""}><span>${esc(t)}</span></label>`).join("")}</div>
<details class="faextra"><summary>Target priority for this class <small class="dim">(${k.tg.on?"on":"off: your own"})</small></summary>${row(`${id}|tg:on`,k.tg.on,"Its own target priority","")}${k.tg.on?clsRank(id,k.tg.order,"t",x=>FA_TK.find(p=>p[0]===x)[1])+row(`${id}|tg:weak`,k.tg.weak,"Weakest Grunts and Infantry first","Off: the strongest of them first.")+
  `<p class="dim">Go for a stack because of the kind it hunts when that kind is…</p>`+row(`${id}|tgs:strongest`,k.tg.stack.strongest,"…its strongest card","")+row(`${id}|tgs:weakest`,k.tg.stack.weakest,"…its weakest card","")+row(`${id}|tgs:minority`,k.tg.stack.minority,"…only a few of its cards","")+row(`${id}|tgs:majority`,k.tg.stack.majority,"…most of its cards",""):""}</details>
<p class="clsh">Its look (only you see it unless shown)</p><div class="opts swatches clssw">${clsPalette().map(([nm,hex])=>{const n=near(hex)&&k.color!==hex;return `<label class="sw${n?" off":""}" title="${esc(nm)}${n?" (too like your color or another class's)":""}"><input type="radio" name="clc${pfx}${id}" data-cl="${id}|color" value="${hex}" ${k.color===hex?"checked":""} ${n?"disabled":""}><span style="--pc:${hex}"></span><em>${esc(nm)}</em></label>`}).join("")}</div>
${row(`${id}|sheen`,k.sheen,"Sheen on its corners","")}${row(`${id}|show`,k.show,"Show the other players its look","")}
<p class="clsacts">${clsUI.del===id?`Delete ${esc(k.name)}? <button type="button" class="btn sm" data-clact="${id}|delok">Delete</button> <button type="button" class="btn ghost sm" data-clact="${id}|delno">Keep it</button>`:`<button type="button" class="btn ghost sm" data-clact="${id}|del">Delete this class</button>`}</p></details>`};
  return `<section class="fasec fafull facls"><h4>Class Structures</h4><details class="faextra clsfold" ${PREF.clsOpen||clsUI.open?"open":""}><summary>Your classes <small class="dim">(${L.length})</small></summary>
${row("multi",multi,"Choose classes on the field","Needed for one kind of card to be in more than one class: a card then follows the first class that holds it, unless you put it in another on the field.")}
<p class="dim">To put one stack or hand card in a class on its own (a Class Exception), right-click it while Field Automation is on (on a phone, double-tap it), or use the Class line in the Selected box. Every Automated Strategy shares these classes.</p>
${L.map(one).join("")}<p><button type="button" class="btn ghost sm" data-clact="|new">+ New class</button></p></details></section>`}
{const _fp=faPanelHTML;faPanelHTML=function(c,pl,pfx){const h=_fp.apply(this,arguments),i=h.indexOf('<section class="fasec fafull fastrat"');const add=clsHTML(pfx||"");return i<0?h+add:h.slice(0,i)+add+h.slice(i)}}
function clsWire(root){const L=clsList(),find=id=>L.find(k=>k.id===id);
  const fold=root.querySelector(".clsfold");if(fold)fold.addEventListener("toggle",()=>{PREF.clsOpen=fold.open;savePrefs()});
  root.querySelectorAll("details.clsone").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)clsUI.open=d.dataset.clid;else if(clsUI.open===d.dataset.clid)clsUI.open=null}));
  root.querySelectorAll("[data-cl]").forEach(i=>{const [id,key]=i.dataset.cl.split("|");const ev=i.type==="text"?"change":"change";i.addEventListener(ev,()=>{
    if(id==="multi"){PREF.faClassMulti=i.checked;clsResend();return}
    const k=find(id);if(!k)return;clsUI.open=id;
    if(key==="name")k.name=String(i.value||"").replace(/[<>]/g,"").slice(0,30)||k.name;
    else if(key==="on"||key==="sheen"||key==="show"||key==="lowPrio")k[key]=i.checked;
    else if(key==="color"){if(i.checked)k.color=i.value}
    else if(key.startsWith("kind:")){const kd=key.slice(5);k.kinds=i.checked?[...new Set([...k.kinds,kd])]:k.kinds.filter(x=>x!==kd)}
    else if(key.startsWith("stack:"))k.stack[key.slice(6)]=i.checked;
    else if(key.startsWith("cl:")){const v=key.slice(3);k.cluster=i.checked?[...new Set([...k.cluster,v])]:k.cluster.filter(x=>x!==v)}
    else if(key==="tg:on"||key==="tg:weak")k.tg[key.slice(3)]=i.checked;
    else if(key.startsWith("tgs:"))k.tg.stack[key.slice(4)]=i.checked;
    else if(CLS_CFG.includes(key))k.cfg[key]=i.type==="checkbox"?i.checked:i.value;
    if(k.cfg.hier)k.lowPrio=false;PREF.faClasses=clsClean(L);clsResend()})});
  root.querySelectorAll("[data-clact]").forEach(b=>b.onclick=()=>{const [id,a,x]=b.dataset.clact.split("|");
    if(a==="new"){const mine=G&&G.p[view()]?G.p[view()].color:null,used=L.map(k=>k.color);const col=(clsPalette().find(([,h])=>h!==mine&&!(mine&&colorNear(h,mine))&&!used.some(u=>u===h||colorNear(u,h)))||clsPalette()[0])[1];
      const base=faMine(),cfg={};for(const f of CLS_CFG)cfg[f]=JSON.parse(JSON.stringify(base[f]));const k={id:"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:`Class ${L.length+1}`,on:true,kinds:[],color:col,cfg};
      PREF.faClasses=clsClean([...L,k]);clsUI.open=k.id;PREF.clsOpen=true;clsResend();return}
    const k=find(id);if(!k)return;clsUI.open=id;
    if(a==="del"){clsUI.del=id;paintFA();return}if(a==="delno"){clsUI.del=null;paintFA();return}
    if(a==="delok"){clsUI.del=null;PREF.faClasses=clsClean(L.filter(y=>y.id!==id));clsResend();return}
    const mv=(arr,dir)=>{const i=arr.indexOf(x),j=i+dir;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]]};
    if(a==="hup"||a==="hdown")mv(k.cfg.order,a==="hup"?-1:1);if(a==="tup"||a==="tdown")mv(k.tg.order,a==="tup"?-1:1);
    PREF.faClasses=clsClean(L);clsResend()})}
{const _fw=faWire;faWire=function(root){_fw.apply(this,arguments);if(root.querySelector(".facls"))clsWire(root)}}

if(window.__EC)Object.assign(window.__EC,{clsSetW:list=>{PREF.faClasses=clsClean(list);clsResend()},faCtxW3:pl=>faCtx(pl),clsList:()=>clsList(),stackClass:(...a)=>stackClass(...a),setCardClass:(...a)=>setCardClass(...a),clsOfCard:(...a)=>clsOfCard(...a),plClasses:pl=>plClasses(pl)});
