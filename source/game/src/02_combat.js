/* ---------------- sound (synthesized, quiet) ---------------- */
const SND=(()=>{
  let ac=null,master=null,on=true;const bus={};
  try{on=localStorage.getItem("ec-sound")!=="off"}catch(e){}
  function ctx(){
    if(!on||G&&G.opts.fast)return null;
    try{if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=sfxV()*allV();master.connect(ac.destination)}
      master.gain.value=sfxV()*allV();if(ac.state==="suspended")ac.resume();}catch(e){return null}
    return ac;
  }
  // each source of sound has its own volume on the way out (v78c)
  const busOf=k=>{let b=bus[k];if(!b){b=ac.createGain();b.connect(master);bus[k]=b}b.gain.value=srcV(k);return b};
  function noise(a,dur){const b=a.createBuffer(1,Math.max(1,Math.floor(a.sampleRate*dur)),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=a.createBufferSource();s.buffer=b;return s}
  function click(a,t,amp,freq,to){
    const s=noise(a,.03),f=a.createBiquadFilter(),g=a.createGain();
    f.type="bandpass";f.frequency.value=freq;f.Q.value=2.2;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+.002);g.gain.exponentialRampToValueAtTime(.0005,t+.028);
    s.connect(f).connect(g).connect(to);s.start(t);s.stop(t+.035);
  }
  return{
    get on(){return on},
    toggle(){on=!on;try{localStorage.setItem("ec-sound",on?"on":"off")}catch(e){}return on},
    vol(){if(!ac)return;master.gain.value=sfxV()*allV();for(const k in bus)bus[k].gain.value=srcV(k)},
    dice(n){const a=ctx();if(!a)return;let t=a.currentTime+.01;const k=Math.min(9,3+Math.ceil(n*.8)),to=busOf("dice");
      for(let i=0;i<k;i++){click(a,t,.2*(1-i/(k+1))+.04,1800+Math.random()*2600,to);t+=.035+Math.random()*.07*(1+i/k)}},
    zap(){const a=ctx();if(!a)return;const t=a.currentTime+.01;
      const s=noise(a,.5),f=a.createBiquadFilter(),g=a.createGain();f.type="highpass";f.frequency.value=1800;
      g.gain.setValueAtTime(0,t);for(let i=0;i<5;i++){g.gain.linearRampToValueAtTime(.22*(1-i/6),t+i*.07+.004);g.gain.linearRampToValueAtTime(.02,t+i*.07+.05)}g.gain.exponentialRampToValueAtTime(.001,t+.45);
      s.connect(f).connect(g).connect(busOf("spells"));s.start(t);s.stop(t+.5)},
    gun(){const a=ctx();if(!a)return;const t=a.currentTime+.01,to=busOf("battle");
      const s=noise(a,.45),f=a.createBiquadFilter(),g=a.createGain();f.type="lowpass";f.frequency.setValueAtTime(2600,t);f.frequency.exponentialRampToValueAtTime(300,t+.35);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.32,t+.003);g.gain.exponentialRampToValueAtTime(.001,t+.42);
      s.connect(f).connect(g).connect(to);s.start(t);s.stop(t+.45);
      const o=a.createOscillator(),og=a.createGain();o.type="sine";o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(38,t+.22);
      og.gain.setValueAtTime(.28,t);og.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(og).connect(to);o.start(t);o.stop(t+.26)}
  };
})();

