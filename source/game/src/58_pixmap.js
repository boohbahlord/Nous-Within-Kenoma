/* ---------------- v51: the battle maps in pixel art, in the style of the dungeon background ----------------
   Each tile is painted pixel by pixel on a 40×36 canvas (the ground under the board at 40 pixels a tile) and shown scaled up
   with crisp pixels. Stone is laid in blocks with mortar and grain like the dungeon wall; grass, dirt and water are dithered
   noise; tents, graves, trees, torches and blood are drawn as small sprites. Everything gets the same night tint as before.
   The pictures are kept as local blob URLs (the map art is never sent online). The old drawings stay behind PREF.pxMap=false. */
const PXW=40,PXH=36,PX_NIGHT=[20,32,74];
const hexRGB=h=>{h=h.replace("#","");return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16))};
const pxShade=(c,f)=>c.map(v=>Math.max(0,Math.min(255,Math.round(v*f))));
const pxMix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16);
const pxHash=(a,b,s)=>{let h=(a*374761393+b*668265263+s*1442695041)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296};
function pxPainter(w,h){
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;const cx=cv.getContext("2d"),im=cx.createImageData(w,h),D=im.data;
  const P={w,h,cv,
    set(x,y,c,a=1){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=w||y>=h||!c)return;const i=(y*w+x)*4;
      if(a>=1){D[i]=c[0];D[i+1]=c[1];D[i+2]=c[2]}else{D[i]+=(c[0]-D[i])*a;D[i+1]+=(c[1]-D[i+1])*a;D[i+2]+=(c[2]-D[i+2])*a}D[i+3]=255},
    get(x,y){x=Math.max(0,Math.min(w-1,x|0));y=Math.max(0,Math.min(h-1,y|0));const i=(y*w+x)*4;return [D[i],D[i+1],D[i+2]]},
    rect(x,y,rw,rh,c,a){for(let j=0;j<rh;j++)for(let i=0;i<rw;i++)P.set(x+i,y+j,c,a)},
    disc(cx0,cy0,r,c,a){for(let y=Math.floor(cy0-r);y<=cy0+r;y++)for(let x=Math.floor(cx0-r);x<=cx0+r;x++)if((x+.5-cx0)**2+(y+.5-cy0)**2<=r*r)P.set(x,y,c,a)},
    ell(cx0,cy0,rx,ry,c,a){for(let y=Math.floor(cy0-ry);y<=cy0+ry;y++)for(let x=Math.floor(cx0-rx);x<=cx0+rx;x++)if(((x+.5-cx0)/rx)**2+((y+.5-cy0)/ry)**2<=1)P.set(x,y,c,a)},
    /* a round thing lit from the top left: outline, shadow side, lit side */
    ball(cx0,cy0,r,c,out=[10,9,12]){P.disc(cx0+1,cy0+1.5,r,[0,0,0],.45);P.disc(cx0,cy0,r+.6,out);
      for(let y=Math.floor(cy0-r);y<=cy0+r;y++)for(let x=Math.floor(cx0-r);x<=cx0+r;x++){const dx=x+.5-cx0,dy=y+.5-cy0,d=dx*dx+dy*dy;if(d>r*r)continue;
        const l=-(dx+dy)/(r*1.6);P.set(x,y,pxShade(c,1+(l>.35?.16:l<-.4?-.22:l<-.1?-.1:0)))}},
    line(x0,y0,x1,y1,c,a){x0|=0;y0|=0;x1|=0;y1|=0;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;
      for(let k=0;k<200;k++){P.set(x0,y0,c,a);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}},
    /* light with a dithered falloff, so it stays pixelly */
    glow(cx0,cy0,r,c,k=.5){for(let y=Math.floor(cy0-r);y<=cy0+r;y++)for(let x=Math.floor(cx0-r);x<=cx0+r;x++){const d=Math.hypot(x+.5-cx0,y+.5-cy0)/r;if(d>1)continue;
      const t=(1-d)*k;const q=Math.floor(t*4+BAYER[((y&3)<<2)|(x&3)])/4;if(q>0)P.set(x,y,pxMix(P.get(x,y),c,Math.min(.85,q)))}},
    done(){for(let i=0;i<D.length;i+=4){D[i]+=(PX_NIGHT[0]-D[i])*.12;D[i+1]+=(PX_NIGHT[1]-D[i+1])*.12;D[i+2]+=(PX_NIGHT[2]-D[i+2])*.12;D[i+3]=255}
      cx.putImageData(im,0,0);return pxURL(cv)}};
  return P}
