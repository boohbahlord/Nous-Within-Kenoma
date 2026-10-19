/* ---------------- UI pass 4 (v23): card faces ----------------
   Every card beyond the standard deck reads like one: a mark in the top-left corner (in the Ace's blackletter where it
   is a letter or a number), its picture in the middle drawn in plain ink like the suits, and its name along the bottom.
   The Puppet is its own card (the score of a 2). One type per card: the Ace is a Base. */

/* ---------- new pictures ---------- */
// "@" in a picture is the ink color; "#bg" is the card's paper, for cuts and folds
UNIT_ICON.slavemaster=`<path fill="@" stroke="none" fill-rule="evenodd" d="M0,-11.2C-3.8,-11.2 -5.8,-8 -5.8,-4.6C-5.8,-2.6 -5.2,-1.4 -4.6,-0.6C-6.6,-0.1 -8.2,0.6 -8.9,1.3C-7.4,5.2 -3.6,8.8 0,11.6C3.6,8.8 7.4,5.2 8.9,1.3C8.2,0.6 6.6,-0.1 4.6,-0.6C5.2,-1.4 5.8,-2.6 5.8,-4.6C5.8,-8 3.8,-11.2 0,-11.2Z M0,-8.8C-2,-8.8 -3.1,-6.5 -3.1,-4.5C-3.1,-2.7 -1.7,-1.2 0,-0.2C1.7,-1.2 3.1,-2.7 3.1,-4.5C3.1,-6.5 2,-8.8 0,-8.8Z"/><path stroke="#bg" stroke-width=".8" d="M-5.4,1.6C-2.8,3.4 -0.2,4 2.8,4 M5.8,4.4C4.8,6.2 3.6,7 2.6,8.8"/>`;
UNIT_ICON.slave=`<circle fill="@" stroke="none" cx="4.4" cy="-6.6" r="3.3"/><g stroke="@" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="5" d="M-0.4,-6C-4,-4.6 -5.6,-0.8 -5.2,3.2"/><path stroke-width="4.4" d="M-5.2,3.2L1.2,8.8"/><path stroke-width="3.6" d="M1.2,9.2L-8.4,9.4"/><path stroke-width="2.4" d="M0.6,-4.6L1.8,0.2L5.6,3.8"/></g>`;
UNIT_ICON.cannon=`<path fill="@" stroke="none" d="M-9.6,0.2C-10.6,-1.3 -10.1,-3.2 -8.6,-3.5L8.2,-8L9.6,-4.4L-7.8,1.6C-8.6,1.9 -9.2,1.2 -9.6,0.2Z"/><circle fill="@" stroke="none" cx="-10.6" cy="-1.6" r="1.2"/><path stroke-width="1.6" d="M8.1,-8.9L10.2,-3.6"/><circle cx="-2.4" cy="4.6" r="4.8" stroke-width="1.5"/><circle fill="@" stroke="none" cx="-2.4" cy="4.6" r="1.2"/><path stroke-width="1.1" d="M-2.4,-0.2V9.4 M-7.2,4.6H2.4 M-5.8,1.2L1,8 M1,1.2L-5.8,8"/><path stroke-width="1.7" d="M1.6,7.2L10.6,10.2"/>`;
UNIT_ICON.scout=`<path fill="@" stroke="none" fill-rule="evenodd" d="M-6.6,10.2H7.4C7.6,6 6.6,2.4 6.4,-0.6C6.2,-6 3.4,-9.6 -0.8,-10.4L-1.6,-12.2L-3.2,-10C-6.2,-9 -8.6,-6.2 -9.8,-3L-10.4,-1C-10.4,0.6 -9.2,1.4 -7.8,0.6L-5.2,-0.8C-4,-1.2 -2.8,-1.1 -2.1,-0.5C-3.8,2.2 -6.6,5.4 -6.6,10.2Z M-3.6,-6.8a1,1 0 1,0 0.1,0Z"/><path stroke="#bg" stroke-width=".9" d="M1.4,-8C4,-6 4.8,-2 4.6,2.4 M-6,10.2H7.2"/><path stroke-width="1.6" d="M-8.4,11.2H9"/>`;
UNIT_ICON.satan=`<path fill="@" stroke="none" fill-rule="evenodd" d="M-4.6,-4.2C-6.8,-6.2 -7.8,-9.2 -7.2,-11.8C-5.9,-9.8 -4.5,-8.6 -2.6,-7.8C-1,-8.2 1,-8.2 2.6,-7.8C4.5,-8.6 5.9,-9.8 7.2,-11.8C7.8,-9.2 6.8,-6.2 4.6,-4.2C5.6,-2.7 6.1,-1.1 6.3,0.4L9,-1.2C8.8,0.9 7.8,2.4 6.1,3C5.4,5.7 3.3,7.5 1.4,8.3L0,12L-1.4,8.3C-3.3,7.5 -5.4,5.7 -6.1,3C-7.8,2.4 -8.8,0.9 -9,-1.2L-6.3,0.4C-6.1,-1.1 -5.6,-2.7 -4.6,-4.2Z M-4.3,-1.8L-1.1,-0.4L-3.8,0.6Z M4.3,-1.8L1.1,-0.4L3.8,0.6Z"/><path stroke="#bg" stroke-width=".9" d="M-2.6,3.9C-1,4.9 1,4.9 2.6,3.9"/>`;