/* ---------------- dice ---------------- */
function rollN(n,s){const out=[];for(let i=0;i<n;i++)out.push({s,v:R(s)});return out}
const sum=d=>d.reduce((a,x)=>a+(x.x?0:x.v),0);
/* show a roll in a player's dice box. dice: [{s,v,x?}] (x = discarded by advantage/disadvantage) */
function tray(pl,label,dice,line,quiet){
  G.p[pl].tray={label,dice,line:line||"",t:Date.now()};
  hist(pl,{kind:"roll",name:label,dice:dice.map(d=>d.v!=null?`d${d.s}:${d.v}`:"").filter(Boolean),line:line||"",tile:G.histTile||null});
  if(!quiet&&dice.length)SND.dice(dice.length);
}
/* the weapon a lone Emanation card fights with (Samson picks one; the rest have one) */
const soloUnit=st=>st&&st.cards.length&&st.cards[0].unit&&UNIT[st.cards[0].unit].weapons&&st.cards.every(c=>c.unit===st.cards[0].unit)?st.cards[0]:null;   // one Emanation card, or a pair of Assassins
function weaponOf(st,mode){const u=soloUnit(lhInner(st));if(!u)return null;const W=UNIT[u.unit].weapons;return W.find(w=>w.id===mode)||W[0]}
function rollStack(st,mode,enemy,fx,weapon){ // mode: "atk" | "def"
  if(st&&hasK(st,"lighthouse")){st=lhInner(st);if(!st.cards.length)return{total:0,parts:["the Lighthouse stands empty"],dice:[],kingRoll:null}}   // v70c: the stack inside fights; the tower adds nothing
  const once=()=>{
    const parts=[],dice=[];let best=-1,kingRoll=null,aceRoll=null;
    const u=st.cards[0]&&st.cards[0].unit&&st.cards.every(c=>c.unit===st.cards[0].unit)?st.cards[0]:null;
    if(u&&UNIT[u.unit].weapons){   // Samson, Antony, Satan, the BullGoat, Slaves
      const U=UNIT[u.unit];
      if(U.copy){   // the Debt Collector copies the enemy's leading card, without its advantage
        const lead=enemy&&leadCard(enemy);if(!lead){best=0;parts.push("Debt Collector: nothing to copy");return{total:0,parts,dice,kingRoll}}
        const d=die(lead),r=d?R(d):0;if(r)dice.push({s:d,v:r});best=nat(lead)+r;parts.push(`Debt Collector copies ${short(lead)}: ${nat(lead)}${r?"+"+r:""}`);return{total:best,parts,dice,kingRoll}}
      if(mode==="atk"){const w=weapon&&U.weapons.find(x=>x.id===weapon.id)||U.weapons[0],d=w.roll();dice.push(...d);best=w.fixed+sum(d);parts.push(`${U.name} (${w.name}) ${w.fixed?w.fixed+"+":""}${d.map(x=>x.v).join("+")}`)}
      else if(U.defRoll){const d=U.defRoll();dice.push(...d);best=sum(d)+(U.defFixed||0);parts.push(`${U.name} ${U.defFixed?U.defFixed+"+":""}${d.map(x=>x.v).join("+")}`)}
      else if(U.noDef){best=0;parts.push(`${U.name} cannot defend`)}
      else{best=U.nat;parts.push(`${U.name} ${U.nat}`)}
      return{total:best,parts,dice,kingRoll};
    }
    if(mode==="def"&&hasK(st,"tree")){parts.push("the Tree cannot defend");return{total:0,parts,dice,kingRoll}}
    const soloJoker=st.cards.length===1&&kind(st.cards[0])==="joker";
    if(soloJoker&&enemy){ // copies score and dice of the enemy's leading card
      const lead=leadCard(enemy);
      if(lead){const d=die(lead),r=d&&(mode==="atk"||hasK(st,"queen"))?R(d):0;if(r)dice.push({s:d,v:r});best=nat(lead)+r;parts.push(`Joker copies ${short(lead)}: ${nat(lead)}${r?"+"+r+" (d"+d+")":""}`)}
      else{best=0;parts.push("Joker: 0")}
      const jb=mode==="atk"&&st.owner!=null&&G.p[st.owner]?JOKER_BONUS[G.p[st.owner].tribe]:0;if(jb){best+=jb;parts.push(`${TRIBES[G.p[st.owner].tribe].name} Joker +${jb}`)}
      return{total:best,parts,dice,kingRoll};
    }
    const queen=hasK(st,"queen"),ace=hasK(st,"ace");
    for(const c of st.cards){
      const k=kind(c);
      if(mode==="def"&&(k==="jack"||k==="slave")){parts.push(`${short(c)} cannot defend`);continue}
      if(k==="queen"||k==="joker")continue;
      let useDie;
      if(mode==="atk")useDie=k!=="ace";
      else useDie=ace?k==="ace":queen;
      const d=die(c),r=useDie&&d?R(d):0;
      if(r)dice.push({s:d,v:r});
      if(k==="king"&&useDie)kingRoll=r;
      if(k==="ace"&&useDie)aceRoll=r;
      const t=nat(c)+r;parts.push(`${short(c)} ${nat(c)}${r?"+"+r:""}`);
      if(t>best)best=t;
    }
    const jb=mode==="atk"&&hasK(st,"joker")&&st.owner!=null&&G.p[st.owner]?JOKER_BONUS[G.p[st.owner].tribe]:0;if(jb){best+=jb;parts.push(`${TRIBES[G.p[st.owner].tribe].name} Joker +${jb}`)}
    return{total:Math.max(0,best),parts,dice,kingRoll,aceRoll};
  };
  const a=once();
  const n=typeof fx==="number"?fx:fx==="adv"?1:fx==="dis"?-1:0,f=n>0?"adv":n<0?"dis":null,bonus=Math.abs(n)>=2?n:0;
  if(f){const b=once();const takeB=f==="adv"?b.total>a.total:b.total<a.total;const pick=takeB?b:a,other=takeB?a:b;
    pick.dice=[...pick.dice,...other.dice.map(d=>({...d,x:true}))];pick.parts.push(f==="adv"?"(advantage)":"(disadvantage)");
    if(bonus){pick.total=Math.max(0,pick.total+bonus);pick.parts.push(`${bonus>0?"+":""}${bonus} stacked ${f==="adv"?"advantage":"disadvantage"}`)}
    return pick}
  return a;
}
const JOKER_BONUS={binah:3,tiph:1};
function leadCard(st){let best=null;for(const c of st.cards){if(kind(c)==="joker"||kind(c)==="queen")continue;if(!best||nat(c)>nat(best))best=c}return best}

