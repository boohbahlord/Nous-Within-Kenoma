/* ---------------- Prompt 12, part 2a (v27): three new Oaths, Saturn's eclipse, Venus's eclipse ----------------
   Oath of the Sun: the Second Sun's blessing — fire mana (3 at most, 6 with the surplus) from sacrifices to the Sun and from its
     judgement; Scorched Earth and Blindness are paid with it.
   Oath of the Moon: more from the New Moon, more at the Full Moon; a Joker must shoot itself before each Full Moon; Moon Jokers.
   Oath of Saturn: paid tolls bring Puppets that fight for you; a missed toll is a betrayal, and Saturn's Puppets come for you.
   Saturn gets an eclipse (one outcome, rolled on d100). Venus's eclipse also heals and can mend a betrayal. */

/* ---------- which sky each Oath needs ---------- */
OATH_SKY.sun="sun";OATH_SKY.moon="moon";OATH_SKY.saturn="saturn";
OATHS.splice(0,OATHS.length,["earth","No necromancy"],["sun","Not the Firmament"],["moon","A Joker each Full Moon"],["saturn","Pays Saturn"],["venus","No attacks"],["jupiter","Cheaper conjuring"],["mercury","Betrayal and bounties"]);
Object.assign(OATH_ONLY,{scorch:"sun",sunblind:"sun",moonjoker:"moon"});
const oathNow=(pl,k)=>oathOf(pl)===k;
/* v50: an Oath no longer ends when the sky changes; only eating its Heavenly Body ends it */

/* ---------- the Oath spells ---------- */
const OATH_TXT={
  sun:{n:"Any sky. Not for the Firmament.",e:"The Sun's blessing: you gain fire mana (3 at most, 6 for a round) by sacrificing cards to the Sun, and from every judgement it takes from you. Fire mana pays for Scorched Earth and Blindness.",l:"Cast again to break the Oath. The Sun still judges you."},
  moon:{n:"Any sky. With no Moon up, its Full Moon still comes every 8 rounds.",e:"Every New Moon, 2d2 − 1 more cards from the grave. Every Full Moon, +2 mana and +2 maximum. Grave Blessing rolls one more die. Jokers conjure for one less, and twice between Full Moons you can conjure a Moon Joker from nowhere. A Joker that shoots itself at the New Moon goes back into your deck, and under a Blood Moon your dead don't fall into the Outer Darkness.",l:"A Joker of yours must shoot itself before each Full Moon. If none does, you get no grave cards at the next New Moon and lose one maximum mana."},
  saturn:{n:"Any sky. Not for the Firmament or Binah.",e:"Each Bank report in good standing: +10% of your mana (at least 1) and +1 maximum for good. While Saturn is up, pay its toll and Saturn sends Puppets to fight for you: one stack of 1d4 after the first toll, two after the third and the sixth, three after the ninth. The computer moves them.",l:"Breaking it costs all your mana, 5 random deck cards, 2 random hand cards and 2 maximum. Miss one toll and you betray Saturn: no Puppets for the next three tolls, Saturn's own Puppets come for you three turns after every missed toll, and you can no longer break the Oath."}
};
SPELLS.push(
 {id:"oath_sun",name:"Oath of the Second Sun",cost:0,school:"Astrology",text:"",ok:()=>oathFree("sun")&&me().tribe!=="firm",run:async()=>{toggleOath("sun")}},
 {id:"oath_moon",name:"Oath of the Moon",cost:0,school:"Astrology",text:"",ok:()=>oathFree("moon"),run:async()=>{toggleOath("moon");const P=me();if(P.oath==="moon")P.moonDone=false}},
 {id:"oath_saturn",name:"Oath of Saturn",cost:0,school:"Astrology",text:"",ok:()=>oathFree("saturn")&&(planetUp("saturn")?paysSaturn(G.active):!["firm","binah"].includes(me().tribe)),run:async()=>{toggleOath("saturn")}},
 {id:"scorch",name:"Scorched Earth",cost:0,school:"Astrology",fire:true,dice:"1d2+2 fire",text:"",
  ok:()=>oathNow(G.active,"sun")&&fireOf(G.active)>=fireCost(SP("scorch")),run:async()=>{await scorchedEarth(G.active)}},
 {id:"sunblind",name:"Blindness",cost:0,school:"Astrology",fire:true,dice:"2+1d2 fire",text:"",
  ok:()=>oathNow(G.active,"sun")&&fireOf(G.active)>=fireCost(SP("sunblind"))&&enemiesOf(G.active).some(e=>!isNPC(e)&&!isHorde(e)),run:async()=>{await castBlindness(G.active)}},
 {id:"moonjoker",name:"Moon Joker",cost:1,school:"Conjuring",text:"",
  ok:()=>oathNow(G.active,"moon")&&(me().moonJokers||0)<2,run:async()=>{const P=me(),c=mk("JK",null,pick(["red","black"]));c.owner=G.active;P.deck.push(c);shuffle(P.deck);P.moonJokers=(P.moonJokers||0)+1;
   log(`A Moon Joker is made from nothing into ${plName(G.active)}'s deck (${P.moonJokers} of 2 before the Full Moon).`,"event")}}
);
PRICE.scorch=()=>R(2)+2;PRICE.sunblind=()=>2+R(2);
Object.assign(SPELL_TEXT,{
 oath_sun:OATH_TXT.sun,oath_moon:OATH_TXT.moon,oath_saturn:OATH_TXT.saturn,
 scorch:{n:"The Oath of the Second Sun. Choose any tile.",e:"The ground burns in a circle two tiles around it, the middle included, for 1d3 turns. Each turn a stack standing in the fire takes one damage on a 4 of 1d4, your own included.",l:"Paid with fire mana. It never takes the last heart of an Ace or the Tree."},
 sunblind:{n:"The Oath of the Second Sun. Choose an enemy player.",e:"From the start of the next round to its end they are blind: they see nothing on the field, not even their own cards.",l:"Paid with fire mana. They are told what happened."},
 moonjoker:{n:"The Oath of the Moon.",e:"A new Joker, made from nothing (not from the Ether), comes into your deck.",l:"Twice between Full Moons."}});