/* a canvas into a short blob URL, made at once */
function pxURL(cv){try{const d=cv.toDataURL("image/png"),b=atob(d.split(",")[1]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([u],{type:"image/png"}));PX_URLS.push(url);return url}catch(e){return cv.toDataURL("image/png")}}
const PX_URLS=[];let pxSeed=null,pxGroundNow=null;
function pxForget(seed){if(pxSeed===seed)return;pxSeed=seed;while(PX_URLS.length){try{URL.revokeObjectURL(PX_URLS.pop())}catch(e){}}}

/* ---------- the palettes, a few tones more than the old drawings ---------- */
const PXPAL={};
for(const [k,p] of Object.entries(PAL)){const g=hexRGB(p.ground);
  PXPAL[k]={ground:[pxShade(g,.78),pxShade(g,.9),g,...p.patch.map(hexRGB),pxShade(g,1.14)].sort((a,b)=>a[0]+a[1]+a[2]-b[0]-b[1]-b[2]),
    tuft:hexRGB(p.tuft),stone:hexRGB(p.stone),stone2:hexRGB(p.stone2),wood:hexRGB(p.wood),wood2:hexRGB(p.wood2),tent:hexRGB(p.tent),dirt:hexRGB(p.dirt),grave:hexRGB(p.grave),
    water:p.water?hexRGB(p.water):[40,44,52],water2:p.water2?hexRGB(p.water2):[80,84,92]}}
PXPAL.dungeon.ground=[[26,25,31],[31,30,37],[36,34,42],[41,39,48],[47,45,54]];
const MORTAR=[16,14,19],BLOOD=[74,12,16],BLOOD2=[48,8,11];

/* ---------- painting helpers ---------- */
/* dithered noise ground: low-frequency patches and single-pixel grain */
function pxGround(P,tones,rnd,seed,cell=6){const gw=Math.ceil(P.w/cell)+2,gh=Math.ceil(P.h/cell)+2,gr=Array.from({length:gw*gh},()=>rnd());
  const at=(x,y)=>{const fx=x/cell,fy=y/cell,x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,v=(i,j)=>gr[(j)*gw+i];
    return v(x0,y0)*(1-tx)*(1-ty)+v(x0+1,y0)*tx*(1-ty)+v(x0,y0+1)*(1-tx)*ty+v(x0+1,y0+1)*tx*ty};
  for(let y=0;y<P.h;y++)for(let x=0;x<P.w;x++){let t=at(x,y)*.75+pxHash(x,y,seed)*.25+(BAYER[((y&3)<<2)|(x&3)]-.5)*.18;
    P.set(x,y,tones[Math.max(0,Math.min(tones.length-1,Math.floor(t*tones.length)))])}}
/* stone, brick or plank courses: mortar lines, a tone per block, grain and a lit top edge */
function pxBricks(P,x0,y0,w,h,bw,bh,tones,mortar,seed,map){
  for(let v=0;v<h;v++)for(let u=0;u<w;u++){const row=Math.floor(v/bh),off=row%2?Math.floor(bw/2)+(pxHash(row,0,seed)*3|0):0,col=Math.floor((u+off)/bw),iu=(u+off)%bw,iv=v%bh;
    let c;if(iu===0||iv===0)c=mortar;else{c=tones[Math.floor(pxHash(row,col,seed)*tones.length)];const g=pxHash(u+x0,v+y0,seed+7);
      if(iv===1)c=pxShade(c,1.1);else if(iv===bh-1)c=pxShade(c,.9);if(g<.1)c=pxShade(c,.84);else if(g>.94)c=pxShade(c,1.12)}
    const [x,y]=map?map(u,v):[x0+u,y0+v];P.set(x,y,c)}}
/* the outer edge of a tile, as (along, inward) → (x, y) */
function pxEdge(side){const L=side==="left"||side==="right"?PXH:PXW;
  const f=side==="top"?(u,v)=>[u,v]:side==="left"?(u,v)=>[v,u]:side==="right"?(u,v)=>[PXW-1-v,u]:(u,v)=>[u,PXH-1-v];return {L,f}}
