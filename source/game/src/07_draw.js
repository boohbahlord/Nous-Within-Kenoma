/* ---------------- drawings: platonic solids, dice, moon, cards ---------------- */
const poly=(n,r,rot,cx=0,cy=0)=>Array.from({length:n},(_,i)=>{const a=rot*Math.PI/180+i*2*Math.PI/n;return[+(cx+r*Math.cos(a)).toFixed(2),+(cy+r*Math.sin(a)).toFixed(2)]});
const ring=p=>"M"+p.map(q=>q.join(",")).join("L")+"Z";
const seg=(a,b)=>`M${a.join(",")}L${b.join(",")}`;
function solidPath(s){
  if(s==="tetra"){const t=poly(3,9,-90,0,1.5),m=[0,3.2];return ring(t)+t.map(v=>seg(m,v)).join("")}
  if(s==="cube"){const h=poly(6,9,-90);return ring(h)+[1,3,5].map(i=>seg([0,0],h[i])).join("")}
  if(s==="octa"){const T=[0,-9.5],Rt=[7,0],B=[0,9.5],Lf=[-7,0],F=[1.6,1.4];return ring([T,Rt,B,Lf])+seg(Lf,F)+seg(F,Rt)+seg(T,F)+seg(B,F)}
  if(s==="dodeca"){const o=poly(10,9.5,-90),i=poly(5,4.4,-90);return ring(o)+ring(i)+i.map((v,k)=>seg(v,o[2*k])).join("")}
  if(s==="mask"){   // Antony's white mask: the dark smile gap and the cracked corners
    return "M0,-10C6,-10 8.5,-6 8.5,-1C8.5,5 5,9.5 0,9.5C-5,9.5 -8.5,5 -8.5,-1C-8.5,-6 -6,-10 0,-10Z"+"M-5.5,-2.5L-2,-3.2 M2,-3.2L5.5,-2.5"+"M-5,3.2C-2.5,6 2.5,6 5,3.2C2.5,4.6 -2.5,4.6 -5,3.2Z"+"M-8.5,-3L-6,-5.5L-6.8,-8 M8.5,-3L6.4,-4.4L7.4,-7.4 M-7.5,5L-5.6,6.6 M7.6,4.8L5.4,6.8"}
  if(s==="claw"){   // v60: the demon's claws: three hooked talons rising from a fist
    return "M-5.4,3.6C-8.8,0.4 -10.4,-4 -9.6,-9.6C-8.2,-5.6 -5.6,-2.2 -2,0.6 M-1.6,0.4C-2.6,-4 -1.6,-7.8 1.4,-10.8C0.4,-7.2 0.8,-3.4 2.2,0.8 M2.6,1.2C5.2,-2.2 7.6,-4.8 10.4,-6.4C9.2,-3.2 7.8,0.2 5.8,3.8 M-6.2,4C-4.6,10 4.4,10 6.2,4 M-3.6,6.4C-1.4,7.4 1.6,7.4 3.6,6.4"}
  if(s==="scroll"){   // Lucifer's ink and scroll
    return "M-8,-8H5C7,-8 8,-7 8,-5V7C8,9 7,10 5,10H-6 M-8,-8C-10,-8 -10,-4 -8,-4H-5V8C-5,10 -8,10 -8,8 M-2,-3H3 M-2,0H5 M-2,3H3 M3,-1L10,-10 M3,-1L2.4,1.6L5,0.6Z"}
  if(s==="saturn"){   // Saturn and its ring
    return "M0,-6.5A6.5,6.5 0 1,1 -0.1,-6.5Z M-10.5,4C-12,1 -5,-3 2,-5C8,-7 12,-6 10.5,-3 M-10.5,4C-9,6 -2,5 4,2C8,0 11,-2 10.5,-3"}
  if(s==="hexa")return ring(poly(3,9.8,-90))+ring(poly(3,9.8,90));   // the Firmament's six-pointed star
  if(s==="icosa"){const h=poly(6,9.5,-90),t=poly(3,4.6,-90);let d=ring(h)+ring(t);t.forEach((v,k)=>{const j=2*k;d+=seg(v,h[j])+seg(v,h[(j+1)%6])+seg(v,h[(j+5)%6])});return d}
  return "";
}
function solidSVG(s,color,size){const d=solidPath(s);return `<svg class="sol" viewBox="-11 -11 22 22" width="${size||14}" height="${size||14}" aria-hidden="true"><path d="${d}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="3.4" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg>`}
function dieSVG(d,col){
  const s=d.s,st=col||"#c9a274",hi=d.v===s,lo=d.v===1&&s>2;
  const fill=hi?"#3a2a14":"#1a120b",A=`fill="${fill}" stroke="${st}" stroke-width="1.3" stroke-linejoin="round"`,I=`fill="none" stroke="${st}" stroke-opacity=".45" stroke-width=".7"`;
  let shape;
  if(s===2)shape=`<circle r="10" ${A}/><circle r="7.4" ${I}/>`;
  else if(s===4)shape=`<path d="${ring(poly(3,12,-90,0,2.5))}" ${A}/>`;
  else if(s===6)shape=`<rect x="-9.5" y="-9.5" width="19" height="19" rx="2" ${A}/>`;
  else if(s===8)shape=`<path d="${ring(poly(4,11.4,-90))}" ${A}/><path d="${seg([-8,0],[8,0])}" ${I}/>`;
  else if(s===12)shape=`<path d="${ring(poly(5,11.2,-90,0,.6))}" ${A}/><path d="${ring(poly(5,6.4,-90,0,.6))}" ${I}/>`;
  else if(s===20){const h=poly(6,11.4,-90),t=poly(3,7,-90,0,.8);let k="";t.forEach((v,i)=>{k+=seg(v,h[2*i])});shape=`<path d="${ring(h)}" ${A}/><path d="${ring(t)+k}" ${I}/>`}
  else shape=`<path d="${ring(poly(4,11,-90))}" ${A}/>`;
  const ty=s===4?5.2:s===12?1.2:s===20?1.4:0,fs=d.v>=10?7.6:9;
  return `<svg class="die${d.x?" x":""}" viewBox="-13 -13 26 26" width="36" height="36" role="img" aria-label="d${s} rolled ${d.v}"${d.x?' opacity=".32"':""}>${shape}<text x="0" y="${ty}" dominant-baseline="central" text-anchor="middle" font-family="Cascadia Code,Consolas,monospace" font-size="${fs}" font-weight="400" fill="${hi?"#ffffff":lo?"#ff8f86":"#f3d6a6"}">${d.v}</text></svg>`;
}
function moonPath(i,r){
  const f=i/8;if(i===0)return "";if(i===4)return `<circle r="${r}"/>`;
  const rx=(r*Math.abs(Math.cos(2*Math.PI*f))).toFixed(2);
  if(f<.5)return `<path d="M0,${-r}A${r},${r} 0 0 1 0,${r}A${rx},${r} 0 0 ${f<.25?0:1} 0,${-r}Z"/>`;
  return `<path d="M0,${-r}A${r},${r} 0 0 0 0,${r}A${rx},${r} 0 0 ${f>.75?1:0} 0,${-r}Z"/>`;
}
function moonSVG(){
  if(G.moon.gone)return goneMoonSVG();
  const m=G.moon,r=30,red=m.blood,lit=red?"#d3171e":"#f2ebd8",dark=red?"#3b0608":"#1f1913",glow=red?"#ff2a2a":"#fff2cf";
  return `<svg class="moon${red?" red":""}" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true">
<defs><radialGradient id="mglow"><stop offset="50%" stop-color="${glow}" stop-opacity=".42"/><stop offset="100%" stop-color="${glow}" stop-opacity="0"/></radialGradient><filter id="mblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter></defs>
<circle r="${r+13}" fill="url(#mglow)"/>
<g filter="url(#mblur)"><circle r="${r}" fill="${dark}" stroke="${red?"#8a1418":"#8a7a66"}" stroke-width="1"/><g fill="${lit}">${moonPath(m.i,r)}</g></g>${G.moonLev?levOnMoon():""}${G.moonMiner?minerOnMoon():""}</svg>`;
}
function moonStrip(){
  const m=G.moon;if(m.gone)return "";
  return `<div class="mstrip" aria-label="Moon phases">${MOON.map((n,i)=>`<span class="${i===m.i?"on":""}" title="${n}"><svg viewBox="-9 -9 18 18" width="18" height="18"><circle r="7" fill="${m.blood&&i===4?"#3b0608":"#1f1913"}" stroke="#5a4a3a" stroke-width=".6"/><g fill="${m.blood&&i===4?"#d3171e":"#e9e1cc"}">${moonPath(i,7)}</g></svg></span>`).join("")}</div>`;
}
function face(c,o={}){
  const own=o.owner!==undefined?o.owner:c.owner,P=own!=null&&G.p[own]?G.p[own]:null;
  const col=P?P.color:"#8a8a8a",k=kind(c),sm=o.cls==="sm";
  if(c.unit){   // an Emanation card: its own symbol and its hearts
    const U=UNIT[c.unit],nm=U.short||U.name;
    return `<span class="cf unit u-${c.unit}${c.hate?" hated":""}${isBase(c)?" basecard":""} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx"><b class="rk un">${esc(sm?nm.slice(0,4):nm)}</b></span><span class="uic">${unitSVG(c.unit,c.unit==="tree"?"#2d6b3a":c.unit==="satan"?"#8e1426":"#15100b",sm?18:30)}</span>${c.maxHp&&!sm?heartsHTML(c):""}${P?`<span class="so">${solidSVG(P.solid,col,sm?12:17)}</span>`:""}${sm?"":`<em class="ty">${esc(U.word)}</em>`}${o.price?`<span class="price">${costOf(c)} mana</span>`:""}${o.noci?"":`<span class="ci" data-cid="${c.id}" role="button" title="Card info"></span>`}</span>`;
  }
  const rk=c.rank==="JK"?"Joker":c.rank,su=c.rank==="JK"?"✶":SUITS[c.suit];
  return `<span class="cf ${c.color}${c.hate?" hated":""}${isBase(c)?" basecard":""} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx"><b class="rk${c.rank==="JK"?" jk":""}">${rk}</b>${c.rank==="JK"?"":`<i>${su}</i>`}</span><i class="su">${su}</i>${P?`<span class="so">${solidSVG(P.solid,col,sm?12:17)}</span>`:""}${c.puppet&&!sm?`<span class="pup">${unitSVG("puppet","#15100b",16)}</span>`:""}${c.maxHp&&!sm?heartsHTML(c):""}${sm?"":`<em class="ty">${typeWord(c)}</em>`}${o.price?`<span class="price">${costOf(c)} mana</span>`:""}${o.noci?"":`<span class="ci" data-cid="${c.id}" role="button" title="Card info"></span>`}</span>`;
}
function back(pl){const P=G.p[pl];return `<span class="cb" style="--pc:${P.color}">${solidSVG(P.solid,P.color,18)}</span>`}
const clock=t=>new Date(t).toLocaleTimeString([],{hour:"numeric",minute:"2-digit",second:"2-digit"});
function lastSpellNote(P){const e=P.lastSpell;if(!e)return "";return `<span class="lastsp">(last spell: ${esc(e.name)}${e.tile?" on "+e.tile:""}${e.target?" at "+esc(e.target):""}, ${e.round?"round "+e.round:"setup"}, ${clock(e.t)})</span>`}
function trayHTML(P,pl){
  const t=P.tray,head=`<span class="tl">${t?esc(t.label):esc(P.name)+"'s dice"} ${lastSpellNote(P)}</span>`;
  const body=!t?'<span class="dim">No rolls yet.</span>':t.dice.length?t.dice.map(d=>dieSVG(d,P.color)).join(""):'<span class="dim">No dice.</span>';
  return `<button type="button" class="tray${t?"":" empty"}" data-hist="${pl}" style="--pc:${P.color}" title="Show the history of rolls and spells" aria-label="${esc(P.name)}'s dice box: show history">${head}<span class="dice">${body}</span><span class="hhint">history ▾</span></button>${t&&t.line?`<p class="tline">${esc(t.line)}</p>`:""}`;
}

