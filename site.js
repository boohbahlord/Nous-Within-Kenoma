/* Draws thin black strings across the page and a few screen cracks, behind everything.
   Small cracks are also laid over random cards and boxes. Random on every load. */
(function(){
  const NS="http://www.w3.org/2000/svg";
  const R=Math.random;
  function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
  function crack(g,cx,cy,rad,w){
    const rays=7+Math.floor(R()*6),pts=[];
    for(let i=0;i<rays;i++){
      let a=i/rays*Math.PI*2+(R()-.5)*.6,x=cx,y=cy,len=0,max=rad*(.35+R()*.75),d=`M${cx.toFixed(1)},${cy.toFixed(1)}`,ray=[];
      while(len<max){const s=6+R()*18;a+=(R()-.5)*.45;x+=Math.cos(a)*s;y+=Math.sin(a)*s;len+=s;d+=`L${x.toFixed(1)},${y.toFixed(1)}`;ray.push([x,y,len]);
        if(R()<.12){let bx=x,by=y,ba=a+(R()<.5?-1:1)*(.5+R()*.6),bd=`M${x.toFixed(1)},${y.toFixed(1)}`;for(let k=0;k<2+R()*3;k++){const s2=5+R()*12;ba+=(R()-.5)*.5;bx+=Math.cos(ba)*s2;by+=Math.sin(ba)*s2;bd+=`L${bx.toFixed(1)},${by.toFixed(1)}`}el("path",{d:bd,"stroke-width":w*.8},g)}}
      el("path",{d,"stroke-width":w},g);pts.push(ray);
    }
    [.28,.55].forEach(f=>{let d="";pts.forEach((ray,i)=>{const p=ray.find(q=>q[2]>=rad*f);if(!p)return;if(R()<.75)d+=(d&&R()<.8?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)});if(d)el("path",{d,"stroke-width":w*.8},g)});
  }
  function draw(){
    const W=innerWidth,H=innerHeight;
    let s=document.querySelector("svg.strings");if(s)s.remove();
    s=el("svg",{class:"strings",viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:"none","aria-hidden":"true"});
    const g=el("g",{stroke:"#000",fill:"none","stroke-linecap":"round"},s);
    const edge=()=>{const e=Math.floor(R()*4),t=R();return e===0?[t*W,-5]:e===1?[W+5,t*H]:e===2?[t*W,H+5]:[-5,t*H]};
    const n=9+Math.floor(R()*7);
    for(let i=0;i<n;i++){let a=edge(),b=edge();if(Math.hypot(a[0]-b[0],a[1]-b[1])<Math.min(W,H)*.5){i--;continue}
      el("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],"stroke-width":(.45+R()*.5).toFixed(2),"stroke-opacity":(.55+R()*.4).toFixed(2)},g)}
    const c=el("g",{"stroke-opacity":".8"},g);
    const k=1+Math.floor(R()*2.6);for(let i=0;i<k;i++)crack(c,R()*W,R()*H,70+R()*140,.55);
    document.body.prepend(s);
  }
  function cardCracks(){
    document.querySelectorAll("a.card,.ix,.notice,.infobox").forEach(box=>{
      if(R()>.42||box.querySelector(":scope>svg.crack"))return;
      const r=box.getBoundingClientRect();if(!r.width)return;
      const sv=el("svg",{class:"crack",viewBox:`0 0 ${r.width} ${r.height}`,preserveAspectRatio:"none","aria-hidden":"true"});
      const g=el("g",{stroke:"#000",fill:"none","stroke-opacity":".85","stroke-linecap":"round"},sv);
      const cx=R()<.5?R()*r.width*.25:r.width*(.75+R()*.25),cy=R()*r.height;
      crack(g,cx,cy,Math.min(140,Math.max(50,r.height*1.4)),.5);
      box.prepend(sv);
    });
  }
  let lw=0;
  function go(){draw();cardCracks();lw=innerWidth}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
  let t;addEventListener("resize",()=>{clearTimeout(t);t=setTimeout(()=>{if(Math.abs(innerWidth-lw)>40){draw();lw=innerWidth}},200)});
})();