const pxTuft=(P,x,y,c)=>{P.set(x,y,pxShade(c,.75));P.set(x-1,y-1,c);P.set(x+1,y-1,c);P.set(x,y-1,pxShade(c,.9));P.set(x,y-2,pxShade(c,1.18));if(x%3===0)P.set(x+1,y-2,c)};
const pxRock=(P,x,y,c,big)=>{const w=big?3:2;P.rect(x,y+1,w,1,[0,0,0],.4);P.rect(x,y,w,1,c);if(big)P.rect(x,y-1,w-1,1,c);P.set(x,y-(big?1:0),pxShade(c,1.25));P.set(x+w-1,y,pxShade(c,.75))};
const pxTree=(P,x,y,r,c)=>{P.ball(x,y,r,c,[8,14,9]);for(let i=0;i<r*2;i++)P.set(x-r*.6+pxHash(i,x,y)*r*1.2,y-r*.6+pxHash(y,i,x)*r*1.2,pxShade(c,1.25))};
function pxTomb(P,x,y,c){P.rect(x-1,y+6,6,2,[22,16,12]);P.rect(x+1,y+1,4,6,[0,0,0],.5);P.rect(x-1,y,6,7,[12,11,14]);P.rect(x,y+1,4,5,c);P.set(x,y,[12,11,14]);P.set(x+3,y,[12,11,14]);P.rect(x+1,y,2,1,c);
  P.rect(x,y+1,1,5,pxShade(c,1.2));P.rect(x+3,y+2,1,4,pxShade(c,.78));P.set(x+1,y+3,pxShade(c,.7));P.set(x+2,y+3,pxShade(c,.7))}
function pxCross(P,x,y,c){P.rect(x+1,y+1,1,7,[0,0,0],.45);P.rect(x,y,1,7,c);P.rect(x-2,y+2,5,1,c);P.set(x,y,pxShade(c,1.25))}
function pxSkull(P,x,y){const W=[196,190,174],S=[120,114,104];P.rect(x,y,4,3,W);P.rect(x+1,y+3,2,1,W);P.set(x+1,y+1,[10,8,10]);P.set(x+2,y+1,[10,8,10]);P.set(x+3,y+2,S);P.set(x+1,y+3,S)}
function pxBone(P,x,y,len,dir){const W=[184,178,164];for(let i=0;i<len;i++)P.set(x+i*dir,y+(i>>1)*(dir>0?0:1),W);P.set(x-1*dir,y-1,W);P.set(x-1*dir,y+1,W);P.set(x+len*dir,y-1,W);P.set(x+len*dir,y+1,W)}
function pxBlood(P,x,y,rnd){const n=2+Math.floor(rnd()*3);for(let i=0;i<n;i++)P.disc(x+rnd()*6-3,y+rnd()*4-2,1+rnd()*2,i?BLOOD2:BLOOD,.85);for(let i=0;i<3;i++)P.set(x+rnd()*12-6,y+rnd()*8-4,BLOOD,.9)}
function pxTorch(P,x,y){P.glow(x,y,13,[255,150,60],.55);P.rect(x,y+1,1,3,[60,40,22]);P.set(x,y,[255,190,90]);P.set(x,y-1,[255,226,140]);P.set(x-1,y,[230,110,40]);P.set(x+1,y,[230,110,40])}
function pxTent(P,x,y,r,c,hut){P.ball(x,y,r,c,[14,10,8]);
  if(hut)for(let k=2;k<r;k+=2)for(let a=0;a<Math.PI*2;a+=.3)P.set(x+Math.cos(a)*k,y+Math.sin(a)*k,pxShade(c,.8));
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;P.line(x,y,x+Math.cos(a)*(r-.5),y+Math.sin(a)*(r-.5),pxShade(c,.72))}
  P.set(x,y,[40,28,16]);if(!hut)for(let k=0;k<4;k++){const a=k/4*Math.PI*2+.4;P.set(x+Math.cos(a)*(r+2),y+Math.sin(a)*(r+2),[150,136,110])}}