/* the Leviathan: a dragon-serpent coiling out of the waves, after Doré's Destruction of Leviathan */
UNIT_ICON.leviathan=`<g transform="translate(0,.8) scale(.92)" fill="none" stroke="@" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="2.9" d="M-10.2,6.6C-11.6,0.4 -8.4,-6 -3.8,-5.6C0,-5.2 0.8,-0.8 -0.6,5"/><path stroke-width="1.6" d="M-10.2,6.6C-10.8,3.6 -12.2,2.4 -11.4,0.4"/><path stroke-width="2.7" d="M2.2,7.4C2.4,2.6 4.4,-1.6 7.2,-4.2C8.8,-5.6 9.6,-7.2 8.8,-8.8"/><g fill="@" stroke="none"><path d="M-10.4,-1.6L-12.2,-3.4L-9.6,-3.2Z M-8.6,-4.6L-9.6,-7.4L-7.4,-5.8Z M-6,-6.2L-6,-9.2L-4.4,-6.8Z M-3,-6.4L-2,-9.2L-1.2,-6.2Z M-0.2,-4.8L1.8,-6.8L1.4,-4Z"/><path d="M4.8,-1.6L3.2,-3.6L5.6,-3Z M6.6,-3.8L5.6,-6.2L7.6,-5Z"/><path d="M10.6,-10.4L8.6,-11.8L2.4,-12.2L7,-9.8L3.4,-7.2L9.4,-7.4C11,-7.8 11.4,-9.4 10.6,-10.4Z"/><path d="M4.2,-11.6L4.6,-10.8L5.2,-11.5Z M4.6,-7.8L5,-8.6L5.6,-7.9Z" fill="#bg"/><path d="M9.2,-11.4L11.8,-12.8 M10.4,-10.4L12.4,-10.8" stroke="@" stroke-width="1" fill="none"/></g><circle cx="8.6" cy="-10" r=".55" fill="#bg"/><path stroke-width="1.2" d="M-12,8.6C-9.4,6.8 -7.2,10 -4.4,8.6C-1.6,7 0.8,10.2 3.6,8.6C6.4,7 8.8,10.2 12,8.4"/><path stroke-width=".9" d="M-9,11.2C-6.6,10 -4.6,12.2 -2,11.2C0.6,10 2.6,12.2 5.2,11.2C7.4,10.4 9,11.6 10.6,11.2"/><path stroke-width=".8" d="M8.4,6.4C9.8,5.4 11,5.6 11.8,6.4 M-6,6.8C-5,5.8 -3.6,5.8 -2.8,6.6"/></g>`;