/* ---------------- combat ---------------- */
function adjacent(r1,c1,r2,c2,diag){const dr=Math.abs(r1-r2),dc=Math.abs(c1-c2);return diag?(dr<=1&&dc<=1&&(dr||dc)):dr+dc===1}
const near8=(r1,c1,r2,c2)=>Math.abs(r1-r2)<=1&&Math.abs(c1-c2)<=1;
const jackOnly=st=>st.cards.every(c=>kind(c)==="jack");
const shielded=pl=>pl!=null&&G.p[pl]&&!!G.p[pl].shield;          // Please Don't Hurt Me
const hated=st=>st.cards.some(c=>c.hate);
function canAttackFrom(st){
  if(st.attacked||st.hypo||st.stun||st.pin)return false;
  if(hasK(st,"lighthouse")){const s=lhInner(st);return s.cards.length>0&&canAttackFrom(s)}   // v70c: the stack inside a Lighthouse attacks from it
  if(st.cards.every(c=>c.unit&&UNIT[c.unit].noAtk||kind(c)==="queen"))return false;   // Scouts, support cards and Archers don't fight up close
  if(hasBase(st))return false;
  const horde=G&&st.owner!=null&&G.p[st.owner]&&isHorde(st.owner);   // the Horde ignores the lone-King and lone-Queen limits
  if(!horde&&st.cards.length===1&&kind(st.cards[0])==="king")return false;
  if(!horde&&st.cards.every(c=>kind(c)==="queen"))return false;
  return true;
}
/* where a weapon reaches from r1,c1: melee (next to it, straight), gun (two away in a straight line, or one diagonal),
   charge (two or three away in a straight line with every tile between empty) */