for(const id of ["oath_sun","oath_moon","oath_saturn","scorch","sunblind","moonjoker"]){const s=SP(id),t=SPELL_TEXT[id];s.text=[t.n,t.e,t.l].filter(Boolean).join(" ")}

/* ---------- fire mana ---------- */
const FIRE_MAX=3,FIRE_SUR=6;
const fireOf=pl=>G.p[pl]?G.p[pl].fire||0:0;
const fireCost=sp=>G&&G.prices&&G.prices[sp.id]!=null?G.prices[sp.id]:PRICE[sp.id]?PRICE[sp.id]():0;
function giveFire(pl,n){const P=G.p[pl];const before=P.fire||0;P.fire=Math.min(FIRE_SUR,before+n);return P.fire-before}
{const _sc=spellCost;spellCost=function(sp){if(sp&&sp.fire)return 0;let c=_sc(sp);
  if(sp&&sp.id==="cjk"&&G&&oathNow(G.active,"moon"))c=Math.max(0,c-1);   // the Moon's Jokers come cheaper
  return c}}
function payFire(pl,sp){const n=fireCost(sp);G.p[pl].fire=Math.max(0,fireOf(pl)-n);return n}
/* sacrificing to the Sun: the card's worth in fire mana, the card burns to the grave */
function sacrificeToSun(card,from){
  const pl=G.active,P=me();if(!oathNow(pl,"sun"))return false;   // v50: the Second Sun need not be in the sky
  if(fireOf(pl)>=FIRE_SUR){flash(`You hold ${FIRE_SUR} fire mana, the most there can be.`);return false}
  if(from==="hand")P.hand.splice(P.hand.indexOf(card),1);
  else{const st=G.board[from.r][from.c];st.cards.splice(st.cards.indexOf(card),1);
    if(card.captured&&card.captured.length){for(const s of card.captured)toGrave(s,"death");card.captured=[]}
    if(!st.cards.length){G.board[from.r][from.c]=null;G.sel=null}else if(G.sel)G.sel.pick.delete(card.id)}
  const got=giveFire(pl,soulOf(card));toGrave(card,"burn");
  log(`${plName(pl)} sacrifices ${esc(nameOf(card))} to the Second Sun (+${got} fire mana, ${fireOf(pl)} in all).`);
  if(from!=="hand")checkWin();return true}
/* the Sun's judgement gives a sworn player back its worth in fire mana */
function sunPayback(pl,worth){if(!oathNow(pl,"sun")||worth<=0)return;const g=giveFire(pl,worth);if(g)log(`The Sun's blessing: ${plName(pl)} gets ${g} fire mana back for the judgement.`)}

/* ---------- Scorched Earth and Blindness ---------- */
/* a tile picked on the field: a person clicks, the computer is told */
function aimTile(pl,title,valid,aiPick){
  if(G.p[pl].cpu)return Promise.resolve(aiPick());
  return new Promise(res=>{G.aim={title,valid,res,pl};render()})}
function endAim(v){const A=G.aim;if(!A)return;G.aim=null;A.res(v);render()}
{const _tc=tileClick;tileClick=function(r,c){
  if(G&&G.aim){if(G.aim.valid(r,c))endAim([r,c]);else flash("Choose one of the marked tiles.");return}
  const st=G&&G.board[r]&&G.board[r][c];
  if(st&&st.sat&&!G.selHand&&st.owner===view()&&!(G.sel&&G.mode)){flash("Saturn's Puppets move on their own.");return}
  return _tc(r,c)}}
