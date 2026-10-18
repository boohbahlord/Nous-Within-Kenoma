/* ---------------- v45: the Claimer and Flags (every mode) ----------------
   The Claimer is a special card (top-left "F", a flag): one heart, no attack and no defense. Two per deck wait in the Ether
   (Claimer Conjure, 2 mana). In your prep phase a stack holding one can "Claim Land": a Flag goes up on that tile and the
   Claimer dies, his card going straight back to the Ether.
   A Flag is not a card. It has three hearts (shown only while nobody stands on it) and turns see-through under a stack, like a
   crystal. It is a spawn point for bases: you can put a base down on your own empty Flag anywhere on the field. Every base but
   a Wall is a spawn point too: you can place cards into your own Ace or Tree wherever it stands.
   An enemy stack beside a Flag (or on it) can strike it in its attack phase: one heart, no roll, and that is its attack for
   the turn. A Repairman beside your Flag (or on it) can give it a heart back, then rests like after any repair. */
UNIT.claimer={name:"Claimer",word:"Claimer",nat:0,soul:1,cost:2,noDef:true,noAtk:true,sup:true,kind:"Special",ether:true,desc:"plants a Flag: a spawn point for bases"};
UNIT_ICON.claimer=`<path d="M-6,11V-10 M-6,-10L9,-6L-6,-1"/>`;
UNIT_MARK.claimer="F";
SIEGE_PER_DECK.claimer=2;
INFO.claimer=["Claimer (special)","Claimer",[["Claim Land","in your prep phase: a Flag goes up on his tile, and he dies; his card goes straight back to the Ether"],
  ["The Flag","three hearts; a spawn point for bases (put a base down on your own empty Flag, anywhere on the field); a Repairman beside it can repair it; an enemy stack beside it can strike it for one heart, as its attack"],
  ["Fights","never: no attack and no defense, one heart; standing alone he can be captured or destroyed"],
  ["Comes","two per deck wait in the Ether; Claimer Conjure, 2 mana"]],"A flag on a pole."];
ETHER_SHOP[1][1].push(["ccl","Claimer"]);ETHER_IDS.add("ccl");ETHER_KIND.ccl="claimer";
BROWSE[1][1].push("claimer");CARD_TREE[1][1].push("claimer");FA_KINDS.push("claimer");
{const _fc=faCat;faCat=function(c){return c&&c.unit==="claimer"?"specials":_fc(c)}}
SPELLS.push({id:"ccl",name:"Claimer Conjure",cost:2,school:"Conjuring",text:"A Claimer's soul comes from the Ether into your deck. In your prep phase he can Claim Land: a Flag with three hearts goes up on his tile, a spawn point for bases, and he goes back to the Ether.",ok:()=>etherHasU("claimer"),run:()=>conjureU("claimer")});
SPELL_TEXT.ccl={e:"A Claimer's soul comes from the Ether into your deck.",l:"In your prep phase he can Claim Land: a Flag with three hearts goes up on his tile, a spawn point for your bases, and he goes back to the Ether."};

/* ---------- the Flags ---------- */
const FLAG_HP=3;
const flagsOf=()=>(G&&G.flags||[]).filter(f=>G.p[f.owner]&&!G.p[f.owner].out);
const flagAt=(r,c)=>flagsOf().find(f=>f.r===r&&f.c===c);
const near1=(r,c,r2,c2)=>Math.max(Math.abs(r-r2),Math.abs(c-c2))<=1;
function flagHTML(r,c,under){const f=flagAt(r,c);if(!f)return "";const P=G.p[f.owner],hearts=under?"":`<i class="fhp">${"♥".repeat(f.hp)}<s>${"♥".repeat(Math.max(0,f.max-f.hp))}</s></i>`;
  const tip=`${esc(P.name)}'s Flag: ${f.hp}/${f.max} hearts. A spawn point for bases: ${esc(P.name)} can put a base down here when the tile is empty. Every base but a Wall is a spawn point too.`;
  return `<span class="flagmk${under?" under":""}" style="--fc:${P.color}" data-tip="${tip}"><svg viewBox="-12 -12 24 24" aria-hidden="true"><path class="pole" d="M-6,11V-10"/><path class="cloth" d="M-6,-10L9,-6L-6,-1Z"/></svg>${hearts}</span>`}
{const _ch=crystalHTML;crystalHTML=function(r,c,under){return _ch(r,c,under)+flagHTML(r,c,under)}}

/* the actions: claim, strike, repair (a joined player's click travels to the host) */
function claimLand(r,c){const st=G.board[r][c];if(!st||st.owner!==G.active||G.phase!=="prep"||isVoid(r,c)||flagAt(r,c))return false;
  const cl=st.cards.find(x=>x.unit==="claimer");if(!cl)return false;
  st.cards.splice(st.cards.indexOf(cl),1);cl.owner=null;delete cl.inSlot;G.ether.push(cl);
  if(!st.cards.length){G.board[r][c]=null;freeCaptive(st,r,c);if(G.sel&&G.sel.r===r&&G.sel.c===c)G.sel=null}else if(G.sel&&G.sel.pick)G.sel.pick.delete(cl.id);
  (G.flags=G.flags||[]).push({r,c,owner:G.active,hp:FLAG_HP,max:FLAG_HP});
  log(`<b>${plName(G.active)}'s Claimer claims ${coord(r,c)}</b>: a Flag goes up (a spawn point for bases), and the Claimer goes back to the Ether.`,"event");
  notify(null,`${plName(G.active)} plants a Flag on ${coord(r,c)}.`);return true}