function reaches(reach,r1,c1,r2,c2){
  const dr=Math.abs(r1-r2),dc=Math.abs(c1-c2);
  if(reach==="melee")return dr+dc===1;
  if(reach==="gun")return dr===1&&dc===1||(dr===2&&dc===0)||(dc===2&&dr===0);
  if(reach==="bow")return (dr===2&&dc===0)||(dr===0&&dc===2)||(dr===2&&dc===2);   // the tile after the next, straight or diagonal
  if(reach==="cannon")return Math.max(dr,dc)<=3&&dr+dc>0;
  if(reach==="charge"||reach==="charge2"){
    const okD=reach==="charge2"?[2]:[2,3];
    if(!(dr===0&&okD.includes(dc))&&!(dc===0&&okD.includes(dr)))return false;
    const sr=Math.sign(r2-r1),sc=Math.sign(c2-c1);
    for(let k=1;k<Math.max(dr,dc);k++){const r=r1+sr*k,c=c1+sc*k;if(isVoid(r,c)||G.board[r][c])return false}
    return true;
  }
  return false;
}
/* every attack the stack on r,c can make: {r,c,mode,ranged} */
function attackOptions(r,c){
  const st=G.board[r][c];if(!st||st.attacked||st.hypo||st.stun||st.pin||choked(st.owner))return[];
  const out=[],tg=[];
  for(let r2=0;r2<G.rows;r2++)for(let c2=0;c2<COLS;c2++){
    const t=G.board[r2][c2];if(!t||!(isEnemy(t.owner,st.owner)||warFoe(st.owner,t.owner))||peaceBlock(st.owner,t.owner)||t.hypo||shielded(t.owner)||!seesTile(st.owner,r2,c2))continue;   // you can't strike what you can't see
    tg.push([r2,c2,t]);
  }
  // Archers and Cannons shoot from any stack they stand in, bases too (unless a Repairman is at work on that base)
  if(!(hasBase(st)&&repLocked(st)))for(const card of st.cards){const U=card.unit&&UNIT[card.unit];if(!U||!U.shooter||!shotReady(card,st.owner))continue;
    const A={owner:st.owner,cards:[card],odds:st.odds,down:st.down};
    for(const [r2,c2] of tg)for(const w of U.weapons)if(reaches(w.reach,r,c,r2,c2))out.push({r:r2,c:c2,mode:w.id,ranged:true,w,A,card});
  }
  if(!canAttackFrom(st))return out;
  const st0=lhInner(st),u=soloUnit(st0),diag=jackOnly(st0);
  for(const [r2,c2,t] of tg){
    if(adjacent(r,c,r2,c2,diag)&&lonely(t)){   // support cards standing alone: take one, or destroy one
      if(canCapture(st,t))out.push({r:r2,c:c2,mode:"capture",ranged:false,w:{name:"Capture",text:`take ${nameOf(captureCard(t))} into this stack's capture slot`}});
      out.push({r:r2,c:c2,mode:"destroy",ranged:false,w:{name:"Destroy",text:`destroy ${nameOf(captureCard(t))}`}});
      continue}
    if(hasK(st0,"ram")&&st0.cards.length>1&&hasK(t,"wall")&&adjacent(r,c,r2,c2,false))out.push({r:r2,c:c2,mode:"ram",ranged:false,w:{name:"Battering Ram",text:"two damage to the Wall, no roll"}});
    if(u){for(const w of UNIT[u.unit].weapons)if(reaches(w.reach,r,c,r2,c2))out.push({r:r2,c:c2,mode:w.id,ranged:w.reach==="gun"&&!near8(r,c,r2,c2),w})}
    else if(adjacent(r,c,r2,c2,diag))out.push({r:r2,c:c2,mode:null,ranged:false});
  }
  return out;
}
/* advantage and disadvantage from Divine/Hexed Odds and Hate cancel out pairwise */
/* advantage and disadvantage cancel one for one; two of the same kind add +2 (or −2) on top, and each one more adds 1 */
function netFx(...fx){let n=0;for(const f of fx){if(f==="adv")n++;if(f==="dis")n--}return n}
const cmpSign=(a,b)=>a>b?">":a<b?"<":"=";
function attack(r1,c1,r2,c2,mode){
  const b=blindPick(r1,c1,r2,c2,mode);if(b)return blindShot(r1,c1,r2,c2,b);   // a shot into the fog of war
  return attackRun(r1,c1,r2,c2,mode,null);
}
function attackRun(r1,c1,r2,c2,mode,forced){
  const A=G.board[r1][c1],D=G.board[r2][c2];if(!A||!D)return;const atkPl=A.owner,defPl=D.owner;
  const opt=forced||attackOptions(r1,c1).find(o=>o.r===r2&&o.c===c2&&(mode==null||o.mode===mode))||{mode:null,ranged:false};
  const w=opt.A?opt.w:weaponOf(A,opt.mode);
  if(w&&w.special==="stomp")return stomp(r1,c1,r2,c2);
  if(opt.mode==="suppress")return suppress(r1,c1,r2,c2,opt);
  if(opt.mode==="capture"||opt.mode==="destroy")return takeSupport(r1,c1,r2,c2,opt.mode);
  if(opt.mode==="ram")return ramWall(r1,c1,r2,c2);
  for(const g of D.cards)if(g.unit==="goatbull"&&G.board.flat().some(s=>s&&s.pin&&s.pin.by===g.id))g.lostAdv=true;   // attacking a pinning Goatbull costs it its advantage
  const pureA=hasK(A,"satan"),pureD=hasK(D,"satan");   // Satan fights with no modifiers
  const fxA=pureA?null:netFx(A.odds,hated(A)?"dis":null,hated(D)&&!pureD?"adv":null,A.down?"dis":null,A.down?"dis":null,A.ambushing?"adv":null,A.supp?"dis":null,A.mars?"adv":null),fxD=pureD?null:netFx(D.odds,hated(D)?"dis":null,D.down?"adv":null);   // face-down: double disadvantage to attack, advantage to defend
  const bothSoloJokers=A.cards.length===1&&D.cards.length===1&&kind(A.cards[0])==="joker"&&kind(D.cards[0])==="joker";
  const ra=rollStack(opt.A||A,"atk",D,fxA,w),rd=rollStack(D,"def",A,fxD);
  if(A.supp){ra.parts.push("suppressed");A.supp=null}
  if(A.mars){ra.parts.push("Mars");A.mars=false}
  if(opt.card&&opt.card.unit==="cannon")opt.card.readyAt=(G.p[atkPl].tn||0)+R(2)+2;   // the Cannon reloads
  G.histTile=`${coord(r1,c1)} → ${coord(r2,c2)}`;
  A.odds=null;D.odds=null;A.attacked=true;G.lastAttack=G.turnNo;G.fights=(G.fights||0)+1;venusAttack(atkPl,defPl);
  if(A.down){ra.parts=["a face-down card "+ra.total];A.down=false}   // v78j: rule 12.G.5: it flips face up once it attacks
  const wasDown=D.down;if(D.down){D.down=false}   // a face-down stack that is attacked turns face up
  if(A.ambush)A.ambush=false;A.ambushing=false;
  if(G.opts.moonBonus!==false&&!bothSoloJokers){   // the moon lends a die: Full Moon to the attacker, New Moon to the defender
    if(G.moon.i===4&&!pureA){const v=R(2);ra.total+=v;ra.dice.push({s:2,v});ra.parts.push(`${G.moon.blood?"Blood":"Full"} Moon +${v}`)}
    if(G.moon.i===0&&!pureD){const v=R(2);rd.total+=v;rd.dice.push({s:2,v});rd.parts.push(`New Moon +${v}`)}
  }
  const LR=landRoll(opt.A||A,D);   // v48: the landing roll, 1d20 each
  if(A.dplus&&A.dplus.m==="atk"){const x=dicePlusRoll();ra.total+=x.total;ra.dice.push(...x.dice);ra.parts.push(`Dice Plus +${x.total}`);A.dplus=null}
  if(D.dplus&&D.dplus.m==="def"){const x=dicePlusRoll();rd.total+=x.total;rd.dice.push(...x.dice);rd.parts.push(`Dice Plus +${x.total}`);D.dplus=null}
  const queenA=hasK(A,"queen");
  let dmgD=0,dmgA=0,notes=[];
  if(wasDown)notes.push("The face-down stack turns face up.");
  if(w)notes.push(`${w.name}.`);
  if(bothSoloJokers){notes.push("Jokers cannot kill Jokers.")}
  else if(ra.total>rd.total){
    dmgD=1;
    if(ra.kingRoll===20){dmgD=2;notes.push("King rolls 20: double damage.")}
    if(ra.kingRoll===1&&!queenA){dmgD=0;notes.push("King rolls 1: no damage.")}
  }else{
    dmgA=1;
    if(ra.kingRoll===20){dmgA=0;notes.push("King rolls 20: takes no damage.")}
    if(ra.kingRoll===1&&!queenA){dmgA=2;notes.push("King rolls 1 on a failed attack: two damage.")}
  }
  if(rd.kingRoll===20&&dmgA>0){dmgA*=2;notes.push("Defending King rolls 20: double damage back.")}
  if(rd.aceRoll===1&&dmgA>0){dmgA=0;notes.push("The Ace rolls 1: it does no damage.")}
  if(opt.ranged&&dmgA>0){dmgA=0;notes.push("Fired from range: a miss costs the shooter nothing.")}
  if(w&&["gun","bow","cannon"].includes(w.reach)&&dmgD>0&&hasK(D,"tree")){dmgD=0;notes.push("The Tree of Neither Life Or Death takes no damage from ranged attacks.")}
  if(dmgD>0&&hasK(D,"wall")){
    if(opt.mode==="charge"||opt.mode==="charge2"){dmgD*=2;notes.push("A charge hits a Wall twice as hard.")}
    if(w&&w.id==="cannon"){dmgD=Math.max(dmgD,2);notes.push("Cannon fire: two damage to the Wall.")}
  }
  if(dmgD>0&&w&&w.id==="cannon"){const ace=D.cards.find(x=>kind(x)==="ace");if(ace&&(ace.hp||1)<=1){dmgD=0;notes.push("A Cannon can't take an Ace's last heart.")}}
  if(LR.miss){dmgD=0;dmgA=0;notes.push("Crit Miss: the attack misses.")}
  else if(LR.dodge){dmgD=0;dmgA=0;notes.push("The Assassin dodges: Miss.")}
  else if(LR.crit){if(!dmgD)dmgD=1;dmgA=0;notes.push("Crit Hit: the blow lands whatever the scores.")}
  notes.push(`(Landing ${LR.la} vs ${LR.ld}.)`);
  const line=`${ra.total}${cmpSign(ra.total,rd.total)}${rd.total}`;
  tray(atkPl,"Attack",ra.dice,opt.blind?(dmgD?"a hit in the fog":"lost in the fog"):line);if(!opt.blind)tray(defPl,"Defense",rd.dice,line,true);G.histTile=null;   // v78j: a shot into the fog shows no defense
  log(`<b>${plName(atkPl)}</b> attacks from ${coord(r1,c1)} to ${coord(r2,c2)}: <span class="dice">${ra.parts.join(", ")}</span> = <b>${ra.total}</b> vs <span class="dice">${rd.parts.join(", ")}</span> = <b>${rd.total}</b> <span class="tot">(${esc(line)})</span>. ${notes.join(" ")} ${dmgD?`Defender takes ${dmgD} damage.`:""}${dmgA?`Attacker takes ${dmgA} damage.`:""}${!dmgA&&!dmgD?"No damage.":""}`,"combat");
  if(LR.miss)critLog("miss",1,`${plName(atkPl)}: Crit Miss`);else if(LR.dodge)critLog("dodge",LR.ld,`${plName(defPl)}'s Assassin dodges: Miss`);else if(LR.crit)critLog("hit",LR.la,`${plName(atkPl)}: Crit Hit`);
  G.fight={A,D,atkPl,defPl,ranged:!!opt.ranged};
  if(dmgD)warDamagePay(atkPl,defPl,dmgD,D);
  if(dmgD){const n=damage(r2,c2,dmgD,true);if(hasK(A,"antony")&&n)addBolts(atkPl,n,"Antony's kill")}
  if(dmgA&&G.board[r1][c1])damage(r1,c1,dmgA,false);
  G.fight=null;
  // the BullGoat's charge carries it up to its target
  if((opt.mode==="charge"||opt.mode==="charge2")&&G.board[r1][c1]===A){const sr=Math.sign(r2-r1),sc=Math.sign(c2-c1),tr=r2-sr,tc=c2-sc;
    if(!G.board[tr][tc]&&!isVoid(tr,tc)){G.board[tr][tc]=A;G.board[r1][c1]=null;A.moved=true;log(`The BullGoat closes the gap to ${coord(tr,tc)}.`)}}
  return{win:dmgD>0,line};
}
/* ---------- v48: the landing roll ----------
   Both sides roll 1d20 in every fight. The attacker's 1 is a Crit Miss: the attack misses (Puppets never miss). The attacker's
   20, with two or more cards in the stack that can each attack, is a Crit Hit: the defender takes the blow whatever the scores,
   unless it rolls a 20 too. Three or more Puppets crit on 19 or 20. Puppets and Assassins ignore Crit Hits, and an Assassin
   dodges on 17 to 20 of its own roll. A defender's 1 costs it nothing. */
