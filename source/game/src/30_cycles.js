/* ---------------- Prompt 12, part 3 (v30): the sky's cycles, its glow, its full paragraph; cooldown bars on spells ----------------
   Every Heavenly Body with a cycle gets a small strip like the Moon's phases: the Moon's eight phases, Venus's and Mercury's six
   rounds, the Second Sun's countdown to your next judgement, Saturn's tolls toward your next Puppets (under its Oath). Each piece of a
   strip has its own tip (hover, or hold on a phone): what happens then and when it comes. The event pieces glow, and the body itself
   glows (a slow shimmer) while its event is on: the New and Full Moon, a Venus or Mercury cycle round, a toll or a judgement being
   asked, an eclipse. Clicking the sky shows its lines and then a full paragraph on how it works.
   Cooldown bars: a thin bar along the bottom of a spell, in its school's color. Uses left this turn (full = ready, empty = used),
   turns of a cooldown (filling to the right), and anything that blocks a spell for a set time (Jail, Mercury's ban, the Ether ban,
   the Heavenly Body shop's six rounds). Spells with no limit get no bar. Rob the Bank's bar is gold. */

const SCHOOL_COL={Necromancy:"#4a3d9a",Enchantment:"#e3b944",Curse:"#c8202e",Sorcery:"#2f9a5a",Illusion:"#ec8a2c",Conjuring:"#5b48d6",Astrology:"#2fb8a8",Bank:"#e8c24a"};
const rnds=n=>`${n} round${n===1?"":"s"}`,trns=n=>`${n} turn${n===1?"":"s"}`;

/* ---------- the strips ---------- */
const MOON_PH=i=>{const bonus=G.opts.moonBonus!==false;
  if(i===0)return `Everyone raises 1d2 cards from the grave. Clairvoyance and Naked Hand cost 6.${bonus?" Every defense adds 1d2.":""}${oathNow(view(),"moon")?" Your Oath: 2d2 − 1 more.":""}`;
  if(i===4)return `The toll: a random stack of two (or else a card on your field, or else three deck cards), or 2d2 + 2 mana. Every deck is shuffled; no drawing and no necromancy. Clairvoyance costs 2, Naked Hand is free.${bonus?" Every attack adds 1d2.":""} One in twenty is a Blood Moon.`;
  return "Nothing happens."};
function moonPieces(){const m=G.moon;
  return MOON.map((n,i)=>{const d=(i-m.i+8)%8,ev=i===0||i===4;
    const tip=`${n}${d?` (in ${rnds(d)})`:" (now)"}: ${MOON_PH(i)}`;
    return `<span class="${i===m.i?"on":""}${ev?" ev":""}" data-tip="${esc(tip)}"><svg viewBox="-9 -9 18 18" width="18" height="18"><circle r="7" fill="${m.blood&&i===4?"#3b0608":"#1f1913"}" stroke="#5a4a3a" stroke-width=".6"/><g fill="${m.blood&&i===4?"#d3171e":"#e9e1cc"}">${moonPath(i,7)}</g></svg></span>`}).join("")}
const pip=(col,ev,filled)=>`<svg viewBox="-9 -9 18 18" width="18" height="18">${ev?`<path d="M0,-7L2,-2L7,0L2,2L0,7L-2,2L-7,0L-2,-2Z" fill="${filled?col:"none"}" stroke="${col}" stroke-width="1"/>`:`<circle r="${filled?4.2:3.6}" fill="${filled?col:"none"}" stroke="${col}" stroke-width="1" opacity="${filled?1:.7}"/>`}</svg>`;
const CYC_TXT={venus:"Venus's cycle. Under her Oath, support and base cards from the Ether cost 1 less this round (never below 1 mana) and every wounded card of yours heals a heart. Without her Oath, only on a 4 of 1d4.",
  mercury:"Mercury's cycle. Everyone votes to ban one school of spells for 1d3 rounds from the next round; a tie is a d20 roll-off, and the Oath of Mercury wins it. Anyone can try to Rob the Bank, once."};
const CYC_COL={venus:"#ffd9a0",mercury:"#b9c8dc"};
function roundPieces(k){const r=G.moon.round,since=G.skySince!=null&&G.skySince<=r?G.skySince:r,e=r-since;
  const base=e>0?since+CYCLE*Math.floor((e-1)/CYCLE):since,cur=e>0?((e-1)%CYCLE)+1:0;
  return Array.from({length:CYCLE},(_,j)=>{const s=j+1,rd=base+s,ev=s===CYCLE,d=rd-r;
    const tip=`Round ${rd}${d>0?` (in ${rnds(d)})`:d===0?" (now)":""}: ${ev?CYC_TXT[k]:"nothing happens."}`;
    return `<span class="${s===cur?"on":""}${ev?" ev":""}${s<cur?" past":""}" data-tip="${esc(tip)}">${pip(CYC_COL[k],ev,s<=cur)}</span>`}).join("")}