function flagTargets(st,r,c,want){return flagsOf().filter(f=>near1(r,c,f.r,f.c)&&(want==="strike"?isEnemy(f.owner,st.owner)&&!(G.board[f.r][f.c]&&G.board[f.r][f.c]!==st&&G.board[f.r][f.c].owner!==st.owner):f.owner===st.owner&&f.hp<f.max))}
function strikeFlag(r,c,fr,fc){const st=G.board[r][c],f=flagAt(fr,fc);if(!st||!f||st.owner!==G.active||G.phase!=="attack"||!canAttackFrom(st)||!flagTargets(st,r,c,"strike").includes(f))return false;
  st.attacked=true;f.hp--;
  if(f.hp<=0){G.flags.splice(G.flags.indexOf(f),1);log(`${plName(G.active)} tears down ${plName(f.owner)}'s Flag on ${coord(fr,fc)}.`,"event")}
  else log(`${plName(G.active)} strikes ${plName(f.owner)}'s Flag on ${coord(fr,fc)}: ${f.hp}/${f.max} hearts left.`);
  return true}
function repairFlag(r,c,fr,fc){const st=G.board[r][c],f=flagAt(fr,fc),m=st&&repairOf(st);if(!st||!f||!m||st.owner!==G.active||G.phase!=="prep"||!repairReady(st)||!flagTargets(st,r,c,"repair").includes(f))return false;
  f.hp++;const d=R(3)+1;m.repAt=tnOf(st.owner)+d;log(`${plName(G.active)}'s Repairman mends the Flag on ${coord(fr,fc)} (${f.hp}/${f.max}); he rests ${d} turns (1d3 + 1).`);return true}
for(const [name,get,set] of [["claimLand",()=>claimLand,f=>claimLand=f],["strikeFlag",()=>strikeFlag,f=>strikeFlag=f],["repairFlag",()=>repairFlag,f=>repairFlag=f]]){
  NETFN[name]={get,set};const orig=get();
  set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}

/* the selection box gets the buttons */
{const _sa=siegeActs;siegeActs=function(st,mine,s){const out=_sa(st,mine,s);if(!mine||!canAct())return out;
  if(G.phase==="prep"&&st.cards.some(x=>x.unit==="claimer")&&!flagAt(s.r,s.c))out.push(`<button class="btn sm" id="claimBtn" data-tip="A Flag goes up on this tile: a spawn point for your bases. The Claimer dies and goes back to the Ether.">Claim Land</button>`);
  if(G.phase==="attack"&&canAttackFrom(st))for(const f of flagTargets(st,s.r,s.c,"strike"))out.push(`<button class="btn ghost sm" data-fstrike="${f.r},${f.c}">Strike ${esc(G.p[f.owner].name)}'s Flag on ${coord(f.r,f.c)} (${f.hp}/${f.max})</button>`);
  if(G.phase==="prep"&&repairReady(st))for(const f of flagTargets(st,s.r,s.c,"repair"))out.push(`<button class="btn ghost sm" data-frep="${f.r},${f.c}">Repair the Flag on ${coord(f.r,f.c)} (${f.hp}/${f.max})</button>`);
  return out}}
{const _ws=wireSiege;wireSiege=function(st,s){_ws(st,s);
  if($("#claimBtn"))$("#claimBtn").onclick=()=>{if(!canAct())return;claimLand(s.r,s.c);render()};
  document.querySelectorAll("[data-fstrike]").forEach(b=>b.onclick=()=>{if(!canAct())return;const [fr,fc]=b.dataset.fstrike.split(",").map(Number);strikeFlag(s.r,s.c,fr,fc);G.mode=null;render()});
  document.querySelectorAll("[data-frep]").forEach(b=>b.onclick=()=>{if(!canAct())return;const [fr,fc]=b.dataset.frep.split(",").map(Number);repairFlag(s.r,s.c,fr,fc);render()})}}

/* spawn points: your own empty Flag takes a base; your own Ace or Tree takes cards wherever it stands */
{const _cp=canPlace;canPlace=function(card,r,c){if(_cp(card,r,c))return true;if(!G||G.phase==="setup"||isVoid(r,c))return false;
  const st=G.board[r][c],k=kind(card),f=flagAt(r,c);
  if(!st)return !!(f&&f.owner===G.active&&isBase(card));
  if(st.owner!==G.active||!hasBase(st)||hasK(st,"wall")||isBase(card))return false;
  if(card.unit&&UNIT[card.unit].solo==="alone")return false;
  if(k==="joker"&&!st.cards.some(x=>x.color===card.color))return false;
  return stackLegal([...st.cards,card])}}

/* the computer: strikes enemy Flags with stacks that didn't attack, and claims land with a Claimer out in the field */
{const _ph=AI.phase;AI.phase=async function(pl,ph){const out=await _ph.apply(this,arguments);if(G.over||G.active!==pl)return out;
  if(ph==="attack")for(const {st,r,c} of stacksOf(pl)){if(!canAttackFrom(st))continue;const f=flagTargets(st,r,c,"strike")[0];if(f){strikeFlag(r,c,f.r,f.c);render()}}
  if(ph==="prep")for(const {st,r,c} of stacksOf(pl))if(st.cards.some(x=>x.unit==="claimer")&&!canSpawn(pl,r,c)&&!flagAt(r,c)){claimLand(r,c);render()}
  return out}}
if(window.__EC)Object.assign(window.__EC,{claimLand,strikeFlag,repairFlag,flagAt,canPlace:(...a)=>canPlace(...a),place:(...a)=>place(...a),pickGrave:(...a)=>pickGrave(...a),openSell:(...a)=>openSell(...a)});
