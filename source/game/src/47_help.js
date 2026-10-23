/* ---------------- v45: "What you must know", the start-of-game toast and the Help title ----------------
   Top center of the play page: "What you must know · Click me to know". It opens a panel: a short TLDR, a paragraph on what new
   players miss, and "Tell me more here now" for the deeper version, which also points to the Help index at the bottom.
   "Never show again" asks first: Yes, No, or Remind me at the start of the next game. The Help title above the fold-downs at
   the bottom always has a small link back to it. */
const MK_TLDR=`Your deck is your life and your souls are your mana: you are out when you have nothing left on the field, or no deck, hand and mana at all. Keep your Ace safe on your back line, get Miners working for steady mana, and only fight battles your best card can win.`;
const MK_BODY=`<p><b>Cards are life and money at once.</b> Every card you draw, place or lose comes out of your deck; every card you sacrifice becomes mana (its soul's worth), but it is one soldier less. You can sacrifice cards from your hand, too: a quick way to pay for a spell.</p>
<p><b>Mana grows slowly unless you build for it.</b> Miners are the steady income: any number can sit in your Aces (1d2 − 1 mana each, every round), and one on a crystal tile digs up to 12 mana over time. Spells you pay for go to the Bank, which lends mana and lets you spend on credit, at a price.</p>
<p><b>Bases hold the line.</b> Aces, Walls, the Tree and Lighthouses are bases: they don't walk, they have hearts, and each holds one stack. Cards inside an Ace, a Wall or the Tree are protected until it falls, and then they fall with it; a Lighthouse's stack fights from inside it and takes the blows first.</p>
<p><b>The sky changes the rules.</b> The Moon turns once a round and moves prices up and down (the Full and New Moons most of all). Heavenly Bodies can take its place, each with its own cycle, and now and then a rare eclipse brings a strange effect.</p>
<p><b>The dead come back.</b> Fallen cards go to the grave. Grave Blessing (free, once a round) rolls dice, and every 6 raises a card from the grave into your hand.</p>`;
const MK_MORE=`<h3>Tell me more</h3><ul class="mklist">
<li><b>How you win:</b> the last player (or side) with anything on the field and a deck, hand or mana left wins. A player whose mana sinks below −8 is out.</li>
<li><b>A turn:</b> prep, which starts with drawing (roll a d4 and draw that many, as often as you like, then press Done drawing), then place, move one step, sacrifice and cast; then attack (each stack may attack a neighbor once).</li>
<li><b>Fights:</b> the attacker's best card plus its die against the defender's best card. The loser takes a damage, which removes its lowest card. Kings with Queens, Aces and Walls defend well.</li>
<li><b>Drawing too much hurts:</b> cards past your hand limit go to the grave, and each one takes 1d6 off this round's Grave Blessing.</li>
<li><b>The Ether</b> (top of the spells) sells new cards: Scouts, Miners, Repairmen, Archers, Aces and more. Conjured cards go into your deck.</li>
<li><b>Fog of war:</b> you only see near your own cards. Scouts see two tiles out and uncover hidden Assassins and ambushers.</li>
<li><b>The Bank:</b> a loan gives you mana now, due in half its amount in rounds (at least 2); credit lets you cast what you can't afford and turns the rest into debt. Stay below zero for 3 rounds and the Debt Collectors come every round until you pay; every Full Moon the Bank's Credit and Loan Report shows your standing. Hover or hold a word in the Bank for the details.</li></ul>
<p class="mkpoint">Everything else is in the <b>Help</b> index at the bottom of the page: basics, every card, every spell, the sky and the Bank, always there while you play. Hover (or press and hold) anything on the screen for what it does.</p>`;
const mkHidden=()=>PREF.mkHide==="never"||PREF.mkHide==="next";
function mountMustKnow(){const h=document.querySelector(".game header");if(!h||$("#mustknow"))return;
  h.insertAdjacentHTML("beforeend",`<div id="mustknow"><button type="button" id="mkBtn" aria-haspopup="dialog"><span class="mkt">What you must know</span><small>Click me to know</small></button></div>`);
  $("#mkBtn").onclick=openMustKnow;paintMustKnow()}