const circle2=(r,c)=>{const o=[];for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const rr=r+dr,cc=c+dc;if(Math.hypot(dr,dc)<=2.25&&rr>=0&&cc>=0&&rr<G.rows&&cc<COLS&&!isVoid(rr,cc))o.push([rr,cc])}return o};
async function scorchedEarth(pl){
  const sp=SP("scorch"),foes=enemiesOf(pl).flatMap(stacksOf);
  const t=await aimTile(pl,"Scorched Earth: choose the middle of the fire",(r,c)=>!isVoid(r,c),()=>{
    let best=null;for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){if(isVoid(r,c))continue;const a=circle2(r,c);
      const s=a.reduce((v,[rr,cc])=>{const st=G.board[rr][cc];return v+(st?(isEnemy(st.owner,pl)?AI.value(st):st.owner===pl?-1.4*AI.value(st):0):0)},0);if(!best||s>best.s)best={s,r,c}}
    return best&&best.s>0?[best.r,best.c]:null});
  if(!t){giveFire(pl,0);log(`${plName(pl)} lets the fire go out before it starts.`);return}
  const n=payFire(pl,sp),turns=R(3),[r,c]=t,area=circle2(r,c);
  G.fires=G.fires||[];for(const [rr,cc] of area)G.fires.push({r:rr,c:cc,untilT:G.turnNo+turns,scorch:true,by:pl,turns});   // v71: 1d3 turns, as the rule was written
  log(`<b>Scorched Earth</b>: ${plName(pl)} pays ${n} fire mana and the ground burns around ${coord(r,c)} for ${turns} turn${turns>1?"s":""} (${area.length} tiles).`,"event");
  notify(null,`Scorched Earth: the ground burns around ${coord(r,c)}.`);
}
const scorchAt=(r,c)=>(G.fires||[]).some(f=>f.scorch&&f.r===r&&f.c===c&&(f.untilT!=null?f.untilT>=G.turnNo:f.until>=G.moon.round));
/* at the start of a player's turn: each of their stacks in the scorched ground takes one damage on a 4 of 1d4 */
function scorchTurn(pl){
  for(const {st,r,c} of stacksOf(pl)){if(!scorchAt(r,c)||R(4)!==4)continue;
    const base=st.cards.find(x=>kind(x)==="ace"||x.unit==="tree");
    if(base&&base.hp<=1){log(`The scorched ground can't take the last heart of ${plName(pl)}'s ${nameOf(base)} on ${coord(r,c)}.`);continue}
    log(`The scorched ground burns ${plName(pl)}'s stack on ${coord(r,c)}.`,"event");damage(r,c,1,false)}
}
async function castBlindness(pl){
  const sp=SP("sunblind"),foes=enemiesOf(pl).filter(e=>!isNPC(e)&&!isHorde(e)&&!G.p[e].out);
  const t=foes.length===1?foes[0]:await ask(pl,{kind:"player",id:"sunblind",title:"Blindness: who goes blind?",players:foes,ai:()=>foes.sort((a,b)=>strength(b)-strength(a))[0]});
  if(t==null){log(`${plName(pl)} holds the Sun's blindness back.`);return}
  const n=payFire(pl,sp),P=G.p[t];P.blindRound=G.moon.round+1;G.histTarget=t;
  log(`<b>Blindness</b>: ${plName(pl)} pays ${n} fire mana. ${plName(t)} will be blind for the whole of the next round.`,"event");
  notify(t,`${esc(P.name)} will be blind next round: the Sun's blessing of ${esc(G.p[pl].name)}.`);
}
const totalBlind=V=>!!(G&&V!=null&&G.p[V]&&(G.p[V].blindRound===G.moon.round||sunBlind(V)));
/* blindness hides everything on the field, your own cards too, behind a dark veil */


/* ---------- the Oath of the Moon ---------- */
const fullIn=()=>G.moon.gone?(8-G.moon.round%8)%8:(4-G.moon.i+8)%8;   // rounds until the next Full Moon (0: this round); with no Moon up, every 8th round
const moonFullNow=()=>G.moon.gone?G.moon.round>0&&G.moon.round%8===0:G.moon.i===4;
const MOON_WORDS=["A Joker must commit itself.","Before the Full Moon, a Joker dies by its own hand.","The Moon asks for a Joker.","A Joker must give itself to the Moon.","The Moon waits for a Joker's death."];
function moonOathRow(V){
  const P=G.p[V];if(!P||!oathNow(V,"moon"))return "";
  const n=fullIn(),done=P.moonDone;
  return `<div class="moonreq${done?" done":""}">${done?"The Moon is answered: a Joker gave itself.":`<b class="bl">${n===0?"The Full Moon is here.":`${n} round${n===1?"":"s"} to the Full Moon.`}</b> A Joker of yours must shoot itself (Sacrificial Suicide) before then.`}</div>`}
{const _mi=moonInfoHTML;moonInfoHTML=function(){
  const V=view(),P=G.p[V];
  if(P&&oathNow(V,"moon")&&!P.moonDone&&G.moonWhisper!==G.moon.round){G.moonWhisper=G.moon.round;
    return `<div class="cin sky whisper"><p class="bl">${pick(MOON_WORDS)}</p></div>`}
  let h=_mi.apply(this,arguments);
  if(P&&oathNow(V,"moon"))h=h.replace('</ul>',`<li>${P.moonDone?"Your Oath of the Moon is kept: a Joker gave itself.":`Your Oath of the Moon: a Joker must shoot itself within ${fullIn()} round${fullIn()===1?"":"s"}.`}</li></ul>`);
  return h}}