function landRoll(A,D){const la=R(20),ld=R(20);
  const can=A.cards.filter(c=>!isBase(c)&&!(c.unit&&UNIT[c.unit].noAtk)&&kind(c)!=="queen"),pup=A.cards.length>0&&A.cards.every(c=>c.puppet);
  const critMin=pup&&A.cards.length>=3?19:20,canCrit=can.length>=2||pup&&A.cards.length>=3;
  const fighters=D.cards.filter(c=>!isBase(c)&&!(c.unit&&UNIT[c.unit].sup)),immune=fighters.length>0&&fighters.every(c=>c.puppet||c.unit==="assassin");
  const miss=la===1&&!pup,dodge=!miss&&D.cards.some(c=>c.unit==="assassin")&&ld>=17,crit=!miss&&!dodge&&canCrit&&la>=critMin&&ld!==20&&!immune;
  return {la,ld,miss,dodge,crit}}
/* the banner every player sees: it rides on a line of the log */
function critLog(k,n,html){log(html+".","crit");G.log[0].crit={k,n}}
/* ---------- v48: Dice Plus: a d12 on the table below, a 12 rolls two more ---------- */
const DP_DIE={2:2,3:3,4:4,5:6,6:6,7:8,8:8,9:8,10:10,11:12};
function dicePlusRoll(){let total=0;const dice=[],q=[R(12)];let guard=0;
  while(q.length&&guard++<40){const v=q.shift();dice.push({s:12,v});if(v===12){q.push(R(12),R(12));continue}
    if(v===1){total+=1;continue}const s=DP_DIE[v],x=R(s);dice.push({s,v:x});total+=x}
  return {total,dice}}