const pxCrate=(P,x,y,c)=>{P.rect(x,y,4,3,[12,9,6]);P.rect(x,y,3,2,c);P.set(x,y,pxShade(c,1.25));P.set(x+1,y+1,pxShade(c,.7))};

/* ---------- one tile ---------- */
function pxTile(r,c,role,edge){
  const M=G.map,T=M.theme,C=PXPAL[T],seed=(M.seed+r*131+c*17)|0,rnd=rng(seed),P=pxPainter(PXW,PXH);
  const rr=(a,b)=>a+rnd()*(b-a),ri=(a,b)=>Math.floor(rr(a,b+1));
  const E=pxEdge(edge||"bottom");
  const tufts=n=>{for(let i=0;i<n;i++)pxTuft(P,ri(2,37),ri(3,34),C.tuft)};
  const rocks=n=>{for(let i=0;i<n;i++)pxRock(P,ri(2,36),ri(3,33),C.stone2,rnd()<.4)};
  const dungeonFloor=()=>{pxBricks(P,0,0,PXW,PXH,ri(9,11),ri(6,7),C.ground.slice(1),MORTAR,seed);
    if(rnd()<.35){let x=ri(6,30),y=ri(4,20);for(let k=0;k<8;k++){P.set(x,y,[10,9,12]);x+=rnd()<.6?1:0;y+=rnd()<.7?1:0}}};
  if(role==="void"){
    if(T==="forest"||T==="river"){pxGround(P,C.ground.map(t=>pxShade(t,.7)),rnd,seed);for(let i=0;i<5;i++)pxTree(P,ri(4,35),ri(4,31),rr(4,7),T==="river"?[32,58,28]:[23,48,24])}
    else{pxGround(P,C.ground.map(t=>pxShade(t,.42)),rnd,seed,4);for(let i=0;i<8;i++)pxRock(P,ri(2,36),ri(3,33),pxShade(C.stone2,.8),rnd()<.5)}
  }else if(role==="water"||role==="bridge"){
    pxGround(P,[pxShade(C.water,.8),C.water,pxShade(C.water,1.12)],rnd,seed,5);
    for(let i=0;i<8;i++){const y=ri(3,32),x=ri(-4,32),n=ri(3,7);for(let k=0;k<n;k++)P.set(x+k,y+(k>n/2?1:0),C.water2);P.set(x+1,y-1,pxShade(C.water2,1.3))}
    if(role==="water"){for(let x=0;x<PXW;x++){const a=1+(pxHash(x,1,seed)*2|0),b=1+(pxHash(x,2,seed)*2|0);P.rect(x,0,1,a,[74,48,28]);P.rect(x,PXH-b,1,b,[74,48,28])}
      for(let i=0;i<2;i++)P.rect(ri(6,28),ri(8,28),ri(3,6),1,[200,212,255],.12)}
    else{for(let x=2;x<PXW-2;x+=4){const t=pxHash(x,3,seed)<.5?C.wood:C.wood2;P.rect(x,0,3,PXH,t);P.rect(x,0,1,PXH,pxShade(t,1.15));P.rect(x+3,0,1,PXH,[16,10,6]);P.set(x+1,3,[20,14,10]);P.set(x+1,PXH-4,[20,14,10])}
      P.rect(0,0,2,PXH,[42,26,14]);P.rect(PXW-2,0,2,PXH,[42,26,14])}
  }else if(T==="dungeon"){
    dungeonFloor();
    if(role==="grave"){const n=ri(1,3);for(let i=0;i<n;i++)pxBone(P,ri(5,30),ri(6,30),ri(3,5),rnd()<.5?1:-1);if(rnd()<.55)pxSkull(P,ri(6,30),ri(6,28));P.glow(20,18,14,[0,0,0],.3)}
    if((role==="fort"||role==="barracks")&&rnd()<.5){const [x,y]=E.f(c%2?E.L-8:7,17);P.ball(x,y,4.5,[52,50,60])}
    if(role==="fort"||role==="barracks"){if(rnd()<.3){const [x,y]=E.f(ri(6,E.L-7),3);pxTorch(P,x,y)}}
    else if(rnd()<.12)pxTorch(P,ri(6,33),ri(6,30));
    if(rnd()<.16)pxBlood(P,ri(8,31),ri(8,27),rnd);
  }else if(role==="fort"&&T!=="river"){
    if(T==="forest"){for(let y=0;y<PXH;y+=5){const t=pxHash(y,9,seed)<.5?C.wood:C.wood2;P.rect(0,y,PXW,4,t);P.rect(0,y,PXW,1,pxShade(t,1.15));P.rect(0,y+4,PXW,1,[20,13,8]);for(let x=ri(1,9);x<PXW;x+=ri(8,14))P.set(x,y+2,[22,15,9])}
      for(let u=0;u<E.L;u++)for(let v=0;v<6;v++){const lg=Math.floor(u/3),iu=u%3,t=pxHash(lg,5,seed)<.5?[74,50,30]:[62,42,24];let col=iu===0?pxShade(t,1.2):iu===2?pxShade(t,.7):t;if(v===5&&iu!==1)continue;if(pxHash(u,v,seed)<.08)col=pxShade(col,.8);const [x,y]=E.f(u,v);P.set(x,y,col)}}
    else{const tones=T==="sahel"?[[92,56,33],[106,64,38],[84,50,30],[118,74,44]]:[[78,77,72],[90,88,82],[70,69,64],[98,96,90]];
      pxBricks(P,0,0,PXW,PXH,T==="sahel"?ri(7,9):ri(9,11),ri(6,7),tones.map(t=>pxShade(t,.82)),MORTAR,seed);
      const wall=T==="sahel"?[[122,78,46],[134,88,52],[112,70,40]]:[[92,92,86],[104,103,96],[84,84,78]];
      pxBricks(P,0,0,E.L,5,T==="sahel"?4:5,2,wall,MORTAR,seed+3,E.f);
      for(let u=1;u<E.L;u+=6)for(let du=0;du<3;du++)for(let v=5;v<7;v++){const [x,y]=E.f(u+du,v);P.set(x,y,v===6?pxShade(wall[0],.8):wall[1])}
      for(let u=0;u<E.L;u++){const [x,y]=E.f(u,7);P.set(x,y,[0,0,0],.35)}}
    const sideE=edge==="left"||edge==="right",al=sideE?r:c,an=sideE?G.rows:COLS;
    if(al===0||al===an-1){const [x,y]=E.f(al===0?6:E.L-7,6);P.ball(x,y,5,T==="sahel"?[134,86,50]:T==="forest"?[70,48,28]:[94,94,88]);P.disc(x,y,2.2,[18,16,20])}
  }else if(role==="barracks"&&T!=="river"){
    pxGround(P,[pxShade(C.dirt,.85),C.dirt,pxShade(C.dirt,1.12),pxMix(C.dirt,C.ground[2],.5)],rnd,seed,5);
    if(T==="sahel"){for(let i=0;i<2;i++)pxTent(P,ri(10,29),ri(10,25),rr(5,6.5),C.tent,true)}
    else{const n=rnd()<.5?1:2;for(let i=0;i<n;i++)pxTent(P,n===1?ri(15,24):(i?ri(26,31):ri(9,14)),ri(14,22),n===1?rr(8,9.5):rr(5.5,7),C.tent,false);
      for(let i=0;i<2;i++)pxCrate(P,ri(3,33),ri(29,32),C.wood)}
    if(rnd()<.4){const x=ri(28,35),y=ri(24,31);P.glow(x,y,8,[255,140,50],.6);P.set(x,y,[255,190,90]);P.set(x,y-1,[255,230,150]);P.set(x-1,y+1,[70,40,20]);P.set(x+1,y+1,[70,40,20])}
  }else if(role==="grave"&&T!=="river"){
    pxGround(P,C.ground,rnd,seed);
    P.ell(20,18,17,14,C.dirt,.55);for(let y=0;y<PXH;y++)for(let x=0;x<PXW;x++)if(pxHash(x,y,seed+5)<.08)P.set(x,y,pxShade(C.dirt,.8));
    const n=2+Math.floor(rnd()*3);
    for(let i=0;i<n;i++){const x=ri(4,31),y=ri(4,25);
      if(T==="sahel"){pxRock(P,x,y,C.grave,true);pxRock(P,x+2,y+2,[93,76,60],true);pxRock(P,x,y+3,[106,88,72],false)}
      else if(rnd()<.3)pxCross(P,x+2,y,C.grave);else pxTomb(P,x,y,C.grave)}
    rocks(2);
  }else{ // open ground
    pxGround(P,C.ground,rnd,seed);
    if(T==="sahel"){tufts(5);for(let i=0;i<3;i++){const y=ri(4,32),x=ri(0,22),n=ri(5,9);for(let k=0;k<n;k++)P.set(x+k,y+(k>n/2?-1:0),[66,38,22])}
      if(rnd()<.3){const x=ri(9,30),y=ri(8,27);P.ell(x+1,y+2,7,4,[0,0,0],.4);P.ell(x,y,7,4,[58,58,30]);P.ell(x,y-1,4,2,[72,70,42]);P.set(x-3,y-2,[86,82,50])}}
    else if(T==="forest"){tufts(4);if(rnd()<.5)pxTree(P,c%2?ri(31,36):ri(3,8),ri(5,30),rr(3.5,5.5),[23,48,24]);rocks(1)}
    else if(T==="river"){tufts(4);rocks(1);if(rnd()<.45){const x=ri(7,33),y=ri(7,29),R=rr(5,7);for(let k=0;k<7;k++){const a=k/7*Math.PI*2+rnd()*.4;P.line(x,y,x+Math.cos(a)*R,y+Math.sin(a)*R,[47,74,34])}P.set(x,y,[58,42,24])}
      if(role!=="field"&&rnd()<.5)pxTree(P,ri(4,35),ri(4,31),rr(3,4.5),[32,58,28])}
    else{tufts(6);rocks(2);if(rnd()<.25){const y0=ri(12,24);for(let x=0;x<PXW;x++){const y=y0+Math.round(Math.sin(x/7+seed)*1.5);P.rect(x,y,1,2,[44,38,24],.7)}}}
  }
  return P.done()}

