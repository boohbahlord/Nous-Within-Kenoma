/* ---------- v78c: the settings window in four tabs ----------
   The pause menu (and Settings before a game) keeps every setting it had, sorted into tabs; Tab and Shift+Tab or a click
   change the tab, and the window opens on the tab used last.
   - General: the table's looks and layout, sizes, Accessibility Settings, and the game's own switches.
   - Controls: Large Map Controls, then Keyboard controls at the very bottom.
   - Performance: Connection, the background picture, the animations and each animation on its own.
   - Audio: All sound, Music and Sound effects, then one slider for each source of sound.
   The settings' own code builds them as before; this moves them into place once the window is built, and anything it
   doesn't know goes to the end of General, so nothing is ever lost. */
const SET_TABS=[["gen","General"],["ctl","Controls"],["perf","Performance"],["aud","Audio"]];
let setTab="gen";

function setShow(box,k){setTab=k;
  box.querySelectorAll(".settabs .stab").forEach(t=>{const on=t.dataset.st===k;t.classList.toggle("on",on);t.setAttribute("aria-selected",on)});
  box.querySelectorAll(".setpane").forEach(p=>p.hidden=p.dataset.pane!==k)}

function setBuild(){const m=$("#menu"),box=m&&m.querySelector(".ovbox");if(!box||box.querySelector(".settabs"))return;
  const mk=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html)e.innerHTML=html;return e};
  const rowOf=id=>{const e=box.querySelector("#"+id);return e&&(e.closest("label")||e.closest("p"))};
  const take=(dest,ids)=>{for(const id of ids){const r=rowOf(id);if(r)dest.appendChild(r)}return dest};
  const sect=(pane,title,...parts)=>{const kids=parts.filter(p=>p&&p.childElementCount);if(!kids.length)return;
    if(title)pane.appendChild(mk("h3","sethead",esc(title)));kids.forEach(p=>pane.appendChild(p))};

  // the audio rows are new: in place first, so the slider grouping gives them their arrows like every other slider
  const slide=(id,name,v)=>`<label class="f mslide">${name} <input type="range" id="${id}" min="0" max="150" step="5" value="${v}"><b id="${id}V"></b></label>`;
  const old=box.querySelector(".mslides")||box.querySelector(".mgrid");
  old.insertAdjacentHTML("beforeend",slide("mAll","All sound",SND.on?Math.round(allV()*100):0)+SND_SRC.map(([k,n])=>slide("mSrc_"+k,n,Math.round(srcV(k)*100))).join(""));
  groupMenuSliders();wireAudioSliders();

  const P={};for(const [k] of SET_TABS){P[k]=mk("div","setpane");P[k].dataset.pane=k;P[k].setAttribute("role","tabpanel")}

  /* General */
  sect(P.gen,"Table and layout",take(mk("div","mgrid"),["mTheme","mHand","mSel","mCtl","mCoord","mFull","mRbHelp","mRbFoot","mSpeed","mCheatPanel"]));
  sect(P.gen,"Cards and map",take(mk("div","mgrid"),["mPxMap","mLines","mSpellBL","mCardSym","mPat"]),take(mk("div","mslides"),["mMapOp"]));
  const sizes=[...box.querySelectorAll(".mgrid")].find(g=>g.querySelector("[data-mz]"));sect(P.gen,"Sizes",sizes);
  const acc=box.querySelector(".maccess");if(acc)P.gen.appendChild(acc);
  /* Controls: the large map's fold above the keyboard's, which stays at the very bottom */
  const cam=box.querySelector("#mCam"),keys=box.querySelector(".kbfold");
  P.ctl.appendChild(mk("p","dim","How you move around the table with the mouse, the wheel and the keys."));
  const km=mk("div","kmpanel");P.ctl.appendChild(km);kmMount(km);
  if(cam)P.ctl.appendChild(cam);if(keys)P.ctl.appendChild(keys);
  /* Performance */
  const net=box.querySelector(".perfnet");if(net){const h=net.querySelector(".perfh");if(h)h.remove();sect(P.perf,"Connection",net)}
  sect(P.perf,"Animations",take(mk("div","mgrid"),["mAnimC","mAnimM","mFxMin","mFxBy"]),take(mk("div","mslides"),["mFxLvl"]));
  const parts=box.querySelector("#mParts");if(parts){const s=parts.querySelector(":scope>summary");if(s)s.textContent="Each animation on its own";P.perf.appendChild(parts)}
  /* Audio */
  sect(P.aud,"",take(mk("div","mslides"),["mAll","mMus","mSfx"]));
  P.aud.appendChild(mk("p","dim","All sound turns every sound and the music up or down together; at 0 it turns the sound off, and moving it up turns it back on."));
  sect(P.aud,"Each sound",take(mk("div","mslides"),SND_SRC.map(([k])=>"mSrc_"+k)));
  if(P.aud.lastChild)P.aud.appendChild(mk("p","dim","Ambience is the low sound of the moons and the eclipses; the sky's sounds are its bells, horns, harps, drums and quills."));
  /* whatever is left (a setting this doesn't know yet) stays reachable in General */
  const rest=mk("div","mgrid");box.querySelectorAll(".mgrid label.f, .mslides label.f").forEach(l=>{if(!l.closest(".setpane"))rest.appendChild(l)});
  sect(P.gen,"More",rest);
  const timer=rowOf("mTimer");if(timer)P.gen.appendChild(timer);
  box.querySelectorAll(".mgrid, .mslides").forEach(g=>{if(!g.closest(".setpane")&&!g.closest("details")&&!g.childElementCount)g.remove()});

  const bar=mk("div","stabs settabs",SET_TABS.map(([k,t])=>`<button type="button" role="tab" class="stab" data-st="${k}">${t}</button>`).join(""));
  bar.setAttribute("role","tablist");
  const intro=box.querySelector(":scope>p.dim"),acts=box.querySelector(":scope>p.acts");
  (intro||box.querySelector(":scope>h2")).after(bar);let at=bar;for(const [k] of SET_TABS){at.after(P[k]);at=P[k]}
  if(acts)box.appendChild(acts);
  bar.querySelectorAll(".stab").forEach(t=>t.onclick=()=>{setShow(box,t.dataset.st);box.scrollTop=0});
  setShow(box,setTab);kmBang()}
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);rSafe(setBuild,null,[])}}

if(window.__EC)Object.assign(window.__EC,{setShow:k=>{const b=$("#menu .ovbox");if(b)setShow(b,k)}});