function moonWhisper(){
  const V=view(),P=G.p[V];if(!P||P.cpu||!oathNow(V,"moon")||P.moonDone)return;
  let w=$("#whisper");if(!w){w=document.createElement("div");w.id="whisper";w.setAttribute("aria-hidden","true");document.body.appendChild(w)}
  w.textContent=pick(MOON_WORDS);w.style.left=(8+Math.random()*55)+"vw";w.style.top=(18+Math.random()*55)+"vh";w.className="on";
  setTimeout(()=>{w.className=""},4200)}
{const _sk=skyCapMod;skyCapMod=function(P){let m=_sk(P);if(P&&G&&moonFullNow()&&P.oath==="moon")m+=2;return m}}
{const _nm=newMoonGift;newMoonGift=async function(){
  if(G.noGraveNext&&!G.moon.blood)return _nm();
  // a player who broke the Moon's demand gets nothing from this New Moon
  const skip=G.p.filter(P=>P.moonNoGrave&&!P.out);
  if(skip.length){log(`${skip.map(P=>plName(P.i)).join(", ")} get${skip.length===1?"s":""} nothing from this New Moon: no Joker gave itself before the Full Moon.`,"event")}
  await _nm();
  for(const pl of order()){const P=G.p[pl];if(P.moonNoGrave){P.moonNoGrave=false;continue}
    if(G.moon.blood||!oathNow(pl,"moon")||!G.grave.length)continue;
    const d=rollN(2,2),n=sum(d)-1;tray(pl,"Oath of the Moon",d,`+${n} from the grave`);log(`The Oath of the Moon: ${plName(pl)} rolls 2d2 − 1 = ${n} more from the grave.`);render();
    await pickGrave(pl,n,"Oath of the Moon")}
}}
/* the New Moon gift skips a player who failed the Moon: patched pickGrave refuses them once */
{const _pg=pickGrave;pickGrave=async function(pl,n,title){if(G.p[pl].moonNoGrave&&(title==="New Moon"||title==="Blood Moon"))return 0;return _pg(pl,n,title)}}
/* a Joker's suicide answers the Moon; at the New Moon the Joker goes back into the deck */
{const _js=jokerSuicide;jokerSuicide=async function(r,c,st,pl){
  if(!isHorde(pl)&&G.p[pl]&&oathNow(pl,"moon"))G.p[pl].moonDone=true;
  G._moonBack=!isHorde(pl)&&oathNow(pl,"moon")&&G.moon.i===0&&!G.moon.gone&&!G.moon.blood?pl:null;
  try{await _js(r,c,st,pl)}finally{G._moonBack=null}}}
{const _tg=toGrave;toGrave=function(c,cause){
  if(c&&G&&G._moonBack!=null&&kind(c)==="joker"&&cause==="death"&&c.owner===G._moonBack){const P=G.p[G._moonBack];P.deck.push(c);shuffle(P.deck);G._moonBack=null;log(`The New Moon gives ${plName(P.i)}'s Joker back: it returns to the deck.`,"event");return}
  if(c&&G&&(G.moon.blood||warOD())&&cause==="death"&&c.owner!=null&&G.p[c.owner]&&oathNow(c.owner,"moon")&&!(c.unit&&!UNIT[c.unit].ether)){G.grave.push(c);return}   // the Moon keeps its own from the Outer Darkness
  return _tg(c,cause)}}

/* ---------- the Oath of Saturn ---------- */
function paysSaturn(pl){const S=G.saturnBy,P=G.p[pl];if(!P||isHorde(pl)||isNPC(pl))return false;
  if(P.tribe==="firm"||P.tribe==="binah")return false;return S==null||isEnemy(pl,S)}
const SAT_MILES={1:1,3:2,6:2,9:3};
function saturnPaid(pl,paid,owed){
  const P=G.p[pl];if(!oathNow(pl,"saturn")||paid<owed)return;
  if(P.satBlock>0){P.satBlock--;log(`Saturn remembers ${plName(pl)}'s betrayal: no Puppets for this toll (${P.satBlock} more).`);return}
  P.satPaid=(P.satPaid||0)+1;const k=SAT_MILES[P.satPaid];
  if(k){const n=spawnPuppets(pl,k,false);if(n){log(`<b>Saturn</b> is paid (${P.satPaid} toll${P.satPaid>1?"s":""}): ${n} stack${n>1?"s":""} of Puppets rise to fight for ${plName(pl)}.`,"event");notify(pl,`Saturn sends ${esc(P.name)} ${n} stack${n>1?"s":""} of Puppets.`)}}
}
function saturnMissed(pl){
  const P=G.p[pl];if(!oathNow(pl,"saturn"))return;
  if(!P.satLocked)popup("You betray Saturn",`<p>${plName(pl)} missed Saturn's toll while under its Oath.</p><p>For the next three tolls Saturn sends no Puppets. Three turns after every missed toll, Saturn's own Puppets come for ${plName(pl)}. The Oath can no longer be broken.</p>`,pl);
  P.satLocked=true;P.satBlock=3;P.satOwed=(P.satOwed||0)+1;if(P.satHostAt==null)P.satHostAt=tnOf(pl)+3;
  log(`${plName(pl)} betrays Saturn: no Puppets for three tolls, and Saturn's Puppets will come.`,"event");
}
/* Saturn's hostile Puppets: every three of the betrayer's turns, one stack for every toll missed since the last */
function saturnHostTurn(pl){
  const P=G.p[pl];if(P.satHostAt==null||tnOf(pl)<P.satHostAt)return;
  const n=P.satOwed||0;P.satOwed=0;P.satHostAt=n?tnOf(pl)+3:null;if(!n)return;
  const k=spawnPuppets(pl,n,true);if(k)log(`<b>Saturn</b> sends ${k} stack${k>1?"s":""} of Puppets after ${plName(pl)} for the missed toll${n>1?"s":""}.`,"event");
}
function freeTilesNear(pl,hostile){
  const out=[],mine=stacksOf(pl),mid=[(G.rows-1)/2,(COLS-1)/2],side=new Set([pl,...alliesOf(pl)].flatMap(i=>zoneTiles(i).map(t=>t.join())));
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){if(G.board[r][c]||isVoid(r,c))continue;
    const dMine=mine.length?Math.min(...mine.map(x=>Math.abs(x.r-r)+Math.abs(x.c-c))):9,dMid=Math.hypot(r-mid[0],c-mid[1]);
    const score=hostile?(dMine>=2?dMine:99):(side.has(r+","+c)?0:dMid)+Math.random();out.push([r,c,score])}
  return out.sort((a,b)=>a[2]-b[2])}