/* ---------- the ground under the board ---------- */
function pxGroundURL(){const M=G.map,C=PXPAL[M.theme],P=pxPainter(COLS*20,G.rows*20),rnd=rng(M.seed);
  pxGround(P,C.ground.map(t=>pxShade(t,.9)),rnd,M.seed,5);
  if(M.theme==="dungeon")for(let x=0;x<P.w;x+=5)P.rect(x,0,1,P.h,[12,11,14]);
  return P.done()}

{const _ta=tileArt,_mg=mapGround;
  tileArt=function(r,c,role,edge){if(!G||!G.map||G.map.theme==="none"||PREF.pxMap===false||!PXPAL[G.map.theme])return _ta.apply(this,arguments);
    pxForget(G.map.seed);try{return `<img class="tart px" src="${pxTile(r,c,role,edge)}" alt="" aria-hidden="true" draggable="false">`}catch(e){console.error(e);return _ta.apply(this,arguments)}};
  mapGround=function(){if(!G||!G.map||G.map.theme==="none"||PREF.pxMap===false||!PXPAL[G.map.theme])return _mg.apply(this,arguments);
    pxForget(G.map.seed);try{const u=pxGroundURL();pxGroundNow=u;return `<img class="mapground px" src="${u}" alt="" aria-hidden="true" draggable="false">`}catch(e){console.error(e);return _mg.apply(this,arguments)}}}
/* a ground picture that came from another browser (online) or from the other style is drawn again here */
{const _r=render;render=function(){if(G&&G.map&&G.map.ground){const px=/class="mapground px"/.test(G.map.ground),want=PREF.pxMap!==false&&G.map.theme!=="none";
  if(px!==want||px&&(!pxGroundNow||!G.map.ground.includes(pxGroundNow)||pxSeed!==G.map.seed)){G.map.ground=null;G.map.art={}}}
  return rSafe(_r,this,arguments)}}
/* the Menu switch: pixel-art maps or the old drawings */
function pxMapToggle(on){PREF.pxMap=!!on;savePrefs();if(G&&G.map){G.map.ground=null;G.map.art={}}render()}
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const s=$("#mPxMap");if(s)s.onchange=()=>pxMapToggle(s.value==="1")}}
if(window.__EC)Object.assign(window.__EC,{pxTile,pxMapToggle});
