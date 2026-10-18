/* ---------------- v38: phones (and the log everywhere) ----------------
   On a phone the Spells box, the Log and the book's passages fold shut behind their headings, closed by default, and glow until
   the player first touches them; once opened they open fully, so the page scrolls instead of a box inside it. */
const FOLDS=[["spells",".spellpanel",".spellpanel>h3"],["log","#logwrap","#logwrap>h3"],["quotes","#quotes","#quotes>h3"]];
function mountFolds(){
  for(const [k,box,head] of FOLDS){const B=document.querySelector(box),H=document.querySelector(head);if(!B||!H||H.dataset.fold)continue;
    H.dataset.fold=k;H.setAttribute("role","button");H.tabIndex=0;
    const go=()=>{PREF.fold=PREF.fold||{};PREF.fold[k]=!foldOpen(k);(PREF.foldSeen=PREF.foldSeen||{})[k]=1;savePrefs();paintFolds()};
    H.addEventListener("click",go);H.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go()}})}
  paintFolds();
}
const foldOpen=k=>!!(PREF.fold&&PREF.fold[k]);
const FOLD_ALWAYS=new Set(["log"]);   // v38: the log folds on a computer too, closed by default
function paintFolds(){const ph=isPhone();
  for(const [k,box,head] of FOLDS){const B=document.querySelector(box),H=document.querySelector(head);if(!B||!H)continue;
    const on=ph||FOLD_ALWAYS.has(k),shut=on&&!foldOpen(k);B.classList.toggle("folded",shut);B.classList.toggle("foldable",on);
    B.classList.toggle("foldglow",ph&&!(PREF.foldSeen&&PREF.foldSeen[k]));
    if(on)H.setAttribute("aria-expanded",!shut);else H.removeAttribute("aria-expanded")}}
{const _mq=mountQuotes;mountQuotes=function(){_mq.apply(this,arguments);mountFolds()}}
{const _ap=applyPrefs;applyPrefs=function(){_ap.apply(this,arguments);paintFolds()}}
if(typeof matchMedia!=="undefined"){const mq=matchMedia(PHONE_Q);const re=()=>{try{applyPrefs();if(G)render()}catch(e){}};mq.addEventListener?mq.addEventListener("change",re):mq.addListener(re)}
