/* Nous Within Kenoma page effects.
   - strings: thin black lines stretched across the page (data-fx contains "strings")
   - bars: rare black gaps across the screen behind the page (data-fx contains "bars"); never on buttons or boxes
   - the reader's look, shared with the game's Display settings (localStorage "ec-prefs2"): lines (the strings and bars
     on or off) and bright (the page's brightness, 0.7 to 1.3)
   - static: animated fuzzy static with faint scanlines and an occasional flicker, behind the text.
     Level comes from <body data-static="0-4">; the reader can only switch it off (bottom-right button). */
(function(){
  const NS="http://www.w3.org/2000/svg",R=Math.random;
  const body=document.body,fx=(body.dataset.fx||"").split(/\s+/);let LV=+(body.dataset.static||0);
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}

  /* ---------- strings and background bars ---------- */
  const lookPref=()=>{try{return JSON.parse(localStorage.getItem("ec-prefs2")||"{}")}catch(e){return {}}};
  const lite=()=>document.documentElement.classList.contains("lite");   // v71j: Data saving or Poor connection: no lines, no static
  function look(){const P=lookPref(),b=+P.bright||1;
    document.documentElement.style.filter=Math.abs(b-1)>.01?`brightness(${b})`:"";
    document.documentElement.classList.toggle("nolines",P.lines===false)}
  function drawStrings(){
    const W=innerWidth,H=innerHeight;
    document.querySelector("svg.strings")?.remove();
    if(lookPref().lines===false||lite())return;
    const s=el("svg",{class:"strings",viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:"none","aria-hidden":"true"});
    const g=el("g",{stroke:"#000",fill:"none"},s);
    if(fx.includes("strings")){
      const edge=()=>{const e=Math.floor(R()*4),t=R();return e===0?[t*W,-5]:e===1?[W+5,t*H]:e===2?[t*W,H+5]:[-5,t*H]};
      const n=9+Math.floor(R()*7);
      for(let i=0;i<n;i++){const a=edge(),b=edge();if(Math.hypot(a[0]-b[0],a[1]-b[1])<Math.min(W,H)*.5){i--;continue}
        el("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],"stroke-width":(.45+R()*.5).toFixed(2),"stroke-opacity":(.55+R()*.4).toFixed(2)},g)}
    }
    if(fx.includes("bars")){
      const k=Math.floor(R()*3);            // 0 to 2 bars, often none
      for(let i=0;i<k;i++){
        const h=2+Math.floor(R()*3),y=R()*H;
        if(R()<.35){el("rect",{x:0,y,width:W,height:h,fill:"#000"},s)}             // sometimes the whole screen
        else{const w=W*(.12+R()*.45),x=R()<.5?0:W-w;                              // otherwise from one edge
          el("rect",{x,y,width:w,height:h,fill:"#000"},s);
          if(R()<.5)el("rect",{x:x<1?w+6+R()*10:x-14-R()*20,y,width:4+R()*10,height:h,fill:"#000"},s)} // a short detached segment
      }
    }
    body.prepend(s);
  }
  /* ---------- static ---------- */
  const KEY="nwk-static";
  let on=true;try{on=localStorage.getItem(KEY)!=="off"}catch(e){}
  let ALPHA=[0,.035,.065,.1,.13][LV]||0;
  let cv,ctx,img,scan,roll,flash,raf=0,last=0,nextFlick=0;
  function buildStatic(){
    cv=document.createElement("canvas");cv.className="static";cv.width=300;cv.height=Math.max(120,Math.round(300*innerHeight/Math.max(1,innerWidth)));cv.setAttribute("aria-hidden","true");
    ctx=cv.getContext("2d");img=ctx.createImageData(cv.width,cv.height);
    scan=document.createElement("div");scan.className="scan";scan.style.opacity=(.25+LV*.12).toFixed(2);
    flash=document.createElement("div");flash.className="flash";
    body.prepend(scan);body.prepend(cv);body.appendChild(flash);
    if(LV>=3){roll=document.createElement("div");roll.className="roll";body.prepend(roll)}
  }
  function noise(){
    const d=img.data;
    for(let i=0;i<d.length;i+=4){const v=R()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=R()<.55?(R()*255*ALPHA)|0:0}
    ctx.putImageData(img,0,0);
  }
  function flick(t){
    if(t<nextFlick)return;
    const gap=[0,[9000,16000],[5000,9000],[2500,5200],[1800,4000]][LV];
    nextFlick=t+gap[0]+R()*(gap[1]-gap[0]);
    const dark=R()<.5,amt=(.02+LV*.012)*(dark?1.4:1);
    flash.classList.toggle("dark",dark);flash.style.opacity=amt;
    setTimeout(()=>{flash.style.opacity=0},60+R()*90);
    if(LV>=3&&R()<.5)setTimeout(()=>{flash.style.opacity=amt*.6;setTimeout(()=>flash.style.opacity=0,50)},180);
  }
  function loop(t){
    raf=requestAnimationFrame(loop);
    if(t-last<80)return;last=t;
    noise();cv.style.opacity=(.8+R()*.2).toFixed(2);
    if(roll){const p=(t/9000)%1;roll.style.top=(p*130-30)+"vh"}
    flick(t);
  }
  function start(){if(!cv)buildStatic();cv.hidden=scan.hidden=false;if(roll)roll.hidden=LV<3;noise();if(!reduce&&!raf){nextFlick=performance.now()+2000;raf=requestAnimationFrame(loop)}}
  function stop(){cancelAnimationFrame(raf);raf=0;if(cv){cv.hidden=scan.hidden=true;if(roll)roll.hidden=true;flash.style.opacity=0}}
  let btn=null;
  function toggleButton(){
    if(btn)return;const b=btn=document.createElement("button");b.type="button";b.className="static-toggle";
    const label=()=>{b.textContent="static: "+(on?"on":"off");b.setAttribute("aria-pressed",on)};label();
    b.addEventListener("click",()=>{on=!on;try{localStorage.setItem(KEY,on?"on":"off")}catch(e){}on?start():stop();label()});
    body.appendChild(b);
  }
  document.addEventListener("visibilitychange",()=>{if(!LV||!on||lite())return;if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!reduce&&!raf)raf=requestAnimationFrame(loop)});

  /* pages can raise or lower the static while open (the game's Blood Moon does) */
  window.nwkLook=()=>{drawStrings();look()};   // the game's Display settings call this after a change
  window.nwkStatic={level(n){
    n=Math.max(0,Math.min(4,n|0));if(n===LV)return;LV=n;ALPHA=[0,.035,.065,.1,.13][LV]||0;
    if(!LV){stop();return}
    if(lite())return;
    toggleButton();if(!cv)buildStatic();
    scan.style.opacity=(.25+LV*.12).toFixed(2);
    if(LV>=3&&!roll){roll=document.createElement("div");roll.className="roll";body.prepend(roll)}
    if(roll)roll.hidden=LV<3||!on;
    if(on)start();
  },
  refresh(){if(lite()||!LV){stop();if(btn)btn.hidden=true;return}toggleButton();btn.hidden=false;if(on)start()}};   // v71j: after Data saving is switched
  function go(){
    drawStrings();look();
    if(LV>0&&!lite()){toggleButton();if(on)start()}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
  let lw=innerWidth,tm;addEventListener("resize",()=>{clearTimeout(tm);tm=setTimeout(()=>{if(Math.abs(innerWidth-lw)>40){drawStrings();lw=innerWidth}},200)});
})();

/* the game's soft click on every page: buttons, links, cards and choices answer a press with the same small sound.
   It follows the game's sound switch (sound: on/off), and stays quiet while a game is running (the game plays its own). */
(function(){
  let ac=null,last=0;
  const on=()=>{try{return localStorage.getItem("ec-sound")!=="off"}catch(e){return true}};
  function tone(f,t,dur,peak){const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.004+dur);
    o.connect(g).connect(ac.destination);o.start(t);o.stop(t+dur+.05)}
  function click(){const n=Date.now();if(n-last<40)return;last=n;
    try{if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==="suspended")ac.resume();
      const t=ac.currentTime+.01;tone(1320,t,.03,.03);tone(660,t,.04,.017)}catch(e){}}
  document.addEventListener("click",e=>{
    if(!on()||!e.target.closest)return;
    if(window.__EC&&window.__EC.G&&!window.__EC.G.over)return;   // in a game, the game's own sounds answer
    if(e.target.closest("button,a[href],summary,label,select,.card,[role=button],[role=tab]"))click()},true);
})();

