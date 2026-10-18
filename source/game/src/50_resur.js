/* ---------------- v45: Resurrection, priced by the card ----------------
   Clicking Resurrection opens the grave to look through first: nothing is paid until a card is picked, and Cancel costs
   nothing. The price is 1d2 (rolled each round) plus the soul worth of the card raised, shown under every card; the cards
   you can't afford are greyed out. */
delete PRICE.resur;PRICE.resurd=()=>R(2);
const resurD=()=>G.prices&&G.prices.resurd!=null?G.prices.resurd:(G.prices=G.prices||{},G.prices.resurd=R(2));
const resurPrice=c=>resurD()+soulOf(c);
{const s=SP("resur");s.cost=0;s.dice="1d2 + worth";
  s.text="Look through the grave first, then raise one card into your hand. It costs 1d2 (rolled each round) plus that card's soul worth; nothing is paid until you pick.";
  SPELL_TEXT.resur={n:"Room in your hand.",e:"Look through the grave, then raise one card of your choice into your hand.",l:"Costs 1d2 (rolled each round) plus the soul worth of the card you raise. Nothing is paid until you pick; Cancel costs nothing."};
  s.run=async()=>{const pl=G.active,grave=G.grave;if(!grave.length)return;
    const prices=grave.map(resurPrice),offs=prices.map(n=>!canAfford(pl,n));
    const best=()=>{let b=null;grave.forEach((c,i)=>{if(offs[i])return;const v=AI.value({cards:[c],owner:pl});if(!b||v>b.v)b={i,v}});return b?b.i:null};
    const i=await ask(pl,{kind:"cards",id:"resur",title:`Resurrection: ${resurD()} (1d2 this round) + the card's worth`,sub:"Pick the card to raise. Nothing is paid until you pick; Cancel costs nothing.",cards:grave,prices,offs,cancel:"Cancel",box:"limbo",ai:best});
    if(i==null||!grave[i])return;
    const c=grave[i],cost=resurPrice(c);if(!canAfford(pl,cost)){if(!G.p[pl].cpu)flash("Not enough mana for that one.");return}
    if(me().hand.length>=handCap(pl)){flash("Your hand is full.");return}
    spend(pl,cost);noteBuy("resur");G.spentOther=true;grave.splice(grave.indexOf(c),1);c.owner=pl;G.p[pl].hand.push(c);
    tray(pl,"Resurrection",[{s:2,v:resurD()}],`+ ${soulOf(c)} = ${cost} mana`);
    log(`<b>Resurrection</b>: ${plName(pl)} pays ${cost} mana (${resurD()} + ${soulOf(c)}) and raises ${esc(nameOf(c))} from the grave.`,"event");render()}}
/* the spell list shows the price this round */
{const _rs=renderSpells;renderSpells=function(live){_rs(live);const b=document.querySelector('#spells [data-s="resur"] em');if(b&&G)b.textContent=`${resurD()} + worth`}}