/* a stack of 1d4 Puppets: for the player (theirs, moved by the computer), or Saturn's own, hunting the betrayer */
function spawnPuppets(pl,stacks,hostile){
  const S=npcIx("saturn");if(hostile&&S<0)return 0;let n=0;const tiles=freeTilesNear(pl,hostile);
  for(let i=0;i<stacks&&tiles.length;i++){const [r,c]=tiles.shift();const owner=hostile?S:pl,k=R(4);
    const cards=Array.from({length:k},()=>{const p=mk("2",pick(["S","H","D","C"]));p.puppet=true;p.owner=owner;return p});
    G.board[r][c]={owner,cards,moved:true,attacked:true,hypo:0,sat:!hostile,hunt:hostile?pl:null};n++}
  render();return n}
/* the player's Saturn Puppets act for them at the end of the player's turn (a computer player moves them itself) */
function saturnAllies(pl){
  if(G.p[pl].cpu)return;
  for(const x of stacksOf(pl).filter(x=>x.st.sat)){const {st}=x;let r=x.r,c=x.c;if(G.board[r][c]!==st)continue;st.attacked=false;st.moved=false;
    const tryHit=()=>{let best=null;for(const o of attackOptions(r,c)){if(o.mode==="capture"||o.mode==="destroy")continue;const E=G.board[o.r][o.c];if(!E||!isEnemy(E.owner,pl))continue;const p=AI.winP(st,E,24,o.mode),s=p*AI.value(E);if(p>=.4&&(!best||s>best.s))best={o,s}}
      if(best){attack(r,c,best.o.r,best.o.c,best.o.mode);return true}return false};
    if(tryHit())continue;
    // protect what is threatened most, or close in on the nearest enemy
    const foes=enemiesOf(pl).flatMap(stacksOf),mine=stacksOf(pl).filter(y=>!y.st.sat);
    const threat=mine.map(m=>({m,d:Math.min(9,...foes.map(f=>Math.abs(f.r-m.r)+Math.abs(f.c-m.c)))})).filter(t=>t.d<=2).sort((a,b)=>a.d-b.d)[0];
    const goal=threat?threat.m:foes.sort((a,b)=>(Math.abs(a.r-r)+Math.abs(a.c-c))-(Math.abs(b.r-r)+Math.abs(b.c-c)))[0];if(!goal)continue;
    let step=null;for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc)||G.board[rr][cc])continue;if(peaceOn()&&G.zone[rr]&&G.zone[rr][cc]>=0&&G.zone[rr][cc]!==pl)continue;
      const d=Math.abs(goal.r-rr)+Math.abs(goal.c-cc);if(d<Math.abs(goal.r-r)+Math.abs(goal.c-c)&&(!step||d<step.d))step={rr,cc,d}}
    if(step){G.board[step.rr][step.cc]=st;G.board[r][c]=null;st.moved=true;r=step.rr;c=step.cc;tryHit()}
  }
}
/* Saturn's own Puppets: chase whoever they were sent after; wild ones strike anyone beside them but Saturn's sworn */
async function saturnNPC(){
  const S=npcIx("saturn");if(S<0)return;
  for(const {st,r,c} of stacksOf(S)){if(G.over||G.board[r][c]!==st)continue;st.attacked=false;st.moved=false;
    const who=st.hunt;
    const ok=E=>E&&!isNPC(E.owner)&&(who!=null?E.owner===who:!satSafe(E.owner));
    let o=attackOptions(r,c).find(o=>o.mode!=="capture"&&o.mode!=="destroy"&&ok(G.board[o.r][o.c]));
    if(!o&&who!=null){if(!G.p[who]||G.p[who].out){G.board[r][c]=null;continue}
      const tl=stacksOf(who);if(!tl.length)continue;const dist=(a,b)=>Math.min(...tl.map(x=>Math.abs(x.r-a)+Math.abs(x.c-b)));let best=null;
      for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc)||G.board[rr][cc])continue;const d=dist(rr,cc);if(d<dist(r,c)&&(!best||d<best.d))best={rr,cc,d}}
      if(best){G.board[best.rr][best.cc]=st;G.board[r][c]=null;st.moved=true;o=attackOptions(best.rr,best.cc).find(o=>o.mode!=="capture"&&o.mode!=="destroy"&&ok(G.board[o.r][o.c]));if(o){attack(best.rr,best.cc,o.r,o.c,o.mode);render();await sleep(300)}}
      continue}
    if(o){attack(r,c,o.r,o.c,o.mode);render();await sleep(300)}
  }
}
{const _an=addNPCs;addNPCs=function(){_an();if(survival())return;const i=G.p.length,P=mkPlayer(i,{name:"Saturn's Puppets",color:"#9a8a5a",solid:"dodeca",cpu:"npc"});P.npc="saturn";P.team=100+i;G.p.push(P);
  G.map.seats[i]={side:"none",rot:0,fwd:[0,0],back:[],zone:[]}}}

