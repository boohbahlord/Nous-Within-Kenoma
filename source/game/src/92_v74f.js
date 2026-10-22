/* ---------- v74f: Field Automation: classes that avoid stacking, Soft Automate, Full by default ----------
   - A class can avoid stacking: Field Automation keeps its cards out of stacks with other cards, except those ticked in its
     "Can still stack with" fold (its own cards, cards in no class, or other classes). It holds both ways: no card is moved
     onto a stack that holds a card whose class bars it, nor the other way round. Your own moves are never stopped.
   - What it automates, at the top of Field Automation: Full field automation (the default) or Soft Automate. Soft Automate
     plays only the cards you mark: right-click a stack of yours (or a card in your hand), or double-tap it on a phone, and pick
     Automate stack; the Selected box has the same switch. A marked card stays automated wherever it goes, even after it
     splits off into another stack; marked stacks and hand cards look slightly see-through, for you only.
   - It acts only at the end of each phase of your turn (moves when you end prep, attacks when you end the attack phase), so
     you can act with the cards yourself first; the note says so. */
const FA_WHEN="Automated actions take place only at the end of each phase of your turn, every round: it moves when you end your prep phase and attacks when you end your attack phase. Until then you can act with these cards yourself.";
/* ---- a class that avoids stacking ---- */
{const _cc=clsClean;clsClean=function(list){const out=_cc.apply(this,arguments),src=Array.isArray(list)?list:[];
  for(const k of out){const s=src.find(x=>x&&typeof x.id==="string"&&x.id.slice(0,24)===k.id)||{};k.avoid=!!s.avoid;
    k.stackWith=[...new Set((Array.isArray(s.stackWith)?s.stackWith:[]).filter(v=>typeof v==="string").map(v=>v.slice(0,24)))].slice(0,24)}
  return out}}
if(Array.isArray(PREF.faClasses)&&PREF.faClasses.some(k=>k&&!Array.isArray(k.stackWith))){PREF.faClasses=clsClean(PREF.faClasses);savePrefs()}   // classes saved before v74f get the new fields
const clsSW=k=>Array.isArray(k&&k.stackWith)?k.stackWith:[];   // a class saved before v74f has no list: it stacks with no one
const clsBars=(k,o)=>!!k&&!!k.avoid&&!(o===k?clsSW(k).includes("self"):o?clsSW(k).includes(o.id):clsSW(k).includes("none"));
function clsNoStack(list,grp,t){const there=t.cards.filter(x=>!isBase(x));if(!there.length)return false;
  const a=grp.filter(x=>!isBase(x)).map(x=>clsOfCard(x,list)),b=there.map(x=>clsOfCard(x,list));
  return a.some(ka=>b.some(kb=>clsBars(ka,kb)||clsBars(kb,ka)))}
{const _fc=faCtx;faCtx=function(pl){const ctx=_fc.apply(this,arguments);const list=plClasses(pl);if(!list.some(k=>k.on&&k.avoid))return ctx;
  ctx.noStack=(grp,t)=>clsNoStack(list,grp,t);return ctx}}
