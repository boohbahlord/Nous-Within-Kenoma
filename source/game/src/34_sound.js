/* ---------------- Prompt 12, part 5 (v34): sound ----------------
   One family of small synthesized sounds (no files: everything is made in the browser), quiet, short and simple, all through the
   same soft room so they sound like one game. The sound switch (sound: on/off) turns all of it off.
   The table: a click for buttons, its own tap for cards; place, move, death; a single sword clash for blows up close, a bow, a gun,
   Samson's slug cannon, a cannon, a charge, a repair; mana filling like a flask and pouring out like a liquid; a thud when a deck
   loses cards and a soft rise when a card comes back from the grave; a small chime in each school's own interval for a spell.
   The sky: the Blood Moon's static for as long as it lasts; one ambience for the New and the Full Moon; Saturn's church bell at
   every toll; Mars's war horn; Venus's harp (the opening of the Bach–Gounod Ave Maria, about fifteen seconds); Jupiter's coins;
   the Sun's march drums, again at every judgement; Mercury's quill and whispers. They play when the body rises and at its cycle or
   event; each eclipse has its own ambience while it lasts. */

const AUD=(()=>{
  let ac=null,out=null,room=null;
  const ok=()=>SND.on&&!!G&&!G.opts.fast&&!document.hidden;
  function ctx(){if(!SND.on)return null;try{
    if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();
      const comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.connect(ac.destination);
      out=ac.createGain();out.gain.value=.6*sfxV();out.connect(comp);
      // a small shared room: every sound gets the same short tail
      const len=Math.floor(ac.sampleRate*1.3),ir=ac.createBuffer(2,len,ac.sampleRate);
      for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}
      room=ac.createConvolver();room.buffer=ir;const rg=ac.createGain();rg.gain.value=.22;room.connect(rg).connect(comp)}
    out.gain.value=.6*sfxV();if(ac.state==="suspended")ac.resume()}catch(e){return null}return ac}
  const dest=g=>{g.connect(out);g.connect(room)};
  function env(g,t,peak,att,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec)}
  function tone(type,f,t,dur,peak,o={}){const a=ac,osc=a.createOscillator(),g=a.createGain();osc.type=type;osc.frequency.setValueAtTime(f,t);
    if(o.f2)osc.frequency.exponentialRampToValueAtTime(o.f2,t+(o.glide||dur));if(o.det)osc.detune.value=o.det;
    let node=osc;if(o.lp){const f1=a.createBiquadFilter();f1.type="lowpass";f1.frequency.value=o.lp;node.connect(f1);node=f1}
    node.connect(g);env(g,t,peak,o.att||.004,dur);dest(g);osc.start(t);osc.stop(t+dur+.05);return osc}
  function nz(t,dur,peak,o={}){const a=ac,b=a.createBuffer(1,Math.max(1,Math.floor(a.sampleRate*(dur+.05))),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type=o.type||"bandpass";f.frequency.setValueAtTime(o.f||1000,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+dur);f.Q.value=o.q||1;
    const g=a.createGain();s.connect(f).connect(g);env(g,t,peak,o.att||.003,dur);dest(g);s.start(t);s.stop(t+dur+.05);return g}
  const play=fn=>{if(!ok())return;const a=ctx();if(!a)return;try{fn(a.currentTime+.01)}catch(e){console.error(e)}};
  const last={};const once=(k,ms,fn)=>{const n=Date.now();if(last[k]&&n-last[k]<ms)return;last[k]=n;play(fn)};
  /* ---------- the table ---------- */
  const S={
    ui:()=>once("ui",40,t=>{tone("sine",1320,t,.03,.045);tone("sine",660,t,.04,.025)}),
    card:()=>once("card",40,t=>{nz(t,.045,.09,{f:2400,q:1.4});tone("sine",230,t,.07,.06,{f2:150})}),
    place:()=>once("place",60,t=>{tone("sine",150,t,.12,.2,{f2:70});nz(t,.06,.07,{type:"lowpass",f:900})}),
    move:()=>once("move",60,t=>{nz(t,.17,.06,{f:600,f2:1800,q:.8,att:.03})}),
    hit:()=>once("hit",80,t=>{tone("sine",95,t,.2,.26,{f2:45});nz(t,.12,.16,{type:"lowpass",f:900,f2:200});tone("triangle",260,t+.06,.22,.06,{f2:140})}),   // a blow landing somewhere unseen
    death:()=>once("death",80,t=>{nz(t,.4,.14,{type:"lowpass",f:1200,f2:150});tone("triangle",330,t,.36,.05,{f2:110})}),
    clash:()=>once("clash",70,t=>{nz(t,.025,.07,{type:"highpass",f:3000});[1180,1770,2490,3310].forEach((f,i)=>tone("sine",f,t,.28+i*.04,.035/(1+i*.4)))}),
    blunt:()=>once("blunt",70,t=>{tone("sine",120,t,.14,.18,{f2:60});nz(t,.08,.08,{type:"lowpass",f:700})}),
    arrow:()=>once("arrow",70,t=>{nz(t,.18,.07,{f:1500,f2:4200,q:2,att:.02});tone("sine",180,t+.17,.08,.09,{f2:120})}),
    gun:()=>once("gun",70,t=>{nz(t,.32,.22,{type:"lowpass",f:3000,f2:400});tone("sine",120,t,.22,.2,{f2:40})}),
    slug:()=>once("slug",90,t=>{nz(t,.6,.26,{type:"lowpass",f:2400,f2:200});tone("sine",80,t,.5,.28,{f2:30});nz(t+.02,.3,.1,{type:"highpass",f:2500})}),
    cannon:()=>once("cannon",90,t=>{nz(t,.9,.26,{type:"lowpass",f:1500,f2:120});tone("sine",90,t,.6,.3,{f2:30})}),
    charge:()=>once("charge",90,t=>{nz(t,.5,.09,{type:"lowpass",f:200,f2:900,att:.35});tone("sine",130,t+.48,.18,.24,{f2:55});nz(t+.48,.1,.1,{type:"lowpass",f:800})}),
    repair:()=>once("repair",90,t=>{for(let i=0;i<4;i++)nz(t+i*.06,.015,.09,{f:3200,q:3});tone("sine",2100,t+.27,.2,.04)}),
    fill:()=>once("fill",140,t=>{const a=ac,o=a.createOscillator(),g=a.createGain(),lfo=a.createOscillator(),lg=a.createGain();o.type="sine";o.frequency.setValueAtTime(420,t);o.frequency.exponentialRampToValueAtTime(1000,t+.45);
      lfo.type="square";lfo.frequency.value=17;lg.gain.value=.025;lfo.connect(lg).connect(g.gain);o.connect(g);env(g,t,.045,.02,.45);dest(g);o.start(t);lfo.start(t);o.stop(t+.55);lfo.stop(t+.55)}),
    pour:()=>once("pour",140,t=>{for(let i=0;i<4;i++)tone("sine",950-i*150,t+i*.09,.1,.04,{f2:600-i*80});nz(t,.5,.025,{f:900,q:.7,att:.05})}),
    deckHit:()=>once("deck",120,t=>{tone("square",110,t,.18,.05,{f2:70,lp:900});nz(t,.1,.1,{f:600,q:1.2})}),
    raise:()=>once("raise",120,t=>{tone("triangle",220,t,.3,.06,{f2:440});nz(t,.3,.025,{type:"highpass",f:2000,att:.1})}),
    cast:(school)=>once("cast",80,t=>{const I={Necromancy:[196,233],Enchantment:[392,494],Curse:[233,247],Sorcery:[330,494],Illusion:[370,466],Conjuring:[523,659],Astrology:[440,660],Bank:[784,988]}[school]||[440,554];
      I.forEach((f,i)=>tone("sine",f,t+i*.07,.6,.04));if(school==="Illusion")tone("sine",932,t+.14,.5,.015,{det:30})}),
    zap:()=>SND.zap(),
    meteor:()=>once("meteor",200,t=>{nz(t,.6,.08,{f:1200,f2:300,q:1.5,att:.4});nz(t+.55,.9,.26,{type:"lowpass",f:1500,f2:120});tone("sine",90,t+.55,.6,.3,{f2:30})}),
    /* ---------- the sky ---------- */
    bell:()=>once("bell",900,t=>{tone("sine",1800,t,.02,.03);[[.5,.05],[1,.06],[1.19,.04],[1.5,.03],[2,.03],[2.51,.02],[3,.015]].forEach(([r,a])=>tone("sine",196*r,t,3.6/(.6+r*.4),a,{att:.006}))}),
    horn:()=>once("horn",2500,t=>{const a=ac;[[65,73,.05],[92,103.8,.025]].forEach(([f0,f1,pk])=>{for(const det of [-6,6]){const o=a.createOscillator(),f=a.createBiquadFilter(),g=a.createGain(),v=a.createOscillator(),vg=a.createGain();
      o.type="sawtooth";o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+.35);o.detune.value=det;v.frequency.value=4.5;vg.gain.value=1.2;v.connect(vg).connect(o.frequency);
      f.type="lowpass";f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(1100,t+1);f.frequency.linearRampToValueAtTime(400,t+2.8);
      o.connect(f).connect(g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+.45);g.gain.setValueAtTime(pk,t+2);g.gain.exponentialRampToValueAtTime(.0001,t+2.9);dest(g);o.start(t);v.start(t);o.stop(t+3);v.stop(t+3)}})}),
    harp:()=>once("harp",12000,t=>{
      // Bach's Prelude in C, the first bars, as Gounod's Ave Maria opens: each bar's pattern twice
      const N=n=>440*Math.pow(2,(n-69)/12),bars=[[60,64,67,72,76],[60,62,69,74,77],[59,62,67,74,77],[60,64,67,72,76],[60,64,69,76,81],[60,62,66,69,74],[59,62,67,74,79],[59,60,64,67,72]];
      const st=.105;let k=0;for(const b of bars)for(let rep=0;rep<2;rep++){const pat=[b[0],b[1],b[2],b[3],b[4],b[2],b[3],b[4]];for(const n of pat){const tt=t+k*st,f=N(n);tone("triangle",f,tt,1.5,.03,{lp:2600});tone("sine",f*2,tt,.6,.008);k++}}}),
    coins:()=>once("coins",4000,t=>{for(let i=0;i<70;i++){const tt=t+Math.pow(Math.random(),1.4)*4.8,f=2200+Math.random()*3000,d=.08+Math.random()*.16;tone("sine",f,tt,d,.022);tone("sine",f*2.76,tt,d*.6,.008)}}),
    drums:()=>once("drums",1800,t=>{const b=60/112/2;const P="B.S.B.SSB.S.BSSS";
      for(let i=0;i<P.length*2;i++){const ch=P[i%P.length],tt=t+i*b;if(ch==="B")tone("sine",95,tt,.22,.16,{f2:55});if(ch==="S"){nz(tt,.12,.08,{f:1800,q:.7});tone("triangle",190,tt,.06,.03)}}}),
    quill:()=>once("quill",6000,t=>{let tt=t;while(tt<t+7){const d=.06+Math.random()*.18;nz(tt,d,.03+Math.random()*.03,{f:3600+Math.random()*1800,q:3,att:.01});tt+=d+Math.random()*.12+(Math.random()<.12?.4:0)}}),
    whispers:()=>once("whisper",3500,t=>{let tt=t+.3;while(tt<t+4){const d=.12+Math.random()*.14,F=Math.random()<.5?[700,1200]:[350,2300];for(const f of F)nz(tt,d,.018,{f,q:6,att:.04});nz(tt,d,.008,{type:"highpass",f:4000,att:.03});tt+=d+Math.random()*.1+(Math.random()<.2?.35:0)}}),
    moonchime:()=>once("moonchime",2000,t=>{[440,554,659,880].forEach((f,i)=>tone("sine",f,t+i*.18,1.6,.025))})
  };
  /* ---------- loops: ambiences ---------- */
  let amb=null,ambKey=null;
  function stopAmb(){if(!amb)return;const A=amb;amb=null;A.timers.forEach(clearInterval);const a=ac;if(a)A.gains.forEach(g=>{try{g.gain.cancelScheduledValues(a.currentTime);g.gain.setTargetAtTime(0,a.currentTime,.4)}catch(e){}});setTimeout(()=>A.nodes.forEach(n=>{try{n.stop()}catch(e){}}),2000)}
  function drone(A,f,type,peak,lp,det=0){const a=ac,o=a.createOscillator(),g=a.createGain(),fl=a.createBiquadFilter();o.type=type;o.frequency.value=f;o.detune.value=det;fl.type="lowpass";fl.frequency.value=lp||800;
    const l=a.createOscillator(),lg=a.createGain();l.frequency.value=.11+Math.random()*.08;lg.gain.value=peak*.4;l.connect(lg).connect(g.gain);
    o.connect(fl).connect(g);g.gain.setValueAtTime(0,a.currentTime);g.gain.linearRampToValueAtTime(peak,a.currentTime+2.5);dest(g);o.start();l.start();A.nodes.push(o,l);A.gains.push(g)}
  function hiss(A,peak,f,q){const a=ac,len=a.sampleRate*2,b=a.createBuffer(1,len,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(Math.random()<.004?3:1);
    const s=a.createBufferSource();s.buffer=b;s.loop=true;const fl=a.createBiquadFilter();fl.type="bandpass";fl.frequency.value=f;fl.Q.value=q;const g=a.createGain();s.connect(fl).connect(g);
    g.gain.setValueAtTime(0,a.currentTime);g.gain.linearRampToValueAtTime(peak,a.currentTime+1.5);dest(g);s.start();A.nodes.push(s);A.gains.push(g);
    A.timers.push(setInterval(()=>{if(!ac)return;const t=ac.currentTime;g.gain.setTargetAtTime(peak*(.4+Math.random()*1.3),t,.05)},260))}
  const AMB={
    moon:A=>{drone(A,110,"sine",.018,600);drone(A,164.8,"sine",.012,600,4);drone(A,220,"triangle",.006,900,-5)},
    blood:A=>{hiss(A,.022,1300,.8);drone(A,55,"sine",.03,300);drone(A,55.7,"sine",.022,300)},
    "ecl-sun":A=>{drone(A,82,"sawtooth",.012,260);A.timers.push(setInterval(()=>S.drums(),9000));S.drums()},
    "ecl-blacksun":A=>{drone(A,61,"sawtooth",.012,220);drone(A,92,"sine",.01,300)},
    "ecl-mars":A=>{drone(A,49,"sawtooth",.012,240);A.timers.push(setInterval(()=>S.horn(),11000));S.horn()},
    "ecl-venus":A=>{drone(A,130.8,"sine",.008,500);A.timers.push(setInterval(()=>S.harp(),18000));S.harp()},
    "ecl-jupiter":A=>{drone(A,98,"sine",.01,600);drone(A,147,"sine",.007,600);A.timers.push(setInterval(()=>S.coins(),8000));S.coins()},
    "ecl-mercury":A=>{drone(A,73,"triangle",.01,400);A.timers.push(setInterval(()=>{S.quill();setTimeout(()=>S.whispers(),2500)},10000));S.quill();setTimeout(()=>S.whispers(),2500)},
    "ecl-neptune":A=>{drone(A,46.2,"sine",.017,260);drone(A,69.3,"triangle",.008,380,-7);hiss(A,.012,650,.5)},   // v71c: deep water
    "ecl-saturn":A=>{drone(A,49,"sawtooth",.014,300);drone(A,73.5,"sawtooth",.009,300);A.timers.push(setInterval(()=>S.bell(),9000));S.bell()}};
  function setAmb(k){if(k===ambKey)return;stopAmb();if(!k||!AMB[k]||!ok()){ambKey=k&&AMB[k]?null:k;return}ambKey=k;const a=ctx();if(!a)return;amb={nodes:[],gains:[],timers:[]};try{AMB[k](amb)}catch(e){console.error(e)}}
  Object.assign(S,{setAmb,stopAmb,ok});Object.defineProperty(S,"ambKey",{get:()=>ambKey});return S;
})();