/* ---------- Saturn's eclipse: one outcome, rolled on d100 ---------- */
const SAT_ECL=[[5,"collapse"],[25,"collectors"],[20,"grunts"],[25,"meteor"],[10,"tithe"],[5,"banker"],[10,"strict"]];
const satSafe=pl=>oathNow(pl,"saturn")||good4(pl);
const good4=pl=>{const s=G.p[pl]&&G.p[pl].standing||[];return s.length>=4&&s.slice(0,4).every(Boolean)};   // v50: four Reports in good standing: Saturn's eclipse passes you by
async function saturnEclipse(){
  let x=R(100),k="meteor";for(const [p,id] of SAT_ECL){if(x<=p){k=id;break}x-=p}
  G.eclipse={k:"saturn",round:G.moon.round,what:k};applyMoonTheme();
  log(`<b>An eclipse of Saturn.</b>`,"event");
  const B=G.bank,pls=realPlayers();let html="";
  if(k==="collapse"){html="<p>The rings darken and the markets fall: <b>the Bank collapses</b>.</p><p class='dim'>Those under the Oath of Saturn are spared unless they are 6 or more in mana debt, and so is anyone in good standing for the last four Reports.</p>";if(B&&!B.dead)collapse();else html+="<p class='dim'>(There is no Bank left to fall.)</p>"}
  if(k==="collectors"){const T=pls.filter(i=>effMana(i)<-3&&!satSafe(i));const bk=npcIx("bank");let n=0;
    for(const pl of T){if(bk<0)break;const t=freeTilesNear(pl,true)[0];if(!t)continue;G.board[t[0]][t[1]]={owner:bk,cards:[mkUnit("debt",bk)],moved:true,attacked:true,hunt:pl};n++}
    html=`<p>Saturn's shadow falls on the debtors: <b>Debt Collectors</b> rise after everyone more than 3 mana in debt${T.length?`: ${T.map(plName).join(", ")}`:" (no one is)"}.</p>`}
  if(k==="grunts"){const S=npcIx("saturn");let n=0;if(S>=0){const mid=[(G.rows-1)/2,(COLS-1)/2],zones=new Set(G.p.flatMap((P,i)=>isNPC(i)?[]:seat(i).zone.map(t=>t.join())));
    const tiles=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!G.board[r][c]&&!isVoid(r,c)&&!zones.has(r+","+c))tiles.push([r,c]);tiles.sort((a,b)=>Math.hypot(a[0]-mid[0],a[1]-mid[1])-Math.hypot(b[0]-mid[0],b[1]-mid[1]));
    for(let i=0;i<3&&tiles.length;i++){const [r,c]=tiles.shift();const cards=Array.from({length:R(4)},()=>mk(String(1+R(5)),pick(["S","H","D","C"])));cards.forEach(q=>q.owner=S);G.board[r][c]={owner:S,cards,moved:true,attacked:true,wild:true};n++}}
    html=`<p>Saturn spits out <b>${n} stack${n===1?"":"s"} of Grunts</b>. They fight anyone beside them, except those under its Oath and those in good standing with the Bank for four Reports.</p>`}
  if(k==="meteor"){html="<p>Something falls from Saturn's ring: <b>a meteor</b>.</p>";meteor()}
  if(k==="tithe"){const hit=pls.filter(i=>!satSafe(i));for(const pl of hit){const P=G.p[pl];P.maxAdd=(P.maxAdd||0)-3;for(const c of takeDeck(pl,3,"Saturn's tithe",true))toGrave(c,"burn");payQuiet(pl,Math.min(3,mana(pl)))}
    html=`<p>Saturn takes its tithe: <b>three maximum mana, three deck cards and three mana</b> from ${hit.length?hit.map(plName).join(", "):"no one"}.</p>`}
  if(k==="banker"){if(B&&!B.dead){B.dead=true;html="<p>The Banker looks up at the dark ring, clutches his chest and falls over the ledger. <b>The Bank is closed</b> and the Ether shuts its doors.</p>"}else html="<p>Saturn's shadow passes over an empty Bank.</p>"}
  if(k==="strict"){G.satStrict=true;G.satStrictSafe=realPlayers().filter(good4);html="<p>Saturn binds the economy: <b>no surplus mana for the rest of the game</b>, and Debt Collectors come more often for debts to the Bank or to Saturn.</p><p class='dim'>Those under the Oath of Saturn, and those in good standing for the last four Reports, are spared.</p>"}
  popup("Saturn eclipsed",html);render();checkWin();
}
{const _ec=eclipse;eclipse=async function(k){if(k==="saturn")return saturnEclipse();return _ec(k)}}
{const _ee=endEclipse;endEclipse=function(){if(G.eclipse&&G.eclipse.k==="saturn"){G.eclipse=null;log("The eclipse of Saturn passes.");applyMoonTheme();G._vis=null;return}return _ee()}}
{const _er=eclipseRound;eclipseRound=async function(){await _er();if(G.over)return;
  if(sky()==="saturn"&&!G.eclipse&&(ecCycleNow("saturn")&&Math.random()<.05||G.opts.eclipseStart&&!G.eclipsedOnce||G.forceEclipse)){G.forceEclipse=false;G.eclipsedOnce=true;await saturnEclipse()}}}

