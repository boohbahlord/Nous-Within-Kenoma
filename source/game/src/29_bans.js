/* ---------------- Prompt 12, part 2c (v29): striking Emanations and Heavenly Bodies before a game; the Sun and Saturn judge their buyer ----------------
   Emanations: a small check in every Emanation tile strikes it from the game: nobody can pick it and Random never rolls it. One ban list
     for the whole table (it shows in every seat). At least one stays; Random fades out by itself when only one is left. Every seat needs one of
     its own (v73a: the Beginner is gone), so at least as many Emanations as seats stay.
     Survival has no bans.
   Planets: a check on each Heavenly Body in "Starting Heavenly Body" strikes it from Astrology: it can't be bought in the Heavenly Body shop and the
     Firmament can't raise it. The starting Heavenly Body itself can't be struck.
   The Second Sun and Saturn bought in the shop judge and tax whoever bought them; their favors go to the Bank, like a sky from the
     start, unless the buyer's own Emanation already raises that Heavenly Body (the Firmament's Sun, Yaldabaoth's Saturn). */

const SUB_BAN=new Set((PREF.subBan||[]).filter(k=>PLAYABLE.includes(k)));
const PLANET_BAN=new Set(PREF.planetBan||[]);
const SKY_KEY=v=>v==="on"?"moon":v;   // the setup calls the moon "on"
const saveBans=()=>{PREF.subBan=[...SUB_BAN];PREF.planetBan=[...PLANET_BAN];savePrefs()};
const setupSurvival=()=>startMode==="survival";
const seatCount=()=>{const e=$("#pcount");return e?+e.value:2};
const subsAllowed=()=>PLAYABLE.filter(k=>!SUB_BAN.has(k));
function banBtn(on,what){const b=document.createElement("button");b.type="button";b.className="bancheck"+(on?" on":"");b.setAttribute("aria-pressed",on);
  b.setAttribute("aria-label",on?`${what} is allowed in this game. Click to strike it.`:`${what} is struck from this game. Click to allow it.`);b.dataset.tip=on?"Allowed. Click to strike it from this game.":"Struck from this game. Click to allow it again.";return b}

/* ---------- the rules for striking an Emanation ---------- */
function subFloorFix(){const N=seatCount();let ch=false;for(const k of [...SUB_BAN]){if(subsAllowed().length>=N)break;SUB_BAN.delete(k);ch=true}if(ch)saveBans();return ch}   // v73a: every seat needs one of its own
function toggleSub(k){
  if(SUB_BAN.has(k)){SUB_BAN.delete(k);saveBans();return true}
  const N=seatCount(),after=subsAllowed().filter(x=>x!==k);
  if(!after.length){flash("At least one Emanation has to stay.");return false}
  if(after.length<N){flash(`${N} players need at least ${N} Emanations: no two players share one.`);return false}
  SUB_BAN.add(k);saveBans();return true}
/* seats sitting on a struck Emanation move to Random (or to the only one left) */
function fixSeats(root){
  const A=subsAllowed();
  root.querySelectorAll('.seat input[name^="tr"]:checked').forEach(inp=>{const k=inp.value;
    const bad=k==="random"?A.length<2:SUB_BAN.has(k);if(!bad)return;
    const to=A.length>=2?"random":A[0];const t=inp.closest(".opts").querySelector(`input[value="${to}"]`);
    if(t&&t!==inp){t.disabled=false;t.checked=true;t.dispatchEvent(new Event("change",{bubbles:true}))}})}

