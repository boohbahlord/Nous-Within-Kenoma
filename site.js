/* Nous Within Kenoma page effects.
   - strings: thin black lines stretched across the page (data-fx contains "strings")
   - bars: rare black gaps, some across the screen, some inside boxes (data-fx contains "bars")
   - static: animated fuzzy static with faint scanlines and an occasional flicker, behind the text.
     Level comes from <body data-static="0-4">; the reader can only switch it off (bottom-right button). */
(function(){
  const NS="http://www.w3.org/2000/svg",R=Math.random;
  const body=document.body,fx=(body.dataset.fx||"").split(/\s+/),LV=+(body.dataset.static||0);
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}

  /* ---------- strings and background bars ---------- */
  function drawStrings(){
    const W=innerWidth,H=innerHeight;
    document.querySelector("svg.strings")?.remove();
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
  function boxBars(){
    if(!fx.includes("bars"))return;
    document.querySelectorAll("a.card,.ix,.infobox,.kinds li a").forEach(box=>{
      if(R()>.2)return;
      const b=document.createElement("i");b.className="bar";b.setAttribute("aria-hidden","true");
      const full=R()<.3,w=full?100:20+R()*55;
      b.style.cssText=`height:${2+Math.floor(R()*2)}px;top:${(8+R()*84).toFixed(1)}%;width:${w.toFixed(1)}%;${R()<.5?"left:0":"right:0"}`;
      if(getComputedStyle(box).position==="static")box.style.position="relative";
      box.appendChild(b);
    });
  }

  /* ---------- static ---------- */
  const KEY="nwk-static";
  let on=true;try{on=localStorage.getItem(KEY)!=="off"}catch(e){}
  const ALPHA=[0,.035,.065,.1,.13][LV]||0;
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
  function start(){if(!cv)buildStatic();cv.hidden=scan.hidden=false;if(roll)roll.hidden=false;noise();if(!reduce&&!raf){nextFlick=performance.now()+2000;raf=requestAnimationFrame(loop)}}
  function stop(){cancelAnimationFrame(raf);raf=0;if(cv){cv.hidden=scan.hidden=true;if(roll)roll.hidden=true;flash.style.opacity=0}}
  function toggleButton(){
    const b=document.createElement("button");b.type="button";b.className="static-toggle";
    const label=()=>{b.textContent="static: "+(on?"on":"off");b.setAttribute("aria-pressed",on)};label();
    b.addEventListener("click",()=>{on=!on;try{localStorage.setItem(KEY,on?"on":"off")}catch(e){}on?start():stop();label()});
    body.appendChild(b);
  }
  document.addEventListener("visibilitychange",()=>{if(!LV||!on)return;if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!reduce&&!raf)raf=requestAnimationFrame(loop)});

  function go(){
    drawStrings();boxBars();
    if(LV>0){toggleButton();if(on)start()}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
  let lw=innerWidth,tm;addEventListener("resize",()=>{clearTimeout(tm);tm=setTimeout(()=>{if(Math.abs(innerWidth-lw)>40){drawStrings();lw=innerWidth}},200)});
})();
