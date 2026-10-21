/* ---------------- UI pass 3 (v22): the setup menu ----------------
   Options become small tiles of the same size. What a tile means shows when the mouse rests on it, or with the small
   "i" on a touch screen (a box with an X). Long notes under a control move into that control's info.
   The menu is rebuilt after the game draws it, so every option the game adds later gets the same treatment. */

const MAP_ORDER=["none","random","keep","sahel","forest","dungeon","river"];
/* a small strip of each map's colors at the top of its tile */
function mapSwatch(k){
  if(k==="none")return "repeating-linear-gradient(90deg,#1a120b 0 18px,#000 18px 20px)";
  if(k==="random")return `linear-gradient(90deg,${["keep","sahel","forest","dungeon"].map((m,i)=>`${PAL[m].ground} ${i*25}% ${(i+1)*25}%`).join(",")})`;
  const P=PAL[k];if(!P)return "";
  if(k==="river")return `linear-gradient(180deg,${P.ground} 0 34%,${P.water} 34% 66%,${P.ground} 66%)`;
  return `linear-gradient(90deg,${P.ground} 0 30%,${P.patch[0]} 30% 55%,${P.stone} 55% 70%,${P.patch[2]} 70% 88%,${P.tuft} 88%)`;
}
const isTouch=()=>matchMedia("(hover: none)").matches;
function infoBtn(){const b=document.createElement("button");b.type="button";b.className="tipi";b.setAttribute("aria-label","What this means");b.textContent="i";return b}
/* move a tile's long text into its info */
function compactTile(lab){
  if(lab.dataset.compact)return;lab.dataset.compact="1";
  const sm=lab.querySelector(":scope > span > small, :scope > span small");
  if(sm&&sm.textContent.trim()){lab.dataset.tip=sm.textContent.trim();sm.remove()}
  const inp=lab.querySelector("input");
  if(inp&&inp.name&&/^tr\d/.test(inp.name)&&TRIBES[inp.value]){lab.dataset.sub=inp.value;if(!lab.classList.contains("off"))delete lab.dataset.tip}
  if(inp&&inp.name==="omap"){lab.classList.add("maptile");lab.style.setProperty("--sw",mapSwatch(inp.value))}
  // "(default)" becomes a small tag, the same on every tile and switch
  const sp=lab.querySelector(":scope > span")||lab;
  for(const n of [...sp.childNodes])if(n.nodeType===3&&/\s*\(default\)/.test(n.textContent)){n.textContent=n.textContent.replace(/\s*\(default\)/,"");const d=document.createElement("em");d.className="deftag";d.textContent="default";n.after(d)}
  const b=lab.querySelector(":scope > span > b");if(b&&/\s*\(default\)/.test(b.textContent)){b.textContent=b.textContent.replace(/\s*\(default\)/,"");const d=document.createElement("em");d.className="deftag";d.textContent="default";b.after(d)}
  if(lab.dataset.tip||lab.dataset.sub)lab.appendChild(infoBtn());
}
function compactNote(p){
  // a plain note right after a control becomes that control's info
  if(p.dataset.compact||p.id)return;p.dataset.compact="1";
  let prev=p.previousElementSibling;if(prev&&prev.matches(".opts")){const fs=p.closest("fieldset");prev=fs&&fs.querySelector(":scope > legend")}
  if(!prev||!prev.matches("label.f,label.chk,.f,legend"))return;
  const t=p.textContent.trim();if(!t)return;
  prev.dataset.tip=(prev.dataset.tip?prev.dataset.tip+" ":"")+t;if(!prev.querySelector(":scope > .tipi"))prev.appendChild(infoBtn());p.remove();
}
function compactSetup(root){
  root=root||document.querySelector(".ovbox.setup");if(!root)return;
  root.querySelectorAll("label.opt").forEach(compactTile);
  root.querySelectorAll("label.chk").forEach(compactTile);
  root.querySelectorAll(".spanel p.dim:not(.fixednote):not(.mapnote)").forEach(compactNote);
  // maps: one grid, the same size, in a sensible order
  const mg=root.querySelector('input[name=omap]');
  if(mg){const box=mg.closest(".opts");if(!box.dataset.sorted){box.dataset.sorted="1";box.classList.add("maps");
    const gp=box.querySelector(".optgroup");if(gp)gp.remove();
    for(const k of MAP_ORDER){const i=box.querySelector(`input[name=omap][value=${k}]`);if(i)box.appendChild(i.closest("label"))}}}
  root.querySelectorAll(".opts.subs").forEach(b=>b.classList.add("tiles"));
}
/* rich info for an Emanation tile */
function subTipHTML(k){const T=TRIBES[k];if(!T)return "";
  return `<div class="cin subtip"><div class="cih">${T.solid?solidSVG(T.solid,T.color||"#f3d6a6",16):""}<b>${esc(T.name)}</b></div><p class="stag">${esc(T.sub)}</p>${T.pts&&T.pts.length?`<ul>${T.pts.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>`:""}</div>`}
(()=>{
  // the setup box is redrawn often (seats, layouts); tidy every new piece as it appears
  const mo=new MutationObserver(()=>{const r=document.querySelector("#ov:not([hidden]) .ovbox.setup");if(r)compactSetup(r)});
  const ov=document.getElementById("ov");if(ov)mo.observe(ov,{childList:true,subtree:true});
  else document.addEventListener("DOMContentLoaded",()=>{const o=$("#ov");if(o)mo.observe(o,{childList:true,subtree:true})});
  // the "i" on a tile: show its info with an X, and don't pick the tile
  document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".tipi");if(!b)return;e.preventDefault();e.stopPropagation();
    const el=b.parentElement;showTip(el,true)},true);
})();
/* v25: the "i" buttons are off unless asked for (they're for touch screens); a phone can also hold a tile for its info */
function infoSwitch(root){
  const sh=root.querySelector(".shead");if(!sh||!root.querySelector(".stabs")||sh.querySelector(".infosw"))return;
  const w=document.createElement("div");w.className="infosw";
  w.innerHTML=`<label class="chk"><input type="checkbox" id="tipiOn" ${PREF.tipi?"checked":""}> <span><b>Info buttons</b></span></label><span class="dim">For touch screens. ${isTouch()?"You can also hold any tile to see its info.":"With a mouse, rest it on any option to see its info."}</span>`;
  sh.appendChild(w);
  w.querySelector("#tipiOn").onchange=e=>{PREF.tipi=e.target.checked;savePrefs();document.body.classList.toggle("tipi-on",PREF.tipi)};
}
document.body.classList.toggle("tipi-on",!!PREF.tipi);
{const _c=compactSetup;compactSetup=function(root){_c(root);root=root||document.querySelector(".ovbox.setup");if(root)infoSwitch(root)}}