function sunPieces(V){const P=G.p[V];if(!P||P.tribe==="firm"||isHorde(V)||P.sunNext==null)return "";
  const tn=tnOf(V),from=P.sunFrom!=null&&P.sunFrom<P.sunNext?P.sunFrom:P.sunNext-2,n=P.sunNext-from,cur=tn-from;
  return Array.from({length:n},(_,j)=>{const s=j+1,t=from+s,ev=s===n,d=t-tn;
    const tip=`Your turn ${t}${d>0?` (in ${trns(d)})`:d===0?" (this turn)":""}: ${ev?"the Second Sun judges you: 1 mana, a wound to one of your stacks, or two deck cards; refuse and you are blind for that turn. Then it waits 2d2 turns again.":"nothing."}`;
    return `<span class="${s===cur?"on":""}${ev?" ev":""}" data-tip="${esc(tip)}">${pip("#a78bff",ev,s<=cur)}</span>`}).join("")}
function saturnPieces(V){const P=G.p[V];if(!P||P.oath!=="saturn")return "";const paid=P.satPaid||0;
  return Array.from({length:9},(_,j)=>{const s=j+1,ev=!!SAT_MILES[s],n=SAT_MILES[s];
    const tip=`Toll ${s}${s<=paid?" (paid)":s===paid+1?" (next)":""}: ${ev?`Saturn sends ${n} stack${n>1?"s":""} of 1d4 Puppets to fight for you.`:"no Puppets."}${P.satBlock>0?` You betrayed Saturn: the next ${P.satBlock} toll${P.satBlock>1?"s bring":" brings"} no Puppets.`:""}`;
    return `<span class="${s===paid?"on":""}${ev?" ev":""}" data-tip="${esc(tip)}">${pip(P.satLocked?"#c8202e":"#d8c58a",ev,s<=paid)}</span>`}).join("")}
moonStrip=function(){
  const m=G.moon,k=sky(),V=view();let h="",lab="";
  if(!m.gone){h=moonPieces();lab="Moon phases"}
  else if(k==="venus"||k==="mercury"){h=roundPieces(k);lab=`${SHOP_NAME[k]}'s cycle`}
  else if(k==="sun"){h=sunPieces(V);lab="Your next judgement"}
  else if(k==="saturn"){h=saturnPieces(V);lab="Your tolls to Saturn"}
  return h?`<div class="mstrip cyc-${k}" aria-label="${lab}">${h}</div>`:""};
/* a piece of the strip shows its own tip, not the whole sky box */
document.addEventListener("pointerover",e=>{if(e.target.closest&&e.target.closest(".mstrip [data-tip]")){const p=$("#cinfo");if(p&&p.dataset.hover)p.hidden=true}});

/* ---------- the glow ---------- */
function skyLit(){const m=G.moon,k=sky();
  if(G.skyGlow||G.eclipse)return true;
  if(!m.gone)return m.i===0||m.i===4;
  if(k==="venus"||k==="mercury")return cycleNow(k);
  return false}
{const _ta=turnAsync;turnAsync=async function(pl){const P=G.p[pl];
  const due=!!P&&!isHorde(pl)&&(planetUp("saturn")&&paysSaturn(pl)||sunUp()&&P.tribe!=="firm"&&P.sunNext!=null&&tnOf(pl)>=P.sunNext);
  if(due){G.skyGlow=true;render()}
  try{return await _ta(pl)}finally{if(due){G.skyGlow=false;render()}}}}
{const _sa=skyAsync;skyAsync=async function(pl){const P=G.p[pl],b=P&&P.sunNext;await _sa(pl);if(P&&P.sunNext!=null&&P.sunNext!==b)P.sunFrom=tnOf(pl)}}