/* v71j: the first visit to an Ether's Crossroads page asks once how its pages should load: Default, Data saving or Poor
   connection. The X keeps the default. In the game, its own settings take the answer (window.ecSetNet); elsewhere it is saved
   with the game's display settings ("ec-prefs2": net, netAsked) and applied at once. */
(function(){
  const D=document.documentElement;if(!D.classList.contains("ecpage"))return;
  let P={};try{P=JSON.parse(localStorage.getItem("ec-prefs2")||"{}")}catch(e){return}
  if(P.netAsked)return;
  function apply(n){
    if(window.ecSetNet){window.ecSetNet(n,true);return}
    let Q={};try{Q=JSON.parse(localStorage.getItem("ec-prefs2")||"{}")}catch(e){}
    Q.net=n;Q.netAsked=1;try{localStorage.setItem("ec-prefs2",JSON.stringify(Q))}catch(e){}
    D.classList.toggle("lite",n>0);D.classList.toggle("poor",n>1);
    if(window.nwkLook)window.nwkLook();if(window.nwkStatic&&window.nwkStatic.refresh)window.nwkStatic.refresh();
    if(n>0&&window.ECMusic)window.ECMusic.stop()}
  function show(){if(document.getElementById("netask"))return;
    const w=document.createElement("div");w.id="netask";w.setAttribute("role","dialog");w.setAttribute("aria-modal","true");w.setAttribute("aria-labelledby","netaskT");
    w.innerHTML=`<div class="nabox"><button type="button" class="nax" aria-label="Close: keep the default">×</button>
<h2 id="netaskT">How should Ether's Crossroads load?</h2>
<p class="nadim">For this device. You can change it any time in the Menu, or in the Display bar during a game.</p>
<div class="naopts">
<button type="button" data-n="0"><b>Default</b><span>Everything: the art, the fonts, the music and the animations.</span></button>
<button type="button" data-n="1"><b>Data saving</b><span>Your device's own fonts, a plain background, nothing moving, and lighter online play. The music still plays: it is made on your device.</span></button>
<button type="button" data-n="2"><b>Poor connection</b><span>For a weak or unreliable connection: all of Data saving, fewer online updates, and longer patience when the connection drops. The music still plays.</span></button>
</div></div>`;
    document.body.appendChild(w);
    const done=n=>{w.remove();apply(n)};
    w.querySelector(".nax").onclick=()=>done(0);
    w.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>done(+b.dataset.n));
    w.addEventListener("keydown",e=>{if(e.key==="Escape")done(0)});
    w.querySelector("[data-n='0']").focus()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show);else show();
})();