/* ---------- Venus's eclipse also heals every card, and can mend a betrayal ---------- */
{const _ec2=eclipse;eclipse=async function(k){await _ec2(k);if(k!=="venus")return;
  let healed=0;for(const st of G.board.flat())if(st)for(const c of st.cards)if(c.hp!=null&&c.hp<c.maxHp){c.hp=c.maxHp;healed++}
  log(`Venus's eclipse heals every card on the field${healed?` (${healed})`:""}.`,"event");
  for(const b of [...(G.betrayed||[])]){const pls=[b.by,...b.mates].filter(i=>G.p[i]&&!G.p[i].out);if(pls.length<2)continue;let all=true;
    for(const pl of pls){const yes=await ask(pl,{kind:"yesno",id:"venusmend",title:`Venus eclipsed: ${esc(G.p[pl].name)}`,text:`Venus offers to mend the betrayal of ${plName(b.by)}. Will you stand on one team again with ${pls.filter(i=>i!==pl).map(plName).join(" and ")}?`,yes:"Rejoin",no:"Refuse",ai:()=>aiVote(pl,"Peace")});if(!yes){all=false;break}}
    if(all){for(const pl of pls)G.p[pl].team=b.team;G.betrayed.splice(G.betrayed.indexOf(b),1);G._vis=null;log(`<b>Venus mends the betrayal</b>: ${pls.map(plName).join(" and ")} are one team again.`,"event");popup("A betrayal mended",`<p>Under the eclipse of Venus, ${pls.map(plName).join(" and ")} stand together again.</p>`)}
    else log(`The betrayal of ${plName(b.by)} stays unmended.`)}
}}
/* remember who betrayed whom, so Venus can mend it */
{const s=SP("betray");if(s){const run=s.run;s.run=async()=>{const pl=G.active,team=G.p[pl].team,mates=alliesOf(pl).filter(i=>!isHorde(i));await run();
  if(G.p[pl].team!==team)(G.betrayed=G.betrayed||[]).push({by:pl,team,mates})}}}

/* ---------- the strict economy and the collapse ---------- */
{const _cl=collapse;collapse=function(){
  const keep=realPlayers().filter(i=>oathNow(i,"saturn")&&effMana(i)>-6||good4(i)).map(i=>{const P=G.p[i];return {i,souls:[...P.souls],debt:P.debt,loans:[...(P.loans||[])],maxAdd:P.maxAdd,deck:[...P.deck],board:stacksOf(i).map(x=>({r:x.r,c:x.c,st:x.st,cards:[...x.st.cards]}))}});
  _cl();
  for(const k of keep){const P=G.p[k.i];P.souls=k.souls;P.debt=k.debt;P.loans=k.loans;P.maxAdd=k.maxAdd;P.deck=k.deck;
    for(const b of k.board){b.st.cards=b.cards;G.board[b.r][b.c]=b.st}
    G.ether=G.ether.filter(c=>!k.deck.includes(c)&&!k.board.some(b=>b.cards.includes(c)));
    log(`Saturn shields ${plName(k.i)} from the collapse.`,"event")}
  render()}}
{const _bc=bankCollectors;bankCollectors=async function(){if(G.satStrict)G.collNext=Math.min(G.collNext||0,G.moon.round);return _bc()}}

/* ---------- the turn and the round ---------- */
{const _st=substanceTurn;substanceTurn=function(pl){_st(pl);scorchTurn(pl);saturnHostTurn(pl)}}
{const _et=endTurn;endTurn=function(pl){if(G.p[pl]&&!G.p[pl].out&&!isHorde(pl))saturnAllies(pl);return _et(pl)}}
{const _nr=newRound;newRound=async function(){await _nr();if(G.over)return;await oathRound()}}
async function oathRound(){
  // fire mana: the surplus over 3 fades with the round
  for(const P of G.p)if((P.fire||0)>FIRE_MAX){P.fire=FIRE_MAX}
  // the Full Moon checks the Moon's demand
  if(moonFullNow()){
    for(const pl of realPlayers()){const P=G.p[pl];if(!oathNow(pl,"moon"))continue;
      const got=giveMana(pl,2);log(`The Full Moon keeps its Oath: ${plName(pl)} gets ${got} mana and two more maximum this round.`);
      if(!P.moonDone){P.maxAdd=(P.maxAdd||0)-1;P.moonNoGrave=true;log(`${plName(pl)} broke the Moon's demand: no Joker gave itself. One maximum mana is lost, and the next New Moon gives nothing.`,"event");
        popup("The Moon is not answered",`<p>No Joker of ${plName(pl)}'s shot itself before the Full Moon.</p><p>One maximum mana is lost, and the next New Moon gives ${plName(pl)} nothing from the grave.</p>`,pl)}
      P.moonDone=false;P.moonJokers=0}
  }
  // blindness this round: tell the blind
  for(const pl of realPlayers()){const P=G.p[pl];if(P.blindRound===G.moon.round){G._vis=null;
    popup("You are blind",`<p>${plName(pl)} is blinded by the Second Sun for this whole round.</p><p>You see nothing on the field, not even your own cards. It ends when the round does.</p>`,pl)}}
  await saturnNPC();
  if(Math.random()<.6)setTimeout(moonWhisper,1500+Math.random()*6000);
  render();
}

