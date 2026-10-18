/* Ether's Crossroads music: old-cartridge dungeon songs made in the browser (no sound files). They play with the Ether's
   Crossroads theme on its pages: the first song on the landing and rules pages, all of them in random order in the game. Quiet by
   default; the volume goes from 0 to 150% in steps of 5%. The settings live with the game's display settings (localStorage
   "ec-prefs2": music, musicVol, theme) and the game's sound switch ("ec-sound"). Browsers only start sound after a click or tap. */
(function(){
  const N={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
  // "A4:2 F4:1 r:2 …" (lengths in eighths) -> [[midi|null,len]]
  const mel=s=>s.trim().split(/\s+/).map(t=>{const [n,l]=t.split(":");if(n==="r")return [null,+l];const m=/^([A-G][b#]?)(\d)$/.exec(n);return [12*(+m[2]+1)+N[m[1]],+l]});
  // chords: "Dm Bb Gm A" -> [[root midi (octave 3), third]]
  const chords=s=>s.trim().split(/\s+/).map(c=>{const m=/^([A-G][b#]?)(m?)$/.exec(c);return [48+N[m[1]],m[2]?3:4]});
  const TRACKS=[
    {name:"The Crossroads",bpm:76,bar:8,lead:"square",leadV:.16,bass:"arp",drum:"tick",
      chords:chords("Dm Dm Bb Bb Gm Gm A A Dm C Bb Bb Gm A Dm Dm"),
      mel:mel(`A4:2 F4:1 D4:1 E4:1 F4:1 G4:2 A4:3 Bb4:1 A4:2 G4:2 F4:2 D4:1 F4:1 Bb4:2 A4:2 G4:4 r:4
        G4:2 Bb4:1 D5:1 C5:2 Bb4:2 A4:3 G4:1 F4:2 E4:2 E4:2 C#5:2 E5:2 D5:1 C#5:1 A4:6 r:2
        D5:2 C5:1 A4:1 F4:2 A4:2 G4:2 E4:1 C5:1 Bb4:2 G4:2 F4:2 Bb4:2 D5:2 F5:2 Eb5:4 D5:2 C5:2
        Bb4:2 A4:2 G4:2 D5:2 C#5:3 A4:1 E4:2 G4:2 F4:2 E4:2 D4:4 r:8`)},
    {name:"Candle Vigil",bpm:58,bar:8,lead:"triangle",leadV:.3,bass:"slowarp",drum:"",
      chords:chords("Am F C E Am Dm E Am Am F C G Am Dm E Am"),
      mel:mel(`E5:4 C5:2 A4:2 F4:6 A4:2 G4:4 E4:2 G4:2 G#4:6 r:2 A4:2 B4:2 C5:2 E5:2 F5:4 E5:2 D5:2 B4:4 G#4:2 B4:2 A4:8
        r:2 E5:2 D5:2 C5:2 A4:4 C5:4 G4:4 C5:2 E5:2 D5:6 B4:2 C5:4 B4:2 A4:2 F4:4 A4:2 D5:2 E5:4 D5:2 B4:2 A4:8`)},
    {name:"Catacomb Steps",bpm:84,bar:8,lead:"square",leadV:.12,bass:"walk",drum:"kick",
      chords:chords("Em F Em D Em C D Em Am F Em B Em F D Em"),
      mel:mel(`E5:1 r:1 B4:1 r:1 G4:1 F4:1 E4:2 F4:1 r:1 A4:1 r:1 C5:2 B4:2 G4:1 A4:1 B4:2 E5:2 D5:2 F#4:2 A4:2 D5:2 C5:2
        B4:3 A4:1 G4:2 F4:2 E4:2 G4:2 C5:2 B4:2 A4:2 F#4:2 D4:2 F#4:2 E4:6 r:2
        A4:1 r:1 C5:1 r:1 E5:2 D5:2 C5:2 A4:2 F4:2 A4:2 B4:2 G4:2 E4:2 G4:2 F#4:2 A4:2 B4:2 D#5:2
        E5:3 D5:1 C5:2 B4:2 A4:2 F4:2 A4:2 C5:2 B4:2 A4:2 F#4:2 D5:2 E5:4 r:4`)},
    {name:"The Jester's Lament",bpm:64,bar:6,lead:"square",leadV:.11,bass:"waltz",drum:"",
      chords:chords("Dm A Dm Gm Dm A Bb A Dm Gm Dm A Bb Gm A Dm"),
      mel:mel(`D5:3 C#5:1 D5:2 E5:4 C#5:2 F5:2 E5:2 D5:2 Bb4:4 G4:2 A4:2 F4:2 A4:2 C#5:3 B4:1 A4:2 Bb4:2 D5:2 F5:2 E5:6
        A5:3 G5:1 F5:2 E5:2 D5:2 Bb4:2 A4:4 D5:2 C#5:6 D5:2 F5:2 D5:2 Bb4:2 D5:2 G5:2 F5:2 E5:2 C#5:2 D5:6`)},
    {name:"Tomb of Saturn",bpm:52,bar:8,lead:"sine",leadV:.34,bass:"drone",drum:"",
      chords:chords("Gm Eb Cm D Gm Eb Bb D Gm Eb Cm D Gm Eb Bb D"),
      mel:mel(`D5:4 Bb4:4 G4:6 r:2 Eb5:4 D5:2 C5:2 F#4:4 A4:4 G5:4 F5:2 D5:2 Eb5:6 r:2 D5:2 C5:2 Bb4:4 A4:4 F#4:4
        Bb4:4 G4:4 Eb4:6 r:2 G4:4 F4:2 Eb4:2 D4:4 F#4:4 D5:4 C5:2 Bb4:2 G4:6 r:2 F4:2 D4:2 Bb3:4 D4:8`)}
  ];
  const BASE=.17;   // 100% volume, kept low on purpose
  const prefs=()=>{try{return JSON.parse(localStorage.getItem("ec-prefs2")||"{}")}catch(e){return {}}};
  const soundOn=()=>{try{return localStorage.getItem("ec-sound")!=="off"}catch(e){return true}};
  const themeOn=P=>(P.theme==null?"darkfantasy":P.theme)==="darkfantasy";
  const vol=P=>Math.max(0,Math.min(1.5,P.musicVol==null?1:+P.musicVol));
  const inGame=()=>/ethers-crossroads-play/.test(location.pathname);
  const hz=m=>440*Math.pow(2,(m-69)/12);
  let ac=null,out=null,timer=null,playing=false,T=null,ti=0,next=0,step=0,mi=0,mLeft=0,total=0,last=-1;
  function ctx(){if(ac)return ac;const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();
    out=ac.createGain();out.gain.value=0;const lp=ac.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1600;
    const dl=ac.createDelay(1);dl.delayTime.value=.42;const fb=ac.createGain();fb.gain.value=.22;const wet=ac.createGain();wet.gain.value=.28;
    out.connect(lp);lp.connect(ac.destination);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(ac.destination);return ac}
  function note(type,f,t,dur,peak,rel){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.012);g.gain.setTargetAtTime(peak*.6,t+.05,.09);g.gain.setTargetAtTime(0,t+Math.max(.05,dur-.06),rel||.05);
    o.connect(g).connect(out);o.start(t);o.stop(t+dur+.6)}
  function hit(t,kind){const len=kind==="kick"?.12:.04,b=ac.createBuffer(1,Math.floor(ac.sampleRate*len),ac.sampleRate),d=b.getChannelData(0);
    for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*Math.pow(1-k/d.length,kind==="kick"?3:1);
    const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();f.type=kind==="kick"?"lowpass":"highpass";f.frequency.value=kind==="kick"?180:2500;g.gain.value=kind==="kick"?.5:.06;
    s.buffer=b;s.connect(f).connect(g).connect(out);s.start(t)}
  function pick(mode){if(mode!=="random")return 0;let i;do{i=Math.floor(Math.random()*TRACKS.length)}while(TRACKS.length>1&&i===last);return i}
  function load(i){T=TRACKS[i];ti=i;last=i;step=0;mi=0;mLeft=0;total=T.mel.reduce((a,x)=>a+x[1],0)}
  function tick(){if(!playing||!ac)return;const E8=60/T.bpm/2;
    while(next<ac.currentTime+.4){
      const bar=Math.floor(step/T.bar)%T.chords.length,i=step%T.bar,[root,third]=T.chords[bar];
      if(T.bass==="arp")note("triangle",hz(root+[0,7,12,7,12+third,7,12,7][i]-12),next,E8*.9,.5);
      else if(T.bass==="slowarp"){if(i%2===0)note("triangle",hz(root+[0,7,12,7][i/2%4]-12),next,E8*1.9,.45,.12)}
      else if(T.bass==="walk")note("triangle",hz(root+[0,0,7,12,10,7,3,7][i]-12),next,E8*.8,.5);
      else if(T.bass==="waltz"){if(i===0)note("triangle",hz(root-12),next,E8*1.8,.55,.1);else if(i===2||i===4){note("triangle",hz(root+third),next,E8*.9,.22);note("triangle",hz(root+7),next,E8*.9,.22)}}
      else if(T.bass==="drone"&&i===0){note("triangle",hz(root-12),next,E8*T.bar,.42,.4);note("sine",hz(root-5),next,E8*T.bar,.18,.4)}
      if(mLeft<=0){const [m,len]=T.mel[mi];mi++;mLeft=len;if(m)note(T.lead,hz(m),next,len*E8*.93,T.leadV,T.lead==="sine"?.35:.05);
        if(m&&T.lead==="sine")note("sine",hz(m+12),next,len*E8*.6,T.leadV*.25,.3)}   // a bell's overtone
      mLeft--;
      if(T.drum==="tick"&&i===4)hit(next,"tick");if(T.drum==="kick"&&(i===0||i===4))hit(next,"kick");
      next+=E8;step++;
      if(mi>=T.mel.length&&mLeft<=0){next+=E8*2;load(pick(MODE))}}   // the song ends: the next one (or the same, outside the game)
  }
  let MODE=inGame()?"random":"first";
  function start(){if(playing)return;if(!ctx())return;if(ac.state==="suspended")ac.resume();playing=true;load(pick(MODE));next=ac.currentTime+.15;
    out.gain.cancelScheduledValues(ac.currentTime);out.gain.setTargetAtTime(BASE*vol(prefs()),ac.currentTime,.8);timer=setInterval(tick,90);tick()}
  function stop(){if(!playing)return;playing=false;clearInterval(timer);timer=null;if(ac){out.gain.cancelScheduledValues(ac.currentTime);out.gain.setTargetAtTime(0,ac.currentTime,.3)}}
  const wanted=()=>{const P=prefs();return themeOn(P)&&P.music!==false&&soundOn()&&!document.hidden};
  function sync(){if(wanted())start();else stop();if(ac&&playing){out.gain.cancelScheduledValues(ac.currentTime);out.gain.setTargetAtTime(BASE*vol(prefs()),ac.currentTime,.15)}paint()}
  function setPref(k,v){const P=prefs();P[k]=v;try{localStorage.setItem("ec-prefs2",JSON.stringify(P))}catch(e){}}
  /* the landing and rules pages: a small control in the corner (the game has its own in the Display bar) */
  function paint(){const box=document.getElementById("ecmusic");if(!box)return;const P=prefs();box.hidden=!themeOn(P);
    box.querySelector(".mt").textContent="Music: "+(P.music!==false?"On":"Off");box.querySelector(".mv").textContent=Math.round(vol(P)*100)+"%"}
  function mountCorner(){if(inGame()||!document.documentElement.classList.contains("ecpage")||document.getElementById("ecmusic"))return;
    const box=document.createElement("div");box.id="ecmusic";box.innerHTML=`<button type="button" class="mt"></button><button type="button" class="mvb" data-d="-1" aria-label="Quieter">−</button><b class="mv"></b><button type="button" class="mvb" data-d="1" aria-label="Louder">+</button>`;
    document.body.appendChild(box);
    box.querySelector(".mt").onclick=()=>{const P=prefs();setPref("music",P.music===false);sync()};
    box.querySelectorAll(".mvb").forEach(b=>b.onclick=()=>{const P=prefs();setPref("musicVol",Math.round(Math.max(0,Math.min(1.5,vol(P)+ +b.dataset.d*.05))*100)/100);sync()});paint()}
  document.addEventListener("pointerdown",()=>{if(wanted()&&!playing)start()},true);
  document.addEventListener("keydown",()=>{if(wanted()&&!playing)start()},true);
  document.addEventListener("visibilitychange",sync);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountCorner);else mountCorner();
  window.ECMusic={sync,start,stop,get playing(){return playing},get track(){return T?T.name:null},tracks:TRACKS.map(t=>t.name),setMode:m=>{MODE=m},
    setVol:v=>{setPref("musicVol",Math.round(Math.max(0,Math.min(1.5,v))*100)/100);sync()},get vol(){return vol(prefs())}};
})();
