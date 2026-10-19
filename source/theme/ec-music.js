/* Ether's Crossroads music: old-cartridge dungeon songs made in the browser (no sound files). They play with the Ether's
   Crossroads theme on its pages: the first song on the landing and rules pages; in the game its own first song, then every song once in a shuffled order that favors the songs heard longest ago. Quiet by
   default; the volume goes from 0 to 150% in steps of 5%. The settings live with the game's display settings (localStorage
   "ec-prefs2": music, musicVol, theme) and the game's sound switch ("ec-sound"). Browsers only start sound after a click or tap. */
(function(){
  const N={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
  // "A4:2 F4:1 r:2 …" (lengths in eighths) -> [[midi|null,len]]
  const mel=s=>s.trim().split(/\s+/).map(t=>{const [n,l]=t.split(":");if(n==="r")return [null,+l];const m=/^([A-G][b#]?)(\d)$/.exec(n);return [12*(+m[2]+1)+N[m[1]],+l]});
  // chords: "Dm Bb Gm A" -> [[root midi (octave 3), third]]
  const chords=s=>s.trim().split(/\s+/).map(c=>{const m=/^([A-G][b#]?)(m|dim)?$/.exec(c);return [48+N[m[1]],m[2]?3:4,m[2]==="dim"?6:7]});
  const TRACKS=[
    {name:"The Crossroads",bpm:76,bar:8,lead:"square",leadV:.16,bass:"arp",drum:"tick",
      chords:chords("Dm Dm Bb Bb Gm Gm A A Dm C Bb Bb Gm A Dm Dm"),
      mel:mel(`A4:2 F4:1 D4:1 E4:1 F4:1 G4:2 A4:3 Bb4:1 A4:2 G4:2 F4:2 D4:1 F4:1 Bb4:2 A4:2 G4:4 r:4
        G4:2 Bb4:1 D5:1 C5:2 Bb4:2 A4:3 G4:1 F4:2 E4:2 E4:2 C#5:2 E5:2 D5:1 C#5:1 A4:6 r:2
        D5:2 C5:1 A4:1 F4:2 A4:2 G4:2 E4:1 C5:1 Bb4:2 G4:2 F4:2 Bb4:2 D5:2 F5:2 Eb5:4 D5:2 C5:2
        Bb4:2 A4:2 G4:2 D5:2 C#5:3 A4:1 E4:2 G4:2 F4:2 E4:2 D4:4 r:8`)},
    {name:"Candle Vigil",bpm:58,bar:8,bass:"slowarp",drum:"",lead:"musicbox",leadV:.22,lp:3400,echo:.36,fb:.34,dly:.55,
      chords:chords("Am F C E Am Dm E Am Am F C G Am Dm E Am"),
      mel:mel(`E5:4 C5:2 A4:2 F4:6 A4:2 G4:4 E4:2 G4:2 G#4:6 r:2 A4:2 B4:2 C5:2 E5:2 F5:4 E5:2 D5:2 B4:4 G#4:2 B4:2 A4:8
        r:2 E5:2 D5:2 C5:2 A4:4 C5:4 G4:4 C5:2 E5:2 D5:6 B4:2 C5:4 B4:2 A4:2 F4:4 A4:2 D5:2 E5:4 D5:2 B4:2 A4:8`)},
    {name:"Catacomb Steps",bpm:84,bar:8,bass:"walk",lead:"pluck",leadV:.2,drum:"kick metal",lp:2600,
      chords:chords("Em F Em D Em C D Em Am F Em B Em F D Em"),
      mel:mel(`E5:1 r:1 B4:1 r:1 G4:1 F4:1 E4:2 F4:1 r:1 A4:1 r:1 C5:2 B4:2 G4:1 A4:1 B4:2 E5:2 D5:2 F#4:2 A4:2 D5:2 C5:2
        B4:3 A4:1 G4:2 F4:2 E4:2 G4:2 C5:2 B4:2 A4:2 F#4:2 D4:2 F#4:2 E4:6 r:2
        A4:1 r:1 C5:1 r:1 E5:2 D5:2 C5:2 A4:2 F4:2 A4:2 B4:2 G4:2 E4:2 G4:2 F#4:2 A4:2 B4:2 D#5:2
        E5:3 D5:1 C5:2 B4:2 A4:2 F4:2 A4:2 C5:2 B4:2 A4:2 F#4:2 D5:2 E5:4 r:4`)},
    {name:"The Jester's Lament",bpm:64,bar:6,bass:"waltz",drum:"",lead:"accordion",leadV:.1,lp:2200,
      chords:chords("Dm A Dm Gm Dm A Bb A Dm Gm Dm A Bb Gm A Dm"),
      mel:mel(`D5:3 C#5:1 D5:2 E5:4 C#5:2 F5:2 E5:2 D5:2 Bb4:4 G4:2 A4:2 F4:2 A4:2 C#5:3 B4:1 A4:2 Bb4:2 D5:2 F5:2 E5:6
        A5:3 G5:1 F5:2 E5:2 D5:2 Bb4:2 A4:4 D5:2 C#5:6 D5:2 F5:2 D5:2 Bb4:2 D5:2 G5:2 F5:2 E5:2 C#5:2 D5:6`)},
    {name:"Tomb of Saturn",bpm:52,bar:8,drum:"",lead:"organ",leadV:.13,bass:"sub",lp:1300,echo:.4,fb:.4,dly:.6,
      chords:chords("Gm Eb Cm D Gm Eb Bb D Gm Eb Cm D Gm Eb Bb D"),
      mel:mel(`D5:4 Bb4:4 G4:6 r:2 Eb5:4 D5:2 C5:2 F#4:4 A4:4 G5:4 F5:2 D5:2 Eb5:6 r:2 D5:2 C5:2 Bb4:4 A4:4 F#4:4
        Bb4:4 G4:4 Eb4:6 r:2 G4:4 F4:2 Eb4:2 D4:4 F#4:4 D5:4 C5:2 Bb4:2 G4:6 r:2 F4:2 D4:2 Bb3:4 D4:8`)},
    /* v46: more songs, darker and stiller: ambient pads, a heartbeat, water dripping in a well, a creeping vibrato */
    {name:"Lantern in the Fog",bpm:66,bar:8,lead:"pulse",leadV:.1,bass:"slowarp",drum:"static",lp:1800,
      chords:chords("Am Am F F Dm Dm E E Am Am F F Dm E Am Am"),
      mel:mel(`E5:3 D5:1 C5:2 A4:2 B4:2 C5:2 E5:4 F5:3 E5:1 C5:2 A4:2 C5:6 r:2 D5:3 E5:1 F5:2 A5:2 G5:2 F5:2 E5:2 D5:2
        E5:3 D5:1 B4:2 G#4:2 B4:6 r:2 A4:2 C5:2 E5:2 A5:2 G5:2 E5:2 C5:2 E5:2 F5:2 E5:2 D5:2 C5:2 A4:6 r:2
        F5:3 E5:1 D5:2 A4:2 G#4:3 A4:1 B4:2 E5:2 C5:2 B4:1 A4:1 E4:4 A4:6 r:2`)},
    {name:"The Drowned Chapel",bpm:48,bar:8,drum:"drip",lead:"glass",leadV:.22,bass:"choirpad",lp:2400,echo:.42,fb:.42,dly:.7,
      chords:chords("Dm Eb Dm Eb Gm Eb Dm Dm Bb Eb Dm A Dm Eb Dm Dm"),
      mel:mel(`A4:4 D5:4 Eb5:6 r:2 D5:2 C5:2 A4:4 Bb4:4 G4:4 G4:2 Bb4:2 D5:4 Eb5:4 D5:2 Bb4:2 A4:8 r:8
        F5:4 D5:4 Eb5:4 G5:4 F5:2 E5:2 D5:4 C#5:4 E5:4 D5:4 A4:4 G4:4 Bb4:2 Eb5:2 D5:8 r:8`)},
    {name:"Ossuary",bpm:72,bar:8,bass:"walk",lead:"fmbell",leadV:.12,drum:"heart metal",lp:2800,
      chords:chords("Em Em C B Em Em Am B Em G C B Am F# B Em"),
      mel:mel(`E5:1 r:1 G5:1 r:1 B4:2 E5:2 D#5:2 E5:2 B4:4 C5:1 r:1 E5:1 r:1 G5:2 E5:2 F#5:2 D#5:2 B4:4
        G5:2 F#5:1 E5:1 B4:2 G4:2 A#4:2 B4:2 E4:4 C5:2 E5:2 A5:2 G5:1 F5:1 F#5:3 E5:1 D#5:4
        E5:2 B4:2 G4:2 E4:2 D5:2 B4:2 G4:2 B4:2 E5:3 D5:1 C5:2 G4:2 B4:2 C5:2 B4:2 A#4:2
        A4:2 C5:2 E5:2 C5:2 A#4:2 C#5:2 F#5:4 F#5:2 E5:2 D#5:2 B4:2 E5:6 r:2`)},
    {name:"Whispers Under the Stair",bpm:60,bar:8,vib:true,bass:"drone",lead:"choir",leadV:.1,drum:"static",lp:2000,echo:.38,fb:.36,
      chords:chords("Cm Cm Ab G Cm Cm Fm G Ab Ab Fm G Cm Bdim Cm Cm"),
      mel:mel(`G4:4 Ab4:2 G4:2 Eb5:4 D5:2 C5:2 C5:3 B4:1 C5:2 Eb5:2 D5:4 B4:4 G4:2 F#4:2 F4:2 E4:2 Eb4:6 r:2
        F4:2 Ab4:2 C5:2 Db5:2 B4:4 D5:4 Eb5:4 C5:4 Db5:3 C5:1 Ab4:4 F5:3 Eb5:1 Db5:2 C5:2 B4:6 r:2
        C5:2 Eb5:2 G5:4 F5:2 D5:2 B4:4 C5:4 G4:4 C5:6 r:2`)},
    {name:"The Hollow King",bpm:80,bar:8,bass:"arp",lead:"brass",leadV:.1,drum:"trip",lp:2400,
      chords:chords("Gm D Gm Cm Gm Eb D D Gm D Gm Cm Eb Cm D Gm"),
      mel:mel(`G4:2 Bb4:2 D5:3 Bb4:1 A4:2 F#4:2 D4:4 G4:1 A4:1 Bb4:2 C5:2 D5:2 Eb5:3 D5:1 C5:2 G4:2
        D5:2 G5:2 F5:2 D5:2 Eb5:2 Bb4:2 G4:2 Bb4:2 A4:3 C5:1 F#4:2 A4:2 D5:6 r:2
        G5:3 F5:1 D5:2 Bb4:2 C5:2 A4:2 F#4:2 A4:2 Bb4:2 D5:2 G5:4 G5:2 Eb5:2 C5:4
        Bb4:2 Eb5:2 G5:2 F5:2 Eb5:2 D5:2 C5:2 Eb5:2 D5:3 C5:1 A4:2 F#4:2 G4:6 r:2`)},
    {name:"Moonless Road",bpm:70,bar:8,lead:"mandolin",leadV:.16,bass:"sub",drum:"trip",lp:3000,echo:.3,
      chords:chords("Bm G Em F# Bm G A F# Bm D Em F# G Em F# Bm"),
      mel:mel(`F#5:4 D5:2 B4:2 B4:3 D5:1 G5:4 E5:2 G5:2 B5:2 G5:2 F#5:6 E5:2 D5:2 C#5:2 B4:4 G4:2 B4:2 D5:4
        C#5:2 E5:2 A4:4 A#4:6 r:2 B4:2 D5:2 F#5:4 A5:3 F#5:1 D5:4 G5:2 E5:2 B4:2 E5:2 C#5:4 A#4:4
        B4:2 D5:2 G5:2 F#5:2 E5:3 D5:1 B4:4 C#5:3 B4:1 A#4:4 B4:6 r:2`)},
    {name:"Black Candle Waltz",bpm:62,bar:6,bass:"waltz",drum:"",lead:"musicbox",leadV:.2,lp:3600,echo:.32,
      chords:chords("Em B Em Am Em C B B Em B Em Am C Am B Em"),
      mel:mel(`B4:3 E5:1 G5:2 F#5:4 D#5:2 E5:2 G5:2 B5:2 A5:3 G5:1 E5:2 G5:2 F#5:2 E5:2 E5:4 C5:2 D#5:3 E5:1 F#5:2 B4:6
        E5:3 F#5:1 G5:2 A5:2 F#5:2 D#5:2 E5:2 B4:2 G4:2 C5:3 B4:1 A4:2 G4:2 C5:2 E5:2 E5:3 D5:1 C5:2 B4:2 D#5:2 F#5:2 E5:6`)},
    {name:"The Well at Midnight",bpm:46,bar:8,bass:"pad",lead:"fmbell",leadV:.12,drum:"drip static",lp:2200,echo:.44,fb:.44,dly:.75,
      chords:chords("Am Bb Am Bb Gm Bb Am Am Dm Bb Am E Am Bb Am Am"),
      mel:mel(`E5:6 r:2 F5:4 D5:4 C5:8 r:4 Bb4:4 D5:4 G4:4 F5:6 r:2 E5:4 A4:4 r:8
        F5:4 A5:4 Bb5:4 F5:4 E5:8 G#4:4 B4:4 A4:6 r:2 D5:4 F5:4 E5:8 r:8`)},
    {name:"Gate of Thorns",bpm:88,bar:8,lead:"dist",leadV:.08,bass:"sub",drum:"both metal",lp:2600,
      chords:chords("Fm Db Eb C Fm Db Bbm C Fm Ab Eb C Db Bbm C Fm"),
      mel:mel(`F5:1 r:1 C5:1 r:1 Ab4:2 F4:2 Db5:2 F5:2 Ab5:2 F5:2 G5:2 Eb5:2 Bb4:2 G4:2 E5:3 F5:1 G5:4
        Ab5:2 G5:1 F5:1 C5:2 F5:2 Ab5:2 F5:2 Db5:4 Db5:2 F5:2 Bb5:2 Ab5:2 G5:2 E5:2 C5:4
        C5:2 F5:2 Ab5:3 G5:1 Eb5:2 C5:2 Ab4:4 Bb4:2 Eb5:2 G5:3 F5:1 E5:2 G5:2 C6:4
        Ab5:2 F5:2 Db5:2 F5:2 F5:3 Db5:1 Bb4:4 C5:2 E5:2 G5:2 E5:2 F5:6 r:2`)},
    {name:"Ashen Lullaby",bpm:56,bar:8,drum:"",lead:"glass",leadV:.24,bass:"choirpad",lp:3000,echo:.36,
      chords:chords("Dm Gm A Dm Dm Bb Gm A Dm F Gm A Bb Gm A Dm"),
      mel:mel(`A4:4 F4:2 D4:2 D5:4 Bb4:4 C#5:3 B4:1 A4:4 D5:6 r:2 F5:4 E5:2 D5:2 D5:4 F5:4 G5:3 F5:1 D5:4 E5:6 r:2
        A4:2 D5:2 F5:4 A5:4 F5:4 G5:2 F5:2 D5:2 Bb4:2 A4:4 C#5:4 D5:4 F5:2 D5:2 Bb4:4 G4:4 E5:3 C#5:1 A4:4 D5:6 r:2`)},
    {name:"Requiem for the Ether",bpm:54,bar:8,drum:"heart",lead:"organ",leadV:.12,bass:"choirpad",lp:1600,echo:.4,fb:.38,
      chords:chords("C#m A F#m G# C#m A E G# C#m F#m A G# A F#m G# C#m"),
      mel:mel(`G#4:4 C#5:4 E5:6 C#5:2 F#5:4 A5:2 F#5:2 G#5:6 r:2 E5:4 C#5:4 A5:4 E5:4 B4:4 G#4:2 E5:2 C5:6 r:2
        C#5:2 E5:2 G#5:4 A5:4 F#5:4 E5:2 C#5:2 A4:4 D#5:4 C5:4 C#5:4 E5:4 F#5:3 E5:1 C#5:4 D#5:4 G#4:4 C#5:8`)}
  ];  const BASE=.17;   // 100% volume, kept low on purpose
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
    out.connect(lp);lp.connect(ac.destination);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(ac.destination);BUS={lp,dl,fb,wet};return ac}
  let BUS=null;
  /* v55: each song sets its own room: how bright (the low-pass), how far the echo, how long it rings */
  function room(){if(!BUS||!T)return;const t=ac.currentTime;BUS.lp.frequency.setTargetAtTime(T.lp||1600,t,.5);BUS.dl.delayTime.setTargetAtTime(T.dly||.42,t,.5);
    BUS.fb.gain.setTargetAtTime(T.fb||.22,t,.5);BUS.wet.gain.setTargetAtTime(T.echo||.28,t,.5)}
  let PW=null;   // a 25% pulse, the old cartridge's thin square
  function pulseWave(){if(PW)return PW;const n=32,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)im[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*.25);PW=ac.createPeriodicWave(re,im);return PW}
  /* v55: instruments beyond the cartridge's waves, so the songs don't all sound alike: a music box, a church organ, glass,
     a metallic FM bell, a harpsichord pluck, a tremolo mandolin, an accordion, a filtered brass, a formant choir, and a
     distorted industrial lead (a little Silent Hill) */
  const env=(g,t,a,peak,hold,rel)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(0,t+Math.max(a,hold),rel)};
  const osc=(type,f,t,stop,dest)=>{const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.connect(dest);o.start(t);o.stop(stop);return o};
  let DIST=null;function distCurve(){if(DIST)return DIST;const n=1024;DIST=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;DIST[i]=Math.tanh(x*5)}return DIST}
  function voice(type,f,t,dur,peak,rel,vib){
    if(type==="musicbox"){const g=ac.createGain();g.connect(out);env(g,t,.004,peak,.02,.55);osc("sine",f,t,t+2.6,g);
      const g2=ac.createGain();g2.connect(out);env(g2,t,.003,peak*.35,.01,.18);osc("sine",f*4.01,t,t+1,g2);
      const g3=ac.createGain();g3.connect(out);env(g3,t,.003,peak*.18,.01,.3);osc("sine",f*2.76,t,t+1.4,g3);return true}
    if(type==="organ"){const g=ac.createGain();g.connect(out);env(g,t,.09,peak,dur-.05,.18);[[1,1],[2,.5],[3,.28],[4,.16],[6,.07]].forEach(([h,a])=>{const k=ac.createGain();k.gain.value=a;k.connect(g);osc("sine",f*h,t,t+dur+1,k)});return true}
    if(type==="glass"){const g=ac.createGain();g.connect(out);env(g,t,.02,peak,.04,Math.max(.4,dur*.5));osc("triangle",f*2,t,t+dur+2,g);const g2=ac.createGain();g2.connect(out);env(g2,t,.01,peak*.25,.02,.4);osc("sine",f*5.04,t,t+1.5,g2);return true}
    if(type==="fmbell"){const g=ac.createGain();g.connect(out);env(g,t,.003,peak,.01,.9);const c=osc("sine",f,t,t+3.5,g);const mg=ac.createGain();mg.gain.setValueAtTime(f*2.2,t);mg.gain.setTargetAtTime(f*.2,t,.5);
      const m=ac.createOscillator();m.frequency.value=f*3.5;m.connect(mg).connect(c.frequency);m.start(t);m.stop(t+3.5);return true}
    if(type==="pluck"||type==="mandolin"){const strum=tt=>{const g=ac.createGain(),lp=ac.createBiquadFilter();lp.type="lowpass";lp.frequency.setValueAtTime(4200,tt);lp.frequency.setTargetAtTime(700,tt,.06);
        g.connect(out);lp.connect(g);env(g,tt,.003,peak,.01,type==="pluck"?.16:.05);osc("square",f,tt,tt+.6,lp);osc("sawtooth",f*1.004,tt,tt+.6,lp)};
      if(type==="pluck")strum(t);else for(let tt=t;tt<t+Math.max(.08,dur-.03);tt+=.075)strum(tt);return true}
    if(type==="accordion"){const g=ac.createGain();g.connect(out);env(g,t,.05,peak,dur-.05,.08);const tr=ac.createGain();tr.gain.value=1;tr.connect(g);
      const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=6.2;lg.gain.value=.3;l.connect(lg).connect(tr.gain);l.start(t);l.stop(t+dur+.5);
      osc("square",f,t,t+dur+.5,tr);osc("square",f*1.007,t,t+dur+.5,tr);return true}
    if(type==="brass"){const g=ac.createGain(),lp=ac.createBiquadFilter();lp.type="lowpass";lp.frequency.setValueAtTime(380,t);lp.frequency.linearRampToValueAtTime(2300,t+.08);lp.frequency.setTargetAtTime(1100,t+.1,.2);
      lp.connect(g);g.connect(out);env(g,t,.05,peak,dur-.05,.09);osc("sawtooth",f,t,t+dur+.5,lp);osc("sawtooth",f*.997,t,t+dur+.5,lp);return true}
    if(type==="choir"){const g=ac.createGain();g.connect(out);env(g,t,.28,peak,dur-.1,.45);
      for(const [fq,q,a] of [[730,6,1],[1090,7,.7],[2440,8,.25]]){const bp=ac.createBiquadFilter();bp.type="bandpass";bp.frequency.value=fq;bp.Q.value=q;const k=ac.createGain();k.gain.value=a*2.2;bp.connect(k).connect(g);
        const o1=osc("sawtooth",f,t,t+dur+1,bp),o2=osc("sawtooth",f*1.005,t,t+dur+1,bp);if(vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=4.8;lg.gain.value=f*.008;l.connect(lg);lg.connect(o1.frequency);lg.connect(o2.frequency);l.start(t);l.stop(t+dur+1)}}
      return true}
    if(type==="dist"){const g=ac.createGain(),ws=ac.createWaveShaper(),lp=ac.createBiquadFilter();ws.curve=distCurve();lp.type="lowpass";lp.frequency.value=1700;ws.connect(lp).connect(g);g.connect(out);env(g,t,.01,peak,dur-.04,.07);
      osc("sawtooth",f,t,t+dur+.4,ws);osc("sawtooth",f*.5,t,t+dur+.4,ws);return true}
    return false}
  function note(type,f,t,dur,peak,rel,vib){if(voice(type,f,t,dur,peak,rel,vib))return;const o=ac.createOscillator(),g=ac.createGain();if(type==="pulse")o.setPeriodicWave(pulseWave());else o.type=type;o.frequency.setValueAtTime(f,t);
    if(vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.2;lg.gain.value=f*.007;l.connect(lg).connect(o.frequency);l.start(t);l.stop(t+dur+.6)}
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.012);g.gain.setTargetAtTime(peak*.6,t+.05,.09);g.gain.setTargetAtTime(0,t+Math.max(.05,dur-.06),rel||.05);
    o.connect(g).connect(out);o.start(t);o.stop(t+dur+.6)}
  function pad(f,t,dur,peak){const o=ac.createOscillator(),g=ac.createGain();o.type="triangle";o.frequency.setValueAtTime(f,t);o.detune.setValueAtTime(-6+Math.random()*12,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+Math.min(.9,dur*.4));g.gain.setTargetAtTime(0,t+dur*.8,dur*.18);o.connect(g).connect(out);o.start(t);o.stop(t+dur*1.6)}
  function drip(t,f){const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.5,t+.08);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.005);g.gain.setTargetAtTime(0,t+.02,.07);o.connect(g).connect(out);o.start(t);o.stop(t+.5)}
  function clank(t){const b=ac.createBuffer(1,Math.floor(ac.sampleRate*.3),ac.sampleRate),d=b.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*Math.pow(1-k/d.length,6);
    const s=ac.createBufferSource(),bp=ac.createBiquadFilter(),g=ac.createGain();bp.type="bandpass";bp.frequency.value=2600+Math.random()*1800;bp.Q.value=14;g.gain.value=.5;s.buffer=b;s.connect(bp).connect(g).connect(out);s.start(t);
    const f=180+Math.random()*240;voice("fmbell",f,t,.3,.035,.2,false)}
  function hit(t,kind){if(kind==="snare"||kind==="static"){const len=kind==="snare"?.2:1.3,b=ac.createBuffer(1,Math.floor(ac.sampleRate*len),ac.sampleRate),d=b.getChannelData(0);
      for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*(kind==="snare"?Math.pow(1-k/d.length,4):Math.sin(Math.PI*k/d.length)*(.6+.4*Math.sin(k/900)));
      const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();f.type="bandpass";f.frequency.value=kind==="snare"?1800:3200;f.Q.value=kind==="snare"?.8:.6;g.gain.value=kind==="snare"?.22:.045;
      s.buffer=b;s.connect(f).connect(g).connect(out);s.start(t);return}
    const len=kind==="tick"?.04:.12,b=ac.createBuffer(1,Math.floor(ac.sampleRate*len),ac.sampleRate),d=b.getChannelData(0);
    for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*Math.pow(1-k/d.length,kind==="tick"?1:3);
    const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();f.type=kind==="tick"?"highpass":"lowpass";f.frequency.value=kind==="tick"?2500:kind==="soft"?140:180;g.gain.value=kind==="kick"?.5:kind==="soft"?.3:.06;
    s.buffer=b;s.connect(f).connect(g).connect(out);s.start(t)}
  /* the order in the game (v46): its own first song, then every song once before the order is shuffled again; each new
     order tends to bring first the songs heard longest ago. The order and when each song was last heard are kept on this
     device ("ec-music-hist"), so a new page carries on where the last one stopped. */
  const GAME_FIRST="Lantern in the Fog",HKEY="ec-music-hist",names=TRACKS.map(t=>t.name);
  const hist=()=>{let h;try{h=JSON.parse(localStorage.getItem(HKEY)||"{}")}catch(e){h={}}h.heard=h.heard||{};h.bag=(h.bag||[]).filter(n=>names.includes(n));return h};
  const saveHist=h=>{try{localStorage.setItem(HKEY,JSON.stringify(h))}catch(e){}};
  function newBag(h,lastName){const now=Date.now(),age=n=>h.heard[n]?Math.max(1,(now-h.heard[n])/60000):1e7;   // minutes since it was heard
    const bag=names.map(n=>({n,k:Math.pow(Math.random(),1/Math.log(2+age(n)))})).sort((a,b)=>b.k-a.k).map(x=>x.n);   // weighted shuffle: older songs lean to the front
    if(lastName&&bag[0]===lastName&&bag.length>1)bag.push(bag.shift());return bag}
  let firstDone=false;
  function pick(mode){if(mode!=="random")return 0;const h=hist();let n;h.played=(h.played||[]).filter(x=>names.includes(x));
    if(!firstDone&&names.includes(GAME_FIRST)){n=GAME_FIRST;h.bag=h.bag.filter(x=>x!==n);if(!h.played.includes(n))h.played.push(n)}
    else{if(!h.bag.length){h.bag=newBag(h,last>=0?names[last]:null).filter(x=>!h.played.includes(x));if(!h.bag.length){h.played=[];h.bag=newBag(h,last>=0?names[last]:null)}}
      n=h.bag.shift();h.played.push(n);if(!h.bag.length)h.played=[]}   // a cycle ends when its last song starts
    firstDone=true;h.heard[n]=Date.now();saveHist(h);return names.indexOf(n)}
  function load(i){T=TRACKS[i];ti=i;last=i;step=0;mi=0;mLeft=0;total=T.mel.reduce((a,x)=>a+x[1],0);if(ac)room()}
  function tick(){if(!playing||!ac)return;const E8=60/T.bpm/2;
    while(next<ac.currentTime+.4){
      const bar=Math.floor(step/T.bar)%T.chords.length,i=step%T.bar,[root,third,fifth]=T.chords[bar];
      if(T.bass==="arp")note("triangle",hz(root+[0,fifth,12,fifth,12+third,fifth,12,fifth][i]-12),next,E8*.9,.5);
      else if(T.bass==="slowarp"){if(i%2===0)note("triangle",hz(root+[0,fifth,12,fifth][i/2%4]-12),next,E8*1.9,.45,.12)}
      else if(T.bass==="walk")note("triangle",hz(root+[0,0,fifth,12,10,fifth,3,fifth][i]-12),next,E8*.8,.5);
      else if(T.bass==="waltz"){if(i===0)note("triangle",hz(root-12),next,E8*1.8,.55,.1);else if(i===2||i===4){note("triangle",hz(root+third),next,E8*.9,.22);note("triangle",hz(root+fifth),next,E8*.9,.22)}}
      else if(T.bass==="drone"&&i===0){note("triangle",hz(root-12),next,E8*T.bar,.42,.4);note("sine",hz(root-5),next,E8*T.bar,.18,.4)}
      else if(T.bass==="pad"&&i===0){const d=E8*T.bar;note("triangle",hz(root-12),next,d,.36,.5);for(const x of [0,third,fifth])pad(hz(root+x),next,d,.07)}
      else if(T.bass==="sub"){if(i===0||i===4)note("sine",hz(root-24),next,E8*3.6,.6,.25);if(i===6)note("sine",hz(root-12),next,E8*.9,.3)}
      else if(T.bass==="choirpad"&&i===0){const d=E8*T.bar;note("sine",hz(root-12),next,d,.32,.5);for(const x of [0,third,fifth])voice("choir",hz(root+x),next,d,.035,.5,false)}
      if(mLeft<=0){const [m,len]=T.mel[mi];mi++;mLeft=len;if(m)note(T.lead,hz(m),next,len*E8*.93,T.leadV,T.lead==="sine"?.35:.05,T.vib);
        if(m&&T.lead==="sine")note("sine",hz(m+12),next,len*E8*.6,T.leadV*.25,.3)}   // a bell's overtone
      mLeft--;
      const D=(T.drum||"").split(" "),has=k=>D.includes(k);
      if(has("tick")&&i===4)hit(next,"tick");if((has("kick")||has("both"))&&(i===0||i===4))hit(next,"kick");if(has("both")&&(i===2||i===6))hit(next,"tick");
      if(has("heart")&&i===0)hit(next,"kick");if(has("heart")&&i===1)hit(next+E8*.15,"soft");
      if(has("drip")&&(step*7)%23===3)drip(next,hz(84+(step*5)%7));
      if(has("trip")){if(i===0||i===5&&bar%2)hit(next,"kick");if(i===4)hit(next,"snare");if(i%2===1)hit(next,"tick")}   // a slow, dragging beat
      if(has("metal")&&(i===3||i===7)&&((step*11+bar*3)%5===0))clank(next);   // iron struck somewhere in the dark
      if(has("static")&&i===0&&(bar*7)%3===1)hit(next,"static");   // a radio that won't quite tune
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
  function nextSong(){if(!playing||!ac)return;load(pick(MODE));next=ac.currentTime+.15;tick()}
  /* the game's cycle sounds dip the music for a moment; the volume settings stay as they are */
  let duckT=null;
  function duck(ms){if(!ac||!playing)return;const t=ac.currentTime;out.gain.cancelScheduledValues(t);out.gain.setTargetAtTime(BASE*vol(prefs())*.22,t,.08);
    clearTimeout(duckT);duckT=setTimeout(()=>{if(!ac||!playing)return;out.gain.cancelScheduledValues(ac.currentTime);out.gain.setTargetAtTime(BASE*vol(prefs()),ac.currentTime,.7)},ms||2600)}
  window.ECMusic={sync,start,stop,duck,next:nextSong,get playing(){return playing},get track(){return T?T.name:null},tracks:TRACKS.map(t=>t.name),setMode:m=>{MODE=m},
    setVol:v=>{setPref("musicVol",Math.round(Math.max(0,Math.min(1.5,v))*100)/100);sync()},get vol(){return vol(prefs())}};
})();
