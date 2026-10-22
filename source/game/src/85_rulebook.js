/* ---------- v72c: the Rule book (Help, and the fullscreen pause menu's Help): every rule of the All Rules page by its code ----------
   The All Rules page gives every part a code, numbers and letters by turns (3, 3.B, 3.B.4, 3.B.4.c). The Rule book fetches
   that page when it is first opened (nothing before), lists every section with its parts and entries, finds a rule by its
   code or its words, and opens each one in its own window, with the previous and next rule a click away. */
let RB=null,rbLoading=null;
const rbText=el=>(el.textContent||"").replace(/\s+/g," ").trim();
function rbTitle(el){const c=el.cloneNode(true);c.querySelectorAll(".rcode").forEach(x=>x.remove());
  if(/^H[2-4]$/.test(el.tagName))return rbText(c);const b=c.querySelector("b");const t=b&&c.firstElementChild===b?rbText(b):rbText(c);return t.length>80?t.slice(0,78)+"…":t}
async function rbLoad(){if(RB)return RB;if(!rbLoading)rbLoading=fetch("ethers-crossroads-rules.html").then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.text()}).then(t=>{
    const d=new DOMParser().parseFromString(t,"text/html"),main=d.querySelector("main");if(!main)throw new Error("no rules");
    main.querySelectorAll("script,nav.rindex,.totop").forEach(e=>e.remove());
    RB=[...main.querySelectorAll("[data-rcode]")].map(el=>{const c=el.cloneNode(true);c.querySelectorAll(".rcode").forEach(x=>x.remove());const b=c.querySelector("b");
      return {code:el.dataset.rcode,id:el.id,lv:el.dataset.rcode.split(".").length,head:/^H[2-4]$/.test(el.tagName),named:!!b&&c.firstElementChild===b,title:rbTitle(el),el}});
    RB.forEach((e,i)=>{let up=null;for(let j=i-1;j>=0;j--)if(RB[j].head&&RB[j].lv<e.lv){up=RB[j];break}e.up=up?up.title:"";e.wtitle=e.head||e.named?e.title:e.up||e.title});   // an unnamed entry's window bears its section's name
    return RB})
    .catch(e=>{rbLoading=null;throw e});
  return rbLoading}
/* what a rule says: an entry, or a heading with everything under it */
function rbBody(e){const el=e.el;let html="";
  if(!e.head){const c=el.cloneNode(true);c.querySelectorAll(":scope>.rcode").forEach(x=>x.remove());html=c.innerHTML}
  else if(el.tagName==="H4"&&el.parentElement&&el.parentElement.matches(".subst")){const c=el.parentElement.cloneNode(true);c.querySelector("h4").remove();html=c.innerHTML}
  else{const stop=new Set(el.tagName==="H2"?["H2"]:el.tagName==="H3"?["H2","H3"]:["H2","H3","H4"]);let n=el.nextElementSibling;
    while(n&&!stop.has(n.tagName)){html+=n.outerHTML;n=n.nextElementSibling}}
  return html.replace(/href="#([^"]+)"/g,(m,id)=>RB.some(x=>x.id===id)?`href="#" data-rbgo="${id}"`:`href="ethers-crossroads-rules.html#${id}" target="_blank" rel="noopener"`)}
/* the window */
function rbOpen(code){if(!RB)return;const i=RB.findIndex(x=>x.code===code||x.id===code);if(i<0)return;const e=RB[i];
  let w=$("#rbwin");if(!w){w=document.createElement("div");w.id="rbwin";w.className="faov";document.body.appendChild(w)}
  const prev=RB[i-1],next=RB[i+1];
  w.innerHTML=`<div class="ovbox wide rbbox" role="dialog" aria-labelledby="rbh"><button type="button" class="xclose" id="rbX" aria-label="Close">×</button>
<p class="rbcode">Rule ${esc(e.code)}${!e.head&&e.named&&e.up?` · ${esc(e.up)}`:""}</p><h2 id="rbh">${esc(e.wtitle)}</h2><div class="rbtext">${rbBody(e)||'<p class="dim">This heading gathers the rules listed under it.</p>'}</div>
<p class="acts rbnav">${prev?`<button type="button" class="btn ghost sm" data-rbopen="${esc(prev.code)}">‹ ${esc(prev.code)}</button>`:""} <a class="link" href="ethers-crossroads-rules.html#${esc(e.id)}" target="_blank" rel="noopener">On the rules page</a> ${next?`<button type="button" class="btn ghost sm" data-rbopen="${esc(next.code)}">${esc(next.code)} ›</button>`:""}</p></div>`;
  w.hidden=false;const close=()=>{w.hidden=true};$("#rbX").onclick=close;w.onclick=ev=>{if(ev.target===w)close()};
  w.querySelectorAll("[data-rbopen]").forEach(b=>b.onclick=()=>rbOpen(b.dataset.rbopen));
  w.querySelectorAll("[data-rbgo]").forEach(a=>a.onclick=ev=>{ev.preventDefault();rbOpen(a.dataset.rbgo)});
  const f=w.querySelector(".rbnav button")||$("#rbX");if(f)f.focus({preventScroll:true})}
