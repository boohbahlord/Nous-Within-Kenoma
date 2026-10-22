/* ---------- v76a: nothing outside the map ----------
   The tiles that can't be played and reach the field's edge (around a cross, a plus or cut corners) are not drawn at all,
   and the map's ground shows only under the rest (the tiles you can play on, and holes, mountains and the river inside
   it), so the page's own background shows where the map isn't. Worked out once per map and board size. */
let mapOutKey=null,mapOut=null,clipCache={key:null,url:null};
function mapOutside(){const M=G.map,V=M&&M.void;if(!V)return null;const key=M.seed+"|"+V.length;if(mapOutKey===key)return mapOut;mapOutKey=key;
  const rows=V.length,cols=V[0].length,out=Array.from({length:rows},()=>Array(cols).fill(false)),q=[];
  const water=(r,c)=>typeof tileRole==="function"&&tileRole(r,c)==="water";
  const push=(r,c)=>{if(r<0||c<0||r>=rows||c>=cols||out[r][c]||!V[r][c]||water(r,c))return;out[r][c]=true;q.push([r,c])};
  for(let r=0;r<rows;r++){push(r,0);push(r,cols-1)}for(let c=0;c<cols;c++){push(0,c);push(rows-1,c)}
  while(q.length){const [r,c]=q.pop();push(r+1,c);push(r-1,c);push(r,c+1);push(r,c-1)}
  mapOut=out.some(x=>x.some(Boolean))?out:null;return mapOut}
const mapIsOut=(r,c)=>{const o=G&&G.map&&mapOutside();return !!(o&&o[r]&&o[r][c])};   // the board marks these as it is written
function mapClip(){const B=$("#board");if(!B||!G||!G.map)return;const out=mapOutside();B.classList.toggle("voidcut",!!out);if(!out)return;
  const bg=B.querySelector(".mapbg");if(!bg)return;const W=bg.offsetWidth,H=bg.offsetHeight;if(!W||!H)return;
  const key=mapOutKey+"|"+W+"x"+H+"|"+view();if(bg.dataset.clip===key)return;
  if(clipCache.key===key){mapClipSet(bg,clipCache.url,key);return}   // a new ground for the same board: the same clip
  const pos=el=>{let x=0,y=0;for(let e=el;e&&e!==B;e=e.offsetParent){x+=e.offsetLeft;y+=e.offsetTop}return [x,y]},[bx,by]=[bg.offsetLeft,bg.offsetTop],g=2.5;
  let rects="";for(const t of B.querySelectorAll(".tile:not(.outvoid)")){const row=t.closest(".row");if(!row)continue;const [tx]=pos(t),[,ry]=pos(row);
    rects+=`<rect x="${(tx-bx-g).toFixed(1)}" y="${(ry-by-g).toFixed(1)}" width="${(t.offsetWidth+2*g).toFixed(1)}" height="${(row.offsetHeight+2*g).toFixed(1)}"/>`}
  const url=`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g fill="#fff">${rects}</g></svg>`)}")`;
  clipCache={key,url};mapClipSet(bg,url,key)}
function mapClipSet(bg,url,key){for(const [k,v] of [["maskImage",url],["webkitMaskImage",url],["maskSize","100% 100%"],["webkitMaskSize","100% 100%"],["maskRepeat","no-repeat"],["webkitMaskRepeat","no-repeat"]])bg.style[k]=v;bg.dataset.clip=key}
{const _r=render;render=function(){_r.apply(this,arguments);if(G&&G.map)perfLater("mapclip",mapClip)}}   // v76b: just before the paint
if(typeof ResizeObserver!=="undefined"){let ro=null;const watch=()=>{const B=$("#board");if(!B||B._clipRO)return;B._clipRO=1;ro=ro||new ResizeObserver(()=>{try{mapClip()}catch(e){}});ro.observe(B)};
  {const _r=render;render=function(){_r.apply(this,arguments);watch()}}}
if(window.__EC)Object.assign(window.__EC,{mapOutside:()=>mapOutside()});