/* ---------- clicking the sky: the whole story in a paragraph ---------- */
const SKY_PARA={
 moon:"The Moon turns one phase every round, after everyone has played, through eight phases; two of them do something. At the New Moon everyone raises 1d2 cards from the grave, Clairvoyance and Naked Hand cost 6, and every defense adds 1d2. At the Full Moon everyone pays its toll (a random stack of two, or else one card from the field, or else three cards from the shuffled deck; refusing costs 2d2 + 2 mana, even below zero), every deck is shuffled, nobody draws or casts necromancy, Clairvoyance costs 2 and Naked Hand is free, and every attack adds 1d2. One Full Moon in twenty turns red: a Blood Moon gives New Moon gifts at Full Moon prices, and every card killed falls into the Outer Darkness. Anyone can swear the Oath of the Moon.",
 saturn:"Saturn hangs in the Moon's place and stops its phases. At the start of each of their turns, everyone who owes it (every enemy of whoever raised it, or everyone if nobody did; never Binah or the Firmament) pays 1: a hand card, the top deck card or 1 mana. Whoever refuses gets a Debt Collector, and every Debt Collector still standing at the start of a round raises the price by one. Those who pay can swear the Oath of Saturn: Puppets fight for them after the 1st, 3rd, 6th and 9th toll, but one missed toll is a betrayal that locks the Oath and sends Saturn's own Puppets after them. Saturn has an eclipse (5% a round) with seven possible outcomes.",
 mars:"Mars, the Form of Strife, stops the Moon's phases. At the start of each turn, every stack made only of Grunts, Infantry or Puppets has a 5 in 8 chance (1 to 5 on 1d8) of advantage on its next attack. A Leviathan can coil on Mars; its toll and its weak spot come every eighth round. Yaldabaoth can eat Mars, and then it never comes back. Like every Heavenly Body but the Moon, it can be eclipsed (5% a round).",
 sun:"The Second Sun burns the fog of war away (Delusions still blind). Every 2d2 of your turns it judges you: pay 1 mana, take a wound on one of your stacks, or burn two deck cards; refuse and you are blind for that turn. What it takes goes to whoever raised it, or to the Bank. It never judges the Firmament. Yaldabaoth can make it cry; three times and it goes out as the Black Sun. Anyone else can swear the Oath of the Sun for fire mana, Scorched Earth and Blindness. The Leviathan can't lie on it.",
 blacksun:"The Second Sun cried three times and went out: this is the Black Sun. The fog of war is back. The Firmament that raised it pays Yaldabaoth 1d2 mana or 1d2 deck cards every 1d2 of its turns. If it falls, it destroys the tile it lands on for good.",
 venus:"Venus, the Form of Harmony. Whoever raised it chose a gift: +2 mana a turn and +2 maximum for one of their side, or +1 a turn while every enemy gets +2 maximum. Under the Oath of Venus, every turn you start without having attacked a player gives +2 mana and +2 maximum, and each attack on a player costs 1d2 mana and two maximum for 1d3 turns. Every sixth round is Venus's cycle: her sworn pay 1 less for support and base cards from the Ether that round, and every wounded card of theirs heals a heart; anyone else gets the same on a 4 of 1d4. Her eclipse doubles her gifts, heals every card and can mend a betrayal.",
 jupiter:"Jupiter, the Form of Abundance. Miners in an Ace bring 1d2 a turn instead of 1d2 − 1. Every round two conjurings go on sale. Hand cards can be traded at the Auction, and a Jester's Sacrificial Suicide brings 1d2 − 1 more. Whoever raised it may get a mana when others buy on sale or trade. Under the Oath of Jupiter every conjuring costs one less, unless it already costs one.",
 mercury:"Mercury, the Form of Guile. Anyone can call a vote for Peace or Total War (everyone must agree), or buy Peace for two rounds. Under the Oath of Mercury, Betrayal, Declare War and Bribe the Banker open up. Every sixth round is Mercury's cycle: everyone votes to ban one school of spells for 1d3 rounds from the next round (a tie is a d20 roll-off, and the Oath of Mercury wins it), and anyone can try to Rob the Bank, once.",
 eaten:"Yaldabaoth ate what hung here. Nothing turns: no phases, no gifts, no tolls. What was eaten never comes back, but another Heavenly Body can still be raised or bought.",
 fallen:"The Second Sun fell to the ground and the sky is empty: no phases, no gifts, no tolls, until another Heavenly Body is raised or bought.",
 off:"This game started with no Heavenly Body: no phases, no gifts, no tolls, no Blood Moon. One can still be raised or bought."};