/* ---------- painting the checks into the setup ---------- */
function applyBans(root){
  if(!root)return;const surv=setupSurvival();root.classList.toggle("nobans",surv);
  if(!surv&&subFloorFix())flash("An Emanation is back: every seat needs one of its own.");
  const A=subsAllowed();
  root.querySelectorAll('.seat label.opt input[name^="tr"]').forEach(inp=>{const lab=inp.closest("label.opt"),k=inp.value;
    if(surv){lab.classList.remove("banned");return}
    const isRand=k==="random",banned=isRand?A.length<2:SUB_BAN.has(k);
    lab.classList.toggle("banned",banned);
    if(banned)inp.disabled=true;else if(!lab.classList.contains("off"))inp.disabled=false;
    if(isRand){lab.dataset.autonote=banned?"Random needs two Emanations to choose from.":"";return}
    let b=lab.querySelector(":scope > .bancheck");if(!b){b=banBtn(!banned,TRIBES[k].name);b.dataset.sub=k;lab.appendChild(b)}
    else if(b.classList.contains("on")===banned){const nb=banBtn(!banned,TRIBES[k].name);nb.dataset.sub=k;b.replaceWith(nb)}});
  if(!surv)fixSeats(root);
  const sel=val("omoonon");
  root.querySelectorAll('.skyopts label.opt input[name="omoonon"]').forEach(inp=>{const lab=inp.closest("label.opt"),v=inp.value;if(v==="off")return;
    const k=SKY_KEY(v);if(v===sel&&PLANET_BAN.has(k)){PLANET_BAN.delete(k);saveBans()}
    const struck=PLANET_BAN.has(k);lab.classList.toggle("struck",struck);
    let b=lab.querySelector(":scope > .bancheck");const nm=SHOP_NAME[k]||k;
    if(!b){b=banBtn(!struck,nm);b.dataset.planet=v;lab.appendChild(b)}else if(b.classList.contains("on")===struck){const nb=banBtn(!struck,nm);nb.dataset.planet=v;b.replaceWith(nb)}});
  let note=root.querySelector("#plbannote");const sk=root.querySelector(".skyopts");
  if(sk&&!note){note=document.createElement("p");note.id="plbannote";note.className="dim fixednote";sk.after(note)}
  const nt=PLANET_BAN.size?`Struck from Astrology (no Heavenly Body shop, no Firmament): ${[...PLANET_BAN].map(k=>SHOP_NAME[k]||k).join(", ")}.`:"The check on a Heavenly Body strikes it from Astrology for this game: nobody can buy it in the Heavenly Body shop and the Firmament can't raise it.";
  if(note&&note.textContent!==nt)note.textContent=nt;   // only when it changes: the setup watches itself for changes
}
{const _c=compactSetup;compactSetup=function(root){_c(root);root=root||document.querySelector(".ovbox.setup");if(root)applyBans(root)}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".bancheck");if(!b)return;e.preventDefault();e.stopPropagation();
  const root=b.closest(".ovbox.setup");if(!root)return;
  if(b.dataset.sub){if(toggleSub(b.dataset.sub))applyBans(root)}
  else if(b.dataset.planet){const v=b.dataset.planet,k=SKY_KEY(v);
    if(!PLANET_BAN.has(k)&&val("omoonon")===v){flash("That is the starting Heavenly Body: pick another start first.");return}
    PLANET_BAN.has(k)?PLANET_BAN.delete(k):PLANET_BAN.add(k);saveBans();applyBans(root)}},true);
/* the bans go into the game only from the setup window (tests and quick starts are untouched) */
{const _sg=startGame;startGame=function(opts){
  if(document.querySelector("#ov:not([hidden]) .ovbox.setup")&&opts&&opts.mode!=="survival"){opts.subBan=[...SUB_BAN];opts.planetBan=[...PLANET_BAN].filter(k=>k!==SKY_KEY(opts.moon))}
  return _sg(opts)}}

/* ---------- in the game ---------- */
const planetStruck=k=>!!(G&&(G.opts.planetBan||[]).includes(k));
{const _sb=shopBlock;shopBlock=function(k){if(shopOn()&&planetStruck(k))return "Struck from this game.";return _sb(k)}}
for(const k of ["mars","sun","venus","jupiter","mercury"]){const s=SP(k);if(s){const ok=s.ok;s.ok=()=>!planetStruck(k)&&ok()}}
{const _pb=spellBlock;spellBlock=function(sp){if(sp&&["mars","sun","venus","jupiter","mercury"].includes(sp.id)&&sp.tribe==="firm"&&planetStruck(sp.id))return "Struck from this game.";return _pb(sp)}}

/* a bought Second Sun or Saturn: its favors go to the Bank and it judges its buyer, unless the buyer's Emanation raises it anyway */
const OWN_PLANET={sun:"firm",saturn:"yald"};
{const _rp=raisePlanet;raisePlanet=function(){const p=SH().pend;if(!p||G.moon.round<=p.round)return _rp();
  const k=p.k,own=OWN_PLANET[k]&&G.p[p.by]&&G.p[p.by].tribe===OWN_PLANET[k];
  _rp();
  if(k==="sun"&&!own){G.planetBy=null;log(`The Second Sun answers to no one: ${plName(p.by)} is judged like everyone else, and what it takes goes to the Bank.`)}
  if(k==="saturn"&&!own){G.saturnBy=null;G.saturnDebt=0;log(`Saturn answers to no one: ${plName(p.by)} pays its toll like everyone else, and the toll goes to the Bank.`)}}}

if(window.__EC)Object.assign(window.__EC,{shopBlock:k=>shopBlock(k),raisePlanet:()=>raisePlanet(),SUB_BAN,PLANET_BAN});