/* ---------- what plays when ---------- */
const sndSees=(r,c)=>{const V=view();return !totalBlind(V)&&!fogTile(V,r,c)};
/* buttons and cards */
document.addEventListener("click",e=>{if(!G||!e.target.closest)return;
  const card=e.target.closest(".cardbtn,.pk,.myscard.back,#board .tile");
  if(card){if(!card.matches(".tile")||card.querySelector(".stack"))AUD.card();return}
  if(e.target.closest("button,summary,label.opt,label.chk,select"))AUD.ui()},true);
{const _pl=place;place=function(card,r,c){const out=_pl.apply(this,arguments);if(card&&(card.owner===view()||sndSees(r,c)))AUD.place();return out}}
{const _dm=doMove;doMove=function(r,c){const s=G.sel,st=s&&G.board[s.r][s.c],own=st?st.owner:null;const hear=own===view()||s&&sndSees(s.r,s.c)&&sndSees(r,c);const out=_dm.apply(this,arguments);if(hear)AUD.move();return out}}
{const _at=attack;attack=function(r1,c1,r2,c2,mode){const A=G.board[r1]&&G.board[r1][c1];let snd=null;
  if(A&&AUD.ok()&&(A.owner===view()||sndSees(r1,c1)||sndSees(r2,c2))){const o=attackOptions(r1,c1).find(x=>x.r===r2&&x.c===c2&&(mode==null||x.mode===mode))||{};const id=o.mode||mode;
    snd=id==="slug"?"slug":id==="gun"?"gun":id==="bow"?"arrow":id==="cannon"||hasK(A,"cannon")&&o.ranged?"cannon":id==="charge"||id==="charge2"?"charge":id==="ram"?"blunt":o.ranged?"arrow":"clash"}
  if(snd)AUD[snd]();return _at.apply(this,arguments)}}
{const _bs=blindShot;blindShot=function(r1,c1,r2,c2,o){const A=G.board[r1]&&G.board[r1][c1],mine=A&&A.owner===view();const out=_bs.apply(this,arguments);if(out&&out.win&&mine)setTimeout(()=>AUD.hit(),260);return out}}
{const _bu=bury;bury=function(card,r,c,st){const hear=sndSees(r,c)||st&&st.owner===view();const out=_bu.apply(this,arguments);if(hear)AUD.death();return out}}
{const _ra=repairAct;repairAct=function(r,c,T){const out=_ra.apply(this,arguments);if(G.board[r][c]&&(G.board[r][c].owner===view()||sndSees(r,c)))AUD.repair();return out}}
{const _ss=skyStrike;skyStrike=function(r,c,why){AUD.meteor();return _ss.apply(this,arguments)}}
/* mana in and out */
{const _sp=spend;spend=function(pl,n){if(n>0&&pl===view())AUD.pour();return _sp.apply(this,arguments)}}
{const _gm=giveMana;giveMana=function(pl,n){const got=_gm.apply(this,arguments);if(got>0&&pl===view()&&G.phase!=="setup")AUD.fill();return got}}
{const _sac=sacrifice;sacrifice=function(card,from){const ok=_sac.apply(this,arguments);if(ok&&G.active===view())AUD.fill();return ok}}
/* the grave gives back; the deck loses */
{const _pg=pickGrave;pickGrave=async function(pl,n,title){const got=await _pg.apply(this,arguments);if(got)AUD.raise();return got}}
{const _dr=draw;draw=function(pl){const P=G.p[pl],b=P?P.deck.length:0;const out=_dr.apply(this,arguments);if(P)P._drawn=(P._drawn||0)+Math.max(0,b-P.deck.length);return out}}
/* spells: a chime in the school's interval */
{const _c=cast;cast=async function(sp){const L0=G&&G.log[0];const out=await _c.apply(this,arguments);
  if(sp&&G){const i=G.log.findIndex(l=>/ casts <b>/.test(l.html)),j=L0?G.log.indexOf(L0):-1;if(i>=0&&(j<0||i<j))AUD.cast(sp.id==="robbank"?"Bank":sp.school)}return out}}