let clsAvw=null;
function clsAvoidHTML(k,L,pfx){const K=cfgKit("data-clv","data-clvact","clv"+pfx),opts=[["self","Its own cards"],["none","Cards in no class"],...L.filter(x=>x.id!==k.id).map(x=>[x.id,x.name])];
  const sw=clsSW(k),names=opts.filter(([v])=>sw.includes(v)).map(([,t])=>t),open=clsAvw===k.id||clsWasOpen(`[data-clavw="${k.id}"]`);
  return K.row(`${k.id}|avoid`,k.avoid,"Avoid stacking","Field Automation keeps its cards out of stacks with other cards, except the ones ticked below. Your own moves aren't stopped.")+
    (k.avoid?`<details class="faextra clsavw" data-clavw="${k.id}" ${open?"open":""}><summary>Can still stack with <small class="dim">(${names.length?esc(names.join(", ")):"no one"})</small></summary><div class="opts fakinds">${opts.map(([v,t])=>`<label class="opt"><input type="checkbox" data-clv="${k.id}|sw:${esc(v)}" ${sw.includes(v)?"checked":""}><span>${esc(t)}</span></label>`).join("")}</div></details>`:"")}
{const _ch=clsHTML;clsHTML=function(pfx){const h=_ch.apply(this,arguments),L=clsList();
  return h.replace(/<details class="faextra clstg"[^>]*data-cltg="([^"]+)">/g,(m,id)=>{const k=L.find(x=>x.id===id);return k?`<p class="clsh">Stacking</p>${clsAvoidHTML(k,L,pfx||"")}${m}`:m})}}
{const _cw=clsWire;clsWire=function(root){_cw.apply(this,arguments);
  root.querySelectorAll("[data-clavw]").forEach(d=>d.addEventListener("toggle",()=>{clsAvw=d.open?d.dataset.clavw:(clsAvw===d.dataset.clavw?null:clsAvw)}));
  root.querySelectorAll("[data-clv]").forEach(i=>i.addEventListener("change",()=>{const [id,key]=i.dataset.clv.split("|"),L=clsList(),k=L.find(x=>x.id===id);if(!k)return;
    if(key==="avoid"){k.avoid=i.checked;if(i.checked)clsAvw=id}
    else if(key.startsWith("sw:")){const v=key.slice(3),sw=Array.isArray(k.stackWith)?k.stackWith:[];k.stackWith=i.checked?[...new Set([...sw,v])]:sw.filter(x=>x!==v);clsAvw=id}
    clsUI.open=id;PREF.faClasses=clsClean(L);clsResend()}))}}

/* ---- Soft Automate ---- */
{const _fc=faControls;faControls=function(c,cfg){if(cfg&&cfg.scope==="soft"&&!c.sa)return false;return _fc.apply(this,arguments)}}
function setSoftAuto(pl,ids,on){if(!G||!G.p[pl]||NET.ctx!=null&&NET.ctx!==pl||!Array.isArray(ids))return false;const P=G.p[pl];
  const mine=id=>{for(const r of G.board)for(const s of r)if(s&&s.owner===pl){const x=s.cards.find(y=>y.id===id);if(x)return x}return P.hand.find(y=>y.id===id)||null};
  for(const id of ids){const x=mine(id);if(x&&!isBase(x)){if(on)x.sa=true;else delete x.sa}}render();return true}
for(const [name,get,set] of [["setSoftAuto",()=>setSoftAuto,f=>setSoftAuto=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}
const softOn=()=>{if(!G||G.over||!faAllowed())return false;const V=view();return !!G.p[V]&&!G.p[V].cpu&&!isNPC(V)&&faMine().scope==="soft"};
function saTargetAt(e){if(!softOn())return null;const V=view();
  const t=e.target.closest&&e.target.closest("#board .tile");if(t){const st=G.board[+t.dataset.r]&&G.board[+t.dataset.r][+t.dataset.c];if(st&&st.owner===V&&st.cards.some(x=>!isBase(x)))return {st}}
  const h=e.target.closest&&e.target.closest("#hand [data-h]");if(h){const c=G.p[V].hand[+h.dataset.h];if(c&&!isBase(c))return {card:c}}
  return null}
const saCards=t=>t.card?[t.card]:t.st.cards.filter(x=>!isBase(x));
const saItems=t=>{const all=saCards(t).every(x=>x.sa);return `<p class="clsmh">Soft Automate</p><button type="button" role="menuitem" data-sam="${all?0:1}">${all?(t.card?"Stop automating this card":"Stop automating stack"):(t.card?"Automate this card":"Automate stack")}</button>`};
const saAct=(t,on)=>setSoftAuto(view(),saCards(t).map(x=>x.id),on);
function saPlace(m,x,y){const w=m.offsetWidth||180,h=m.offsetHeight||120;m.style.left=Math.max(6,Math.min(innerWidth-w-6,x))+scrollX+"px";m.style.top=Math.max(6,Math.min(innerHeight-h-6,y))+scrollY+"px"}
function saWireMenu(m,t){const b=m.querySelector("[data-sam]");if(b)b.onclick=()=>{m.hidden=true;saAct(t,b.dataset.sam==="1")}}
{const _cm=clsMenu;clsMenu=function(target,x,y){_cm.apply(this,arguments);if(!softOn())return;const m=$("#clsmenu");if(!m)return;
  m.insertAdjacentHTML("afterbegin",saItems(target));saWireMenu(m,target);saPlace(m,x,y);const f=m.querySelector("button");if(f)f.focus({preventScroll:true})}}
function saMenu(t,x,y){let m=$("#clsmenu");if(!m){m=document.createElement("div");m.id="clsmenu";m.setAttribute("role","menu");document.body.appendChild(m)}
  m.innerHTML=saItems(t);m.hidden=false;saPlace(m,x,y);saWireMenu(m,t);const f=m.querySelector("button");if(f)f.focus({preventScroll:true})}
document.addEventListener("contextmenu",e=>{if(clsTargetAt(e))return;const t=saTargetAt(e);if(!t)return;e.preventDefault();saMenu(t,e.clientX,e.clientY)});   // with classes, their menu carries it
let saTap=null;
document.addEventListener("pointerup",e=>{if(e.pointerType!=="touch"||clsTargetAt(e))return;const t=saTargetAt(e);if(!t){saTap=null;return}
  const key=t.card?"h"+t.card.id:"s"+t.st.cards[0].id,now=performance.now();
  if(saTap&&saTap.key===key&&now-saTap.t<350){saTap=null;setTimeout(()=>saMenu(t,e.clientX,e.clientY),0)}else saTap={key,t:now}});
/* the Selected box, for your stack or the hand card you picked */
{const _rs=renderSel;renderSel=function(){_rs.apply(this,arguments);if(!softOn())return;const V=view(),box=$("#selbox");if(!box)return;
  let t=null;if(G.selHand&&G.p[V].hand.includes(G.selHand)&&!isBase(G.selHand))t={card:G.selHand};
  else if(G.sel){const st=G.board[G.sel.r]&&G.board[G.sel.r][G.sel.c];if(st&&st.owner===V&&st.cards.some(x=>!isBase(x)))t={st}}
  if(!t)return;const cs=saCards(t),all=cs.every(x=>x.sa),some=cs.some(x=>x.sa);
  box.insertAdjacentHTML("beforeend",`<p class="clsrow sarow"><span class="dim">Soft Automate:</span> <b>${all?"automated":some?"partly automated":"not automated"}</b> <button type="button" class="btn sm ghost" id="saPick">${all?"Stop automating":t.card?"Automate this card":"Automate stack"}</button></p>`);
  $("#saPick").onclick=()=>saAct(t,!all)}}
/* slightly see-through, for you only */
const saShow=st=>!!G&&!!st&&st.owner===view()&&faMine().scope==="soft"&&st.cards.some(x=>x.sa&&!isBase(x));
{const _sd=siegeDecor;siegeDecor=function(inner,st){const h=_sd.apply(this,arguments);if(!saShow(st))return h;return h.replace('<div class="stack','<div class="stack sauto')}}
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G)return;const V=view(),P=G.p[V],on=!!P&&faAllowed()&&faMine().scope==="soft";
  for(const b of document.querySelectorAll("#hand [data-h]")){const c=P&&P.hand[+b.dataset.h];b.classList.toggle("sauto",on&&!!(c&&c.sa))}}}
/* at the top of Field Automation: what it automates, and when */
{const _fp=faPanelHTML;faPanelHTML=function(c,pl,pfx){const h=_fp.apply(this,arguments),K=cfgKit("data-fa","data-faact","fa"+(pfx||""));
  const top=K.sec("What it automates",K.radio("scope",c.scope||"full",[["full","Full field automation","Every card on your field that the settings below give it. The default when you turn it on."],
    ["soft","Soft Automate","Only the stacks you mark: right-click one of yours (or a card in your hand) and pick Automate stack; on a phone, double-tap it. The Selected box has it too. Marked cards stay automated wherever they go, even after splitting off, and look slightly see-through."]]),"fafull fascope","",FA_WHEN);
  return top+h}}

if(window.__EC)Object.assign(window.__EC,{setSoftAuto:(...a)=>setSoftAuto(...a),clsNoStack:(...a)=>clsNoStack(...a),softOn:()=>softOn()});
