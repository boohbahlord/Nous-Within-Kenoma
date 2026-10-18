/* ---------------- Prompt 11 (v26): Mystery Generation ----------------
   Three cards wait face down. The price is a range (1d2 + 2d3: 3 to 8 mana) and is rolled when you pay. Once paid, all three are
   yours at once, in your deck, even if you close the window; reveal them one at a time by clicking, or all at once.
   Rarity has loot-box colors. Wildcards are 5% in all, each with its own share by strength (cards that come back as another card count
   as stronger); the Collector, Slave, Slavemaster and Trafficker never come out. A wildcard comes alone: its Substance's spells don't. */

const MYS_TIERS=[
  {k:"common",   name:"Common",   col:"#b9b4a8",p:47.5, pool:["2","3","4","5","6","7","8","9","10"]},
  {k:"uncommon", name:"Uncommon", col:"#5fbf5a",p:23.75,pool:["scout","archer","healer","repair","miner","ram"]},
  {k:"rare",     name:"Rare",     col:"#4c92e6",p:14.25,pool:["J","Q","K","assassin"]},
  {k:"epic",     name:"Epic",     col:"#a77de8",p:4.75, pool:["A","JK","wall"]},
  {k:"legendary",name:"Legendary",col:"#f0a030",p:4.75, pool:["cannon"]},
  {k:"mythic",   name:"Mythic",   col:"#e0453a",p:5,    pool:[]}];
/* a wildcard's power: its best attack on average × its hearts, × 1.5 if it comes back as another card; rounded to tens so equal
   strength means equal rarity. Its share of the 5% is the inverse of its power. */
const WILD_POWER={antony:50,goatbull:60,leviathan:70,samson:90,bullgoat:90,satan:120};
const WILD_SHARE=(()=>{const inv=Object.fromEntries(Object.entries(WILD_POWER).map(([k,v])=>[k,1/v]));const t=Object.values(inv).reduce((a,b)=>a+b,0);
  return Object.fromEntries(Object.entries(inv).map(([k,v])=>[k,5*v/t]))})();   // percent of all draws
const MYS_MIN=3,MYS_MAX=8;
const mysPrice=()=>[{s:2,v:R(2)},{s:3,v:R(3)},{s:3,v:R(3)}];
function mysteryRoll(pl){
  let x=Math.random()*100,tier=MYS_TIERS[0];
  for(const T of MYS_TIERS){if(x<T.p){tier=T;break}x-=T.p}
  let k,chance;
  if(tier.k==="mythic"){let y=Math.random()*5;for(const [w,s] of Object.entries(WILD_SHARE)){k=w;chance=s;if(y<s)break;y-=s}}
  else{k=pick(tier.pool);chance=tier.p/tier.pool.length}
  const c=UNIT[k]?mkUnit(k,pl):k==="JK"?mk("JK",null,pick(["red","black"])):mk(k,pick(["S","H","D","C"]));c.owner=pl;c.mys=tier.k;
  return {card:c,tier,chance}}
/* the purchase: three cards into the deck, the price rolled now */
function mysteryBuy(pl){
  const P=G.p[pl];if(!canAfford(pl,MYS_MAX))return null;
  const dice=mysPrice(),cost=dice.reduce((a,d)=>a+d.v,0);spend(pl,cost);
  const got=[0,1,2].map(()=>mysteryRoll(pl));for(const g of got)P.deck.push(g.card);shuffle(P.deck);
  tray(pl,"Mystery Generation",dice,`${cost} mana`);
  log(`<b>Mystery Generation</b>: ${plName(pl)} pays ${cost} mana and three brand-new cards are made from thin air into the deck: ${got.map(g=>`${esc(nameOf(g.card))} (${g.tier.name})`).join(", ")}.`,"event");
  return {cost,got}}
/* the computer buys straight away; a person gets the window */
mysteryGen=async function(pl){return !!mysteryBuy(pl)};
mysteryHTML=function(live){
  return `<div class="mystery"><div class="mhead">${unitSVG("mystery","var(--amber-hi)",34)}<div><b>Mystery Generation</b> · ${MYS_MIN} to ${MYS_MAX} mana<br><span class="dim">Three brand-new cards of any rarity, made from thin air into your deck. The price is rolled when you pay.</span></div></div>${live?`<button class="btn sm" id="mysBtn">Open</button>`:""}</div>`};
wireMystery=function(){if($("#mysBtn"))$("#mysBtn").onclick=()=>{if(!canAct())return;openMystery()}};

function mysCardHTML(g,i,shown){
  if(!shown)return `<button type="button" class="myscard back" data-i="${i}" aria-label="Reveal card ${i+1}"><span class="mysback">${unitSVG("mystery","#e6d38a",40)}</span></button>`;
  return `<div class="myscard shown" style="--rc:${g.tier.col}">${face(g.card,{noci:true})}<b>${g.tier.name}</b><small>${+g.chance.toFixed(2)}% chance per card</small></div>`}
function openMystery(){
  const pl=G.active,V=view();let buy=null;const shown=[false,false,false];
  const draw=()=>{
    const can=canAfford(pl,MYS_MAX);
    const legend=MYS_TIERS.map(T=>`<span style="--rc:${T.col}"><i></i>${T.name} ${T.p}%</span>`).join("");
    ovShow(`<div class="ovbox wide mysbox"><h2>Mystery Generation</h2>
<p class="dim">${buy?`Paid <b>${buy.cost}</b> mana. All three cards are already in your deck. Click a card to turn it over, or turn them all.`:`Three cards, face down. They cost ${MYS_MIN} to ${MYS_MAX} mana (1d2 + 2d3), rolled when you pay, and they are yours the moment you do.`}</p>
<div class="mysrow">${[0,1,2].map(i=>mysCardHTML(buy&&buy.got[i],i,buy&&shown[i])).join("")}</div>
<p class="acts">${buy?`<button class="btn" id="mysAll" ${shown.every(Boolean)?"disabled":""}>Turn them all</button>`:`<button class="btn" id="mysPay" ${can?"":"disabled"}>Pay ${MYS_MIN}–${MYS_MAX} mana</button>${can?"":`<small class="dim">You need ${MYS_MAX} mana, the most it can cost${G.p[pl].credit?"":", or credit at the Bank"}.</small>`}`}
<button class="btn ghost" id="mcancel">Close</button></p>
<div class="myslegend">${legend}</div></div>`);
    $("#mcancel").onclick=()=>{ovHide();render()};
    if($("#mysPay"))$("#mysPay").onclick=async()=>{if(!canAct()||buy)return;buy=await Promise.resolve(mysteryBuy(pl));if(buy&&buy.got)buy.got.forEach(g=>{if(!g.tier||!g.tier.col)g.tier=MYS_TIERS.find(T=>T.k===(g.tier&&g.tier.k))||MYS_TIERS[0]});render();draw()};
    if($("#mysAll"))$("#mysAll").onclick=()=>{shown.fill(true);draw()};
    $("#ov").querySelectorAll(".myscard.back").forEach(b=>b.onclick=()=>{if(!buy)return;shown[+b.dataset.i]=true;draw()});
  };
  draw();
}
/* the Leviathan rises to the moon only for a player who is the Leviathan */
{const s=SP("lev");if(s){const ok=s.ok;s.ok=()=>me().tribe==="leviathan"&&ok()}}
if(window.__EC){window.__EC.mysteryRoll=mysteryRoll;window.__EC.mysteryBuy=mysteryBuy}