/* ---------- the computer and the Oaths ---------- */
{const _ap=aiPlanets;aiPlanets=async function(pl,W,cast1){await _ap(pl,W,cast1);if(G.over)return;const P=G.p[pl],lv=P.cpu;
  if(sunUp()&&P.oath!=="sun"&&P.tribe!=="firm"&&P.oath!=="earth"&&Math.random()<(lv==="hard"?.5:.25))await cast1("oath_sun");
  if(P.oath!=="moon"&&!P.oath&&oathFree("moon")&&[...P.hand,...P.deck].some(c=>kind(c)==="joker")&&Math.random()<(lv==="hard"?.35:.15))await cast1("oath_moon");
  if(planetUp("saturn")&&P.oath!=="saturn"&&!P.oath&&paysSaturn(pl)&&P.deck.length>10&&Math.random()<.35)await cast1("oath_saturn");
  if(oathNow(pl,"sun")){if(fireOf(pl)>=fireCost(SP("sunblind"))&&Math.random()<.35)await cast1("sunblind");if(fireOf(pl)>=fireCost(SP("scorch"))&&Math.random()<.5)await cast1("scorch")}
  if(oathNow(pl,"moon"))await aiMoonOath(pl,cast1);
}}

/* v50: the computer keeps the Moon's demand: a Joker goes onto the field in time, and shoots itself before the Full Moon */
async function aiMoonOath(pl,cast1){const P=G.p[pl],n=fullIn();
  if(!P.moonDone&&n<=3){
    let j=stacksOf(pl).find(x=>hasK(x.st,"joker"));
    if(!j){const c=P.hand.find(x=>kind(x)==="joker");
      if(c){let spot=null;for(const x of stacksOf(pl))if(canPlace(c,x.r,x.c)){spot=x;break}
        if(spot){place(c,spot.r,spot.c);render();await sleep(300);j=stacksOf(pl).find(x=>hasK(x.st,"joker"))}}}
    if(j&&(n<=1||P.cpu==="hard"&&n<=2||Math.random()<.5))await cast1("suicide",j.r,j.c);
    else if(!j&&!P.hand.some(x=>kind(x)==="joker")&&(P.moonJokers||0)<2&&mana(pl)>=1)await cast1("moonjoker")}
  if((P.moonJokers||0)<2&&mana(pl)>=3&&Math.random()<.4)await cast1("moonjoker")}
/* ---------- on the screen: the Sun's sacrifice, fire mana, the blind veil, aiming at a tile ---------- */
const sunSacOk=V=>V===G.active&&oathNow(V,"sun");
{const _et=econTags;econTags=function(P){const t=_et(P);
  if(oathNow(P.i,"sun"))t.push(`<span class="firetag" title="Fire mana: 3 at most, 6 for a round">Fire ${fireOf(P.i)}/${FIRE_MAX}</span>`);
  if(totalBlind(P.i)&&!sunBlind(P.i))t.push(`<span class="debttag">Blind</span>`);
  if(P.satLocked)t.push(`<span class="debttag">Betrayed Saturn</span>`);
  if(oathNow(P.i,"saturn")&&!P.satLocked)t.push(`<span class="oathtag">Saturn ${P.satPaid||0} paid</span>`);
  return t}}
{const _rd=render;render=function(){_rd.apply(this,arguments);if(!G)return;
  const B=$("#board");if(B){const bl=totalBlind(view());B.classList.toggle("blinded",bl);
    let v=B.querySelector(".blindveil");if(bl&&!v){v=document.createElement("div");v.className="blindveil";v.innerHTML=`<b>Blind</b><span>You see nothing on the field this round, not even your own cards.</span>`;B.appendChild(v)}else if(!bl&&v)v.remove();
    if(G.aim&&(G.aim.pl==null||G.aim.pl===view())){const ok=(r,c)=>G.aim.valid?G.aim.valid(r,c):(G.aim.tiles||[]).some(t=>t[0]===r&&t[1]===c);B.querySelectorAll("button.tile").forEach(t=>{if(ok(+t.dataset.r,+t.dataset.c))t.classList.add("taim")})}}
  let a=$("#aimbar");
  if(G.aim&&(G.aim.pl==null||G.aim.pl===view())){if(!a){a=document.createElement("div");a.id="aimbar";document.body.appendChild(a)}a.innerHTML=`<span>${esc(G.aim.title)}</span><button class="btn ghost sm" type="button">Cancel</button>`;a.hidden=false;a.querySelector("button").onclick=()=>endAim(null)}
  else if(a)a.hidden=true;
}}
if(window.__EC)Object.assign(window.__EC,{saturnEclipse,spawnPuppets,saturnPaid,saturnMissed,oathRound,eclipse,sacrificeToSun,totalBlind,fireOf,giveFire,setPlanet,toggleOath,cast,SP});
if(window.__EC)window.__EC.render=()=>render();