/* the sky: risings, cycles, tolls and judgements, ambiences */
const SKY_SND={moon:"moonchime",saturn:"bell",mars:"horn",venus:"harp",jupiter:"coins",sun:"drums",blacksun:"drums",mercury:"quill"};
{const _ta=turnAsync;turnAsync=async function(pl){const P=G.p[pl];
  if(P&&!isHorde(pl)){if(planetUp("saturn")&&paysSaturn(pl))AUD.bell();if(sunUp()&&P.tribe!=="firm"&&P.sunNext!=null&&tnOf(pl)>=P.sunNext)AUD.drums()}
  return _ta.apply(this,arguments)}}
{const _cr=cycleRound;cycleRound=async function(){const out=await _cr.apply(this,arguments);if(cycleNow("venus"))AUD.harp();if(cycleNow("mercury")){AUD.quill();setTimeout(()=>AUD.whispers(),2600)}return out}}
{const _rd=render;render=function(){rSafe(_rd,this,arguments);if(!G)return;
  // a deck that shrank without being drawn from has lost cards
  for(const P of G.p){if(isNPC(P.i)||isHorde(P.i))continue;const n=P.deck.length;if(P._deckN!=null&&n<P._deckN-(P._drawn||0)&&G.phase!=="setup"&&(P.i===view()||!isEnemy(P.i,view())))AUD.deckHit();P._deckN=n;P._drawn=0}
  const k=sky();if(G._sndSky!==k){if(G._sndSky!==undefined&&SKY_SND[k]){AUD[SKY_SND[k]]();if(k==="mercury")setTimeout(()=>AUD.whispers(),2600)}G._sndSky=k}
  const m=G.moon;AUD.setAmb(G.over?null:m.blood?"blood":G.eclipse?"ecl-"+G.eclipse.k:!m.gone&&(m.i===0||m.i===4)?"moon":null)}}
/* the sound switch also stops an ambience at once */
{const _t=SND.toggle;SND.toggle=function(){const v=_t.call(SND);if(!v)AUD.setAmb(null);return v}}
document.addEventListener("visibilitychange",()=>{if(document.hidden)AUD.setAmb(null)});

if(window.__EC)Object.assign(window.__EC,{AUD});