/* returns how many cards died */
function damage(r,c,n,defending){
  const st=G.board[r][c];if(!st)return 0;
  if(n>0&&shieldUp(st)){breakShield(st,r,c);return 0}   // the Healer's shield turns the whole blow
  const dead=[];
  for(let i=0;i<n&&st.cards.length;i++){
    // v78t: Miners and Repairmen are hit last: they hide behind every card that can defend them (and can be taken only once none is left)
    if(!st.cards.length)break;
    const lh=st.cards.find(x=>x.unit==="lighthouse");   // v70c: the stack inside a Lighthouse takes the blows first; the tower, once nothing else can
    const base=st.cards.find(x=>isBase(x)&&x!==lh)||(lh&&!st.cards.some(x=>x!==lh&&x.unit!=="ram")?lh:null);
    if(base){stealOnDamage(st);base.hp=(base.hp||1)-1;const nm=kind(base)==="ace"?"The Ace":kind(base)==="wall"?"The Wall":kind(base)==="lighthouse"?"The Lighthouse":"The Tree of Neither Life Or Death";
      if(base.hp>0){log(`${nm} loses a heart (${base.hp} left); the cards inside are safe.`);continue}
      const fell=st.cards.splice(0);if(kind(base)==="tree")for(const x of fell)if(x!==base)x.withTree=true;   // v78j
      dead.push(...fell);log(`${nm} falls, and every card inside it dies with it.`);break}
    // support cards hide behind the fighters; the Battering Ram can't be killed by blows at all
    const fighters=st.cards.filter(x=>!(x.unit&&UNIT[x.unit].sup)&&x!==lh),pool=fighters.length?fighters:st.cards.filter(x=>x.unit!=="ram"&&x!==lh);
    if(!pool.length){log(`The Battering Ram on ${coord(r,c)} can't be harmed by blows: it has to be captured or destroyed.`);break}
    pool.sort((a,b)=>nat(a)-nat(b));
    const low=pool[0];stealOnDamage(st);
    if(low.hp>1){low.hp--;log(`${esc(nameOf(low))} loses a heart (${low.hp} left).`);continue}
    st.cards.splice(st.cards.indexOf(low),1);const c0=low;dead.push(c0);
    if(kind(c0)==="king"&&defending&&st.cards.some(x=>x!==lh)){dead.push(...st.cards.filter(x=>x!==lh));st.cards.splice(0,st.cards.length,...(lh?[lh]:[]));log("The King is defeated in defense: all units with it die.")}
  }
  if(!st.cards.length){G.board[r][c]=null;freeCaptive(st,r,c)}
  if(defending&&dead.length&&G.p[st.owner].tribe==="angel")addBolts(st.owner,dead.length,"a card lost in defense");
  for(const d of dead)bury(d,r,c,st);
  checkWin();
  return dead.length;
}
/* Jokers beside r,c that belong to an enemy of player `of` */
function adjacentJokers(r,c,of){
  const out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const s=at(r+dr,c+dc);if(s&&isEnemy(s.owner,of)){const j=s.cards.find(x=>kind(x)==="joker");if(j)out.push({j,pl:s.owner})}}
  return out;
}
const capMana=j=>(j.captured||[]).reduce((a,c)=>a+soulOf(c),0);
function bury(card,r,c,st){
  const owner=st.owner;
  if(card.withTree){delete card.withTree;toDark(card);return}   // v78j: what falls with the Tree goes where it goes
  if(card.puppet){toDark(card);log(`A Puppet falls into the Outer Darkness.`);return}   // v48: Puppets always go to the Outer Darkness
  if(econBury(card,r,c,st))return;   // Demon kills are counted; what the Bank's Debt Collectors kill goes to the Ether
  if(card.upgraded){card.maxHp=2;card.upgraded=false}   // an upgraded Ace loses the extra heart when it falls
  if(card.hp!=null)card.hp=card.maxHp;
  if(card.hate)card.hate=false;
  if((card.unit==="samson"||card.unit==="antony")&&buryUnit(card,r,c,owner))return;   // Samson and Antony keep their own fates
  if(buryHook(card,r,c,st))return;                     // Traffickers, Pleasure and Joy, the Leviathan's kills
  if(card.unit&&buryUnit(card,r,c,owner))return;       // the other Emanation cards have their own fates
  // a Binah Slavemaster takes the soldiers it defeats
  const F=G.fight;
  if(F&&(kind(card)==="grunt"||kind(card)==="infantry")){
    const opp=st===F.D?F.A:st===F.A?F.D:null,op=opp&&opp.owner;
    if(opp&&hasK(opp,"slavemaster")&&isEnemy(op,owner)&&G.p[op].tribe==="binah"&&(G.p[op].thralls||[]).length<10){
      card.owner=op;(G.p[op].thralls=G.p[op].thralls||[]).push(card);
      log(`${plName(op)}'s Slavemaster takes ${esc(nameOf(card))} as a thrall (${G.p[op].thralls.length}/10).`);return}
  }
  if(kind(card)==="joker"&&card.captured&&card.captured.length){
    const souls=card.captured;card.captured=[];let stolen=0;
    for(const s of souls){const f=adjacentJokers(r,c,owner).find(x=>capMana(x.j)+soulOf(s)<=SOUL_CAP);
      if(f){(f.j.captured=f.j.captured||[]).push(s);stolen++}else toGrave(s,"death")}
    log(`The Joker's ${souls.length} captured soul${souls.length>1?"s are":" is"} released${stolen?`; an enemy Joker steals ${stolen}`:""}.`);
  }
  const f=adjacentJokers(r,c,owner).find(x=>capMana(x.j)+soulOf(card)<=SOUL_CAP);
  if(f){
    const taker=f.pl,P=G.p[taker];
    if(P.sevArmed&&taker===G.active){ // half the conjuring price of everything severed this turn, rounded up
      const charge=Math.ceil((G.sevSum+costOf(card))/2)-Math.ceil(G.sevSum/2);
      if(mana(taker)>=charge){if(charge)pay(taker,charge);G.sevSum+=costOf(card);card.owner=null;G.ether.push(card);log(`Flesh Severance: ${esc(nameOf(card))} is exiled to the Ether (${charge} mana).`);return}
    }
    (f.j.captured=f.j.captured||[]).push(card);log(`Soul Capture: ${plName(taker)}'s Joker takes the soul of ${esc(nameOf(card))}.`);return;
  }
  toGrave(card,"death");
}