let skyClick=0;
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#moon")&&!e.target.closest(".mstrip"))skyClick=Date.now()},true);
{const _mi=moonInfoHTML;moonInfoHTML=function(){const h=_mi();if(Date.now()-skyClick>400)return h;const k=sky(),t=SKY_PARA[k];if(!t)return h;
  const shop=shopOn()?` ${SH().pend?`${SHOP_NAME[SH().pend.k]} takes the sky next round.`:G.moon.round<SH().next?`The Heavenly Body shop opens again in round ${SH().next}.`:"Any Heavenly Body can be bought in the Heavenly Body shop (Astrology)."}`:"";
  return h+`<div class="skypara"><b>How it works</b><p>${esc(t)}${esc(shop)}</p></div>`}}

/* ---------- cooldown bars ---------- */
function coolOf(sp){
  if(!G||!sp)return null;const pl=G.active,P=G.p[pl];if(!P)return null;const r=G.moon.round,tn=tnOf(pl);
  const col=SCHOOL_COL[sp.school]||"#9a9a9a",out=(f,t)=>({f:Math.max(0,Math.min(1,f)),col,t});
  // a block for a set time: the bar fills back up as it runs out
  if(P.jail)return out((r-P.jail.from)/(P.jail.until-P.jail.from+1),"In Jail");
  if(banOn()&&sp.school===G.mban.school)return out((r-G.mban.from+1)/(G.mban.until-G.mban.from+2),"Mercury's ban");
  if(sp.school==="Conjuring"&&etherBanned(pl))return out(1-(P.etherBan-tn+1)/10,"No Ether");
  if((sp.id==="robbank"||sp.id==="gamble")&&bankBanned(pl))return out(1-(P.bankBan-tn+1)/10,"No Bank");
  if(sp.shop&&shopOn()&&r<SH().next)return out(1-(SH().next-r)/SHOP_LOCK,"The Heavenly Body shop is closed");
  // the spell's own limit
  if(sp.once)return out(P.once&&P.once[sp.id]?0:1,"Once a game");
  switch(sp.id){
    case "bless":return out(G.blessed?0:1,"Once a turn");
    case "ritual":return out(G.blessed?0:1,"Before Grave Blessing, as often as you like");
    case "libation":return out(G.libation?0:1,"Once a turn");
    case "hunger":return out(1-(P.hungerUses||0)/2,"Twice a turn");
    case "moonjoker":return oathNow(pl,"moon")?out(1-(P.moonJokers||0)/2,"Twice between Full Moons"):null;
    case "robbank":return G.mercCyc===r?{f:P.robbed===r?0:1,col:SCHOOL_COL.Bank,t:"One try"}:null;
    case "ffog":return P.fogReady&&tn<P.fogReady?out(1-(P.fogReady-tn)/3,"Every 3 turns"):out(1,"Every 3 turns");
    case "cry":{if(!(P.cryReady>tn))return out(1,"Every 1d3 turns");const from=P.cryFrom!=null?P.cryFrom:P.cryReady-3;return out((tn-from)/(P.cryReady-from),"Every 1d3 turns")}
  }
  return null}
{const s=SP("cry");if(s){const run=s.run;s.run=async()=>{me().cryFrom=tnOf(G.active);return run()}}}
function addBars(root){if(!root||!G)return;
  root.querySelectorAll("button[data-s],button[data-cast],button[data-buy],#robBank").forEach(b=>{
    const id=b.dataset.s||b.dataset.cast||b.dataset.buy||(b.id==="robBank"?"robbank":"");const sp=id&&SP(id);let bar=b.querySelector(":scope > .cdbar");
    const c=sp?coolOf(sp):null;if(!c){if(bar)bar.remove();return}
    if(!bar){bar=document.createElement("i");bar.className="cdbar";bar.setAttribute("aria-hidden","true");bar.innerHTML="<i></i>";b.appendChild(bar)}
    bar.style.setProperty("--f",c.f.toFixed(3));bar.style.setProperty("--cc",c.col);bar.classList.toggle("full",c.f>=1);bar.classList.toggle("empty",c.f<=0);b.classList.add("hascd")})}
{const _rs=renderSpells;renderSpells=function(live){_rs(live);addBars($("#spells"));addBars($("#bankslot"))}}
{const _fe=fillEther;fillEther=function(){_fe();addBars($("#etherpanel"))}}
{const _fd=fillDrawer;fillDrawer=function(){_fd();addBars($("#skypanel"))}}
/* the sky box: lit while its event is on */
{const _rd=render;render=function(){_rd.apply(this,arguments);if(!G)return;const M=$("#moon");if(M)M.classList.toggle("skylit",skyLit())}}

if(window.__EC)Object.assign(window.__EC,{coolOf,skyLit,moonStrip:()=>moonStrip(),moonInfoHTML:()=>moonInfoHTML()});