function paintMustKnow(){const m=$("#mustknow");if(m)m.hidden=mkHidden()}
function openMustKnow(){
  ovShow(`<div class="ovbox wide mkbox" role="dialog" aria-labelledby="mkh"><button type="button" class="xclose" id="mkX" aria-label="Close">×</button>
<p class="mknever"><button type="button" class="btn sm mkglow" id="mkNever">Never show again</button></p>
<h2 id="mkh">What you must know</h2>
<p class="mktldr"><b>TLDR</b> ${MK_TLDR}</p>
<div class="mkbody">${MK_BODY}</div>
<div id="mkMore" hidden>${MK_MORE}</div>
<p class="acts"><button type="button" class="btn" id="mkMoreBtn">Tell me more here now</button> <button type="button" class="btn ghost" id="mkHelp">Show me the Help index</button> <button type="button" class="btn ghost" id="mkClose">Close</button></p></div>`);
  $("#mkX").onclick=$("#mkClose").onclick=ovHide;
  $("#mkMoreBtn").onclick=()=>{const m=$("#mkMore");m.hidden=false;$("#mkMoreBtn").hidden=true;m.scrollIntoView({block:"start",behavior:"smooth"})};
  $("#mkHelp").onclick=()=>{ovHide();goHelp()};
  $("#mkNever").onclick=askNever}
function askNever(){
  ovShow(`<div class="ovbox mkask" role="dialog" aria-labelledby="mkq"><h2 id="mkq">Never show "What you must know" again?</h2><p class="dim">You can always open it again from the Help title at the bottom of the page.</p>
<p class="acts"><button type="button" class="btn" id="mkYes">Yes</button> <button type="button" class="btn ghost" id="mkNo">No</button> <button type="button" class="btn ghost" id="mkNext">Remind me at the start of the next game</button></p></div>`);
  $("#mkYes").onclick=()=>{PREF.mkHide="never";savePrefs();ovHide();paintMustKnow()};
  $("#mkNext").onclick=()=>{PREF.mkHide="next";savePrefs();ovHide();paintMustKnow()};
  $("#mkNo").onclick=openMustKnow}
function goHelp(){const t=$("#helphead")||$("#info");if(t)t.scrollIntoView({block:"start",behavior:"smooth"})}
/* the Help title above the fold-downs; it names the automation panel when that is there */
function paintHelpHead(){const info=$("#info");if(!info)return;let h=$("#helphead");
  if(!h){info.insertAdjacentHTML("beforebegin",`<div id="helphead"><h3 class="label">Help</h3><button type="button" class="link" id="helpMk">What you must know</button></div>`);h=$("#helphead");$("#helpMk").onclick=openMustKnow}
  h.querySelector("h3").textContent=$("#fapanel")?"Help & Configure Automation":"Help"}
/* the toast at the start of a game: not a window, it points at the Help and fades on its own */
let toastT=0;
function helpToast(){let t=$("#helptoast");if(!t){t=document.createElement("div");t.id="helptoast";t.setAttribute("role","status");document.body.appendChild(t)}
  t.innerHTML=`<span>Lost? The <b>Help</b> index at the bottom of the page explains every card, spell and rule.</span><button type="button" class="link" id="htGo">Show me</button><button type="button" class="htx" id="htX" aria-label="Dismiss">×</button>`;
  t.hidden=false;t.classList.remove("out");const close=()=>{t.classList.add("out");setTimeout(()=>{t.hidden=true},400)};
  $("#htGo").onclick=()=>{close();goHelp()};$("#htX").onclick=close;clearTimeout(toastT);toastT=setTimeout(close,10000)}
{const _sg=startGame;startGame=function(){const out=_sg.apply(this,arguments);
  if(PREF.mkHide==="next"){PREF.mkHide=null;savePrefs()}paintMustKnow();
  if(G&&G.p.some(P=>!P.cpu&&!isNPC(P.i)))toastWhenClear(0);return out}}
/* the toast waits until no window or question is open (the setup's Ace, the animations question…), for half a minute at most */
const dialogOpen=()=>[...document.querySelectorAll("#ov,#animask,#faask,#facfg,#menu,#pop")].some(e=>!e.hidden&&e.getClientRects().length>0&&e.innerHTML.trim()!=="");
function toastWhenClear(n){if(n>30)return;setTimeout(()=>{if(dialogOpen())toastWhenClear(n+1);else helpToast()},n?1000:1500)}
{const _r=render;render=function(){rSafe(_r,this,arguments);paintHelpHead()}}
mountMustKnow();paintHelpHead();
if(window.__EC)Object.assign(window.__EC,{openMustKnow,helpToast});