/* ---------------- win and elimination ---------------- */
function fallen(pl){return hq()?!stacksOf(pl).some(x=>hasK(x.st,"ace")):!stacksOf(pl).length}
function checkWin(){
  if(G.over||G.phase==="setup")return;
  const down=alive().filter(pl=>!isHorde(pl)&&fallen(pl));if(!down.length)return;   // v78j: all who fall in one event fall together
  const why=pl=>hq()?`every base ${plName(pl)} had is destroyed`:`every card ${plName(pl)} had on the field is destroyed`;
  if(!survival()&&!alive().some(i=>!isNPC(i)&&!down.includes(i))){for(const pl of down)G.p[pl].out=true;end(null,down.map(why).join("; "));return}
  for(const pl of down){eliminate(pl,why(pl));if(G.over)return}
}
/* v78t: economic victory is sinking below the lowest mana allowed (checkDebt, at every debt); running out of cards no longer ends a game */
function checkEconomic(pl){if(survival()||G.p[pl].out)return;checkDebt(pl)}
/* a player is out: their cards leave play, then the game ends if one side is left */
function eliminate(pl,why){
  const P=G.p[pl];if(P.out||G.over)return;P.out=true;   // v78j: not once the game is over
  if(survival()){
    log(`<b>${plName(pl)} falls</b>: ${why}.`,"event");
    if(!G.p.some(Q=>!Q.out&&!isHorde(Q.i))){endSurvival(why);return}
  }else{
    const teams=new Set(alive().filter(i=>!isNPC(i)).map(i=>G.p[i].team));
    if(G.fallTogether)G.fallTogether.push(why);   // turns ending together: settled after the last one
    else if(teams.size<=1){end(alive().find(i=>!isNPC(i))??null,why);return}   // v78j: never a side like the Demon Band; nobody left is a draw
    log(`<b>${plName(pl)} is eliminated</b>: ${why}.`,"event");
  }
  // what is left of them leaves the table
  const toOD=G.opts.elimDark;const dump=c=>{if(toOD||c.puppet)toDark(c);else{c.owner=pl;toGrave(c,"out")}};   // v78j: toGrave sorts out Emanation cards
  for(const {st,r,c} of stacksOf(pl)){for(const x of st.cards){for(const s of x.captured||[])dump(s);x.captured=[];dump(x)}if(st.captive){dump(st.captive);st.captive=null}G.board[r][c]=null}
  const shared=G.p.some(Q=>Q!==P&&!Q.out&&Q.deck===P.deck);   // v78j: whoever still holds it keeps it
  for(const c of P.hand.splice(0))dump(c);
  if(!shared){for(const c of P.deck.splice(0))dump(c);for(const c of P.souls.splice(0))dump(c)}
  if(!toOD)shuffle(G.grave);
  log(toOD?`${plName(pl)}'s hand and deck fall into the Outer Darkness.`:`${plName(pl)}'s hand and deck go to the grave, and the grave is shuffled.`);
  if(G.moonLev&&G.moonLev.owner===pl){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;toDark(L.card);log("With its master gone, the Leviathan falls from the moon into the Outer Darkness.","event")}   // v78j
  if(G.saturnBy===pl&&G.moon.gone==="saturn"){G.saturnBy=null;G.saturnDebt=0;log("With its master gone, Saturn answers to no one: everyone pays its toll, and the toll goes to the Bank.","event")}   // v78j
  if(G.active===pl&&G.waiter){const f=G.waiter;G.waiter=null;stopTimer();f()}   // v78j: out on their own turn: it ends (it waited for a button they no longer have)
}