document.addEventListener("keydown",e=>{const w=$("#rbwin");if(e.key==="Escape"&&w&&!w.hidden){w.hidden=true;e.stopPropagation()}},true);
/* the index: sections that open into their parts and entries, and a search by code or words */
function rbIndexHTML(){const secs=RB.filter(e=>e.lv===1);
  return `<label class="f rbfind">Find a rule <input type="search" class="rbq" placeholder="A code (5.C) or words (Joker)" aria-label="Find a rule by its code or its words"></label>
<div class="rbres" hidden></div>
<div class="rbidx">${secs.map(s=>{const kids=RB.filter(e=>e.code.startsWith(s.code+"."));
  return `<details class="rbsec"><summary><button type="button" class="link rbent" data-rbopen="${esc(s.code)}" title="Open the whole section"><b>${esc(s.code)}</b> ${esc(s.title)}</button></summary><ul>${kids.map(k=>`<li class="lv${Math.min(4,k.lv)}${k.head?" hd":""}"><button type="button" class="link rbent" data-rbopen="${esc(k.code)}"><b>${esc(k.code)}</b> ${esc(k.title)}</button></li>`).join("")}</ul></details>`}).join("")}</div>`}
function rbMount(box){if(!box)return;if(box.dataset.rb==="1")return;box.dataset.rb="1";box.innerHTML='<p class="dim">Opening the rule book…</p>';
  rbLoad().then(()=>{box.innerHTML=rbIndexHTML();rbWire(box)}).catch(()=>{box.dataset.rb="";box.innerHTML='<p class="dim">The rule book could not be opened (no connection?). <a class="link" href="ethers-crossroads-rules.html" target="_blank" rel="noopener">All Rules</a></p>'})}
function rbWire(box){box.querySelectorAll("[data-rbopen]").forEach(b=>b.onclick=ev=>{ev.preventDefault();rbOpen(b.dataset.rbopen)});
  const q=box.querySelector(".rbq"),res=box.querySelector(".rbres"),idx=box.querySelector(".rbidx");
  q.oninput=()=>{const v=q.value.trim().toLowerCase();if(!v){res.hidden=true;idx.hidden=false;return}
    const hit=RB.filter(e=>e.code.toLowerCase()===v||e.code.toLowerCase().startsWith(v+".")||(v.length>2&&rbText(e.el).toLowerCase().includes(v))).slice(0,40);
    res.innerHTML=hit.length?`<ul>${hit.map(k=>`<li><button type="button" class="link rbent" data-rbopen="${esc(k.code)}"><b>${esc(k.code)}</b> ${esc(k.title)}</button></li>`).join("")}</ul>`:'<p class="dim">No rule matches.</p>';
    res.hidden=false;idx.hidden=true;res.querySelectorAll("[data-rbopen]").forEach(b=>b.onclick=()=>rbOpen(b.dataset.rbopen))};
  q.onkeydown=e=>{if(e.key==="Enter"){const b=res.querySelector("[data-rbopen]");if(b)b.click()}}}
/* in Help, under the other fold-downs */
{const _ih=infoHTML;infoHTML=function(){return _ih.apply(this,arguments)+`<details class="cinfo rbook"><summary>Rule book</summary><div class="rbbody"></div></details>`}}
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.matches&&d.matches("details.rbook")&&d.open)rbMount(d.querySelector(".rbbody"))},true);

if(window.__EC)Object.assign(window.__EC,{rbLoad:()=>rbLoad(),rbOpen:c=>rbOpen(c),rbMount:b=>rbMount(b)});