/* ---------- the top-left marks ---------- */
const MK_SVG={
  inf:`<svg viewBox="0 0 20 12" class="mksvg wide"><path d="M10,6C7.6,1.6 2,2.2 2,6C2,9.8 7.6,10.4 10,6C12.4,1.6 18,2.2 18,6C18,9.8 12.4,10.4 10,6Z" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>`,
  up:`<svg viewBox="0 0 12 14" class="mksvg"><path d="M6,1.5L11,12.5H1Z" fill="currentColor"/></svg>`,
  down:`<svg viewBox="0 0 12 14" class="mksvg"><path d="M6,12.5L11,1.5H1Z" fill="currentColor"/></svg>`,
  cross:`<svg viewBox="0 0 10 18" class="mksvg"><path d="M5,1V17 M1.2,12.4H8.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>`,
  clef:`<svg viewBox="0 0 14 20" class="mksvg"><path d="M1.4,1V19" stroke="currentColor" stroke-width="2.6" fill="none"/><path d="M4.8,1V19" stroke="currentColor" stroke-width="1.1" fill="none"/><path d="M4.8,10L6.6,8C7,4.8 7.8,1.8 10.2,1.6C12.4,1.4 13.2,3.4 13,5C12.8,6.8 11.4,7.6 10.2,7.2 M4.8,10L6.6,12C7,15.2 7.8,18.2 10.2,18.4C12.4,18.6 13.2,16.6 13,15C12.8,13.2 11.4,12.4 10.2,12.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="10.4" cy="6.4" r="1.6" fill="currentColor"/><circle cx="10.4" cy="13.6" r="1.6" fill="currentColor"/></svg>`,
  lean:`<svg viewBox="0 0 12 18" class="mksvg"><path d="M1.4,17L5.3,1.6 M6.7,1.6L10.6,17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
};
const UNIT_MARK={wall:"B",tree:"0",assassin:"S",archer:"11",cannon:"12",slavemaster:"+",slave:"−",trafficker:"−−",debt:"$",
  leviathan:{svg:"inf"},bullgoat:{svg:"up"},goatbull:{svg:"down"},satan:{svg:"cross"},antony:{svg:"clef"},samson:{svg:"lean"},
  scout:{sup:1},healer:{sup:1},repair:{sup:1},ram:{sup:1},miner:{sup:1}};
function markHTML(c){
  if(c.puppet)return `<b class="rk mk">?</b>`;
  const m=UNIT_MARK[c.unit];if(m==null)return `<b class="rk mk">${esc((UNIT[c.unit].short||UNIT[c.unit].name).slice(0,1))}</b>`;
  if(typeof m==="string")return `<b class="rk mk${m.length>1?" two":""}${m==="$"?" dollar":""}">${m}</b>`;   // v59: the $ in the red of the game's title lettering
  if(m.sup)return `<b class="mk sup">Support</b>`;
  return `<b class="rk mk svgmk">${MK_SVG[m.svg]}</b>`;
}
const cardName=c=>c.puppet?"Puppet":c.unit?(UNIT[c.unit].short||UNIT[c.unit].name):typeWord(c);
/* pictures on a card: one plain ink line, the same weight as the suits; no grey halo */
const INK="#15100b",PAPER="#efe2c8";
function inkSVG(u,color,size){const d=(UNIT_ICON[u]||"").replace(/@/g,color).replace(/#bg/g,PAPER);
  return `<svg class="usym ink" viewBox="-12 -12 24 24" width="${size}" height="${size}" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</g></svg>`}
/* elsewhere (dark backgrounds) the haloed version stays, with the same pictures */
unitSVG=function(u,color,size){const raw=UNIT_ICON[u]||"",d=raw.replace(/@/g,color).replace(/#bg/g,"#000"),h=raw.replace(/@/g,"#000").replace(/#bg/g,"#000");
  return `<svg class="usym" viewBox="-12 -12 24 24" width="${size||22}" height="${size||22}" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#000" stroke-opacity=".5" stroke-width="3.2" opacity=".5">${h}</g><g stroke="${color}" stroke-width="1.5">${d}</g></g></svg>`};
const inkOf=c=>c.unit==="satan"?"#8e1426":INK;

face=function(c,o={}){
  const own=o.owner!==undefined?o.owner:c.owner,P=own!=null&&G&&G.p[own]?G.p[own]:null;
  const col=P?P.color:"#8a8a8a",sm=o.cls==="sm";
  const tail=`${o.price?`<span class="price">${costOf(c)} mana</span>`:""}${o.noci?"":`<span class="ci" data-cid="${c.id}" role="button" title="Card info"></span>`}`;
  const so=P?`<span class="so">${solidSVG(P.solid,col,sm?12:17)}</span>`:"";
  if(c.unit||c.puppet){
    const nm=cardName(c),pic=c.puppet?"puppet":c.unit;
    return `<span class="cf unit ${c.puppet?"u-puppet":"u-"+c.unit}${c.hate?" hated":""}${isBase(c)?" basecard":""} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx">${markHTML(c)}</span><span class="uic">${inkSVG(pic,inkOf(c),sm?18:32)}</span>${c.maxHp&&!sm?heartsHTML(c):""}${so}${sm?"":`<em class="ty${nm.length>9?" long":""}">${esc(nm)}</em>`}${tail}</span>`;
  }
  const rk=c.rank==="JK"?"Joker":c.rank,su=c.rank==="JK"?"✶":SUITS[c.suit];
  return `<span class="cf ${c.color}${c.hate?" hated":""}${isBase(c)?" basecard":""} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx"><b class="rk${c.rank==="JK"?" jk":""}">${rk}</b>${c.rank==="JK"?"":`<i>${su}</i>`}</span><i class="su">${su}</i>${so}${c.maxHp&&!sm?heartsHTML(c):""}${sm?"":`<em class="ty">${typeWord(c)}</em>`}${tail}</span>`;
};

/* ---------- the Puppet: its own card, with the score of a 2 ---------- */
function makePuppet(suit,owner){const c=mk("2",suit);c.puppet=true;if(owner!=null)c.owner=owner;return c}
/* a unit's type word is its name */
for(const k in UNIT)TYPEWORD[k]=UNIT[k].short||UNIT[k].name;

/* ---------- the card browser and the Card info tabs: one card per type ---------- */
BROWSE[1][1]=BROWSE[1][1].filter(k=>k!=="A");      // the Ace is a Base, not a Special
const INFO_PROTO={grunt:"4",infantry:"8",jack:"J",queen:"Q",king:"K",ace:"A",joker:"JK"};
infoBody=function(k){const [t,,rows,note]=INFO[k];const c=protoCard(INFO_PROTO[k]||k);
  return `<div class="ihead">${face(c,{owner:null,noci:true})}<h4>${t}</h4></div><table>${rows.map(([a,b])=>`<tr><th>${a}</th><td>${b}</td></tr>`).join("")}</table><p class="dim">${note}</p>`};
