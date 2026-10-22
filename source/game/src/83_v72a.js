/* ---------- v72a: Field Automation's Skirmish stance and Focus on ambush; "Always leave it on" under the field too ----------
   - Skirmish (hit and run): it attacks only stacks no stronger than the attacker that have no edge over it (no
     disadvantage on its roll, no advantage on theirs) and that it beats more often than not, small stacks first; its
     stance keeps it out of reach of what it can't beat, so it falls back when stronger stacks come.
   - Focus on ambush: stacks that can ambush (Assassins, face-down stacks) hold their ground once an enemy is within four
     tiles, always set an ambush when nothing is in reach, and strike from it only with three chances in four. */
{const _fc=faCtx;faCtx=function(pl){const ctx=_fc.apply(this,arguments),c=faCfgOf(pl),ok=ctx.okAtk,gm=ctx.gainMul;
  const mc=ctx.level==="hard"?48:ctx.level==="easy"?14:30;
  if(c.stance==="skirmish"){
    ctx.okAtk=(st,o)=>{if(!ok(st,o))return false;const E=G.board[o.r]&&G.board[o.r][o.c];if(!E)return false;const A=o.A||st;
      if(netFx(A.odds,hated(A)?"dis":null,hated(E)?"adv":null,A.down?"dis":null,A.supp?"dis":null)<0)return false;   // no disadvantage on its roll
      if(E.odds==="adv"||E.down)return false;   // and no edge on theirs
      if(AI.value(E)>AI.value(A)*1.05)return false;   // equal or weaker
      return AI.winP(A,E,mc,o.mode)>=.5};
    ctx.gainMul=E=>gm(E)*(E.cards.length<=2?1.3:1)}   // small stacks first
  if(c.ambush&&c.ambFocus){ctx.ambushP=1;
    ctx.hold=(st,r,cc)=>canAmbush(st)&&AI.enemyStacks(pl).some(e=>Math.abs(e.r-r)+Math.abs(e.c-cc)<=4);
    const ok2=ctx.okAtk;ctx.okAtk=(st,o)=>{if(!ok2(st,o))return false;if(!st.ambush)return true;const E=G.board[o.r]&&G.board[o.r][o.c];return !!E&&AI.winP(o.A||st,E,mc,o.mode)>=.75}}
  return ctx}}

/* Always leave Field Automation on: in the controls under the field as well as in the window */
{const _p=paintFA;paintFA=function(){_p.apply(this,arguments);const d=$("#fapanel"),b=d&&d.querySelector(".fawide");if(!b||b.querySelector("#faAlwaysU")||autoTab!=="field")return;
  const t=b.querySelector(".atabs");if(t)t.insertAdjacentHTML("afterend",faAlwaysHTML("faAlwaysU"));else b.insertAdjacentHTML("afterbegin",faAlwaysHTML("faAlwaysU"));
  $("#faAlwaysU").onchange=e=>{PREF.faAlways=e.target.checked;savePrefs();if(G)render();paintFA()}}}

if(window.__EC)Object.assign(window.__EC,{faCtxW2:pl=>faCtx(pl)});

/* ---------- v72a: the Ether: Infinite (the default in Survival), or off for the whole game ----------
   Infinite: the Ether remembers what it held at the start, and whatever is taken comes back (checked at the start of
   every turn and after every spell). Off: the Ether is emptied, and the Ether shop, the conjurings that bring a soul from
   the Ether and mystery buys are closed; mana still comes as usual. */
const etherKey=c=>c.unit?"u:"+c.unit:`${c.rank}|${c.suit||""}|${c.color||""}`;
function etherSetup(){if(!G||G._etherSet)return;G._etherSet=true;
  if(G.opts.etherOff){G.ether=[];return}
  if(G.opts.etherPer==="inf"){const m=new Map();for(const c of G.ether){const k=etherKey(c),e=m.get(k)||{k,n:0,u:c.unit||null,r:c.rank,s:c.suit||null,c:c.color||null};e.n++;m.set(k,e)}G.etherInf=[...m.values()]}}
function etherTopUp(){if(!G||NET.role==="guest")return;etherSetup();
  if(G.opts.etherOff){if(G.ether.length)G.ether=[];return}
  if(!G.etherInf)return;const have=new Map();for(const c of G.ether){const k=etherKey(c);have.set(k,(have.get(k)||0)+1)}
  for(const t of G.etherInf){let n=have.get(t.k)||0;while(n<t.n){G.ether.push(t.u?mkUnit(t.u,null):mk(t.r,t.s,t.c||undefined));n++}}}
{const _ng=newGame;newGame=function(){const out=_ng.apply(this,arguments);try{etherSetup()}catch(e){console.error(e)}return out}}
{const _bt=beginTurn;beginTurn=function(){etherTopUp();return _bt.apply(this,arguments)}}
{const _c=cast;cast=async function(){const out=await _c.apply(this,arguments);etherTopUp();return out}}
{const _sb=spellBlock;spellBlock=function(sp){if(G&&G.opts.etherOff&&sp&&ETHER_IDS.has(sp.id))return "The Ether is off in this game.";return _sb.apply(this,arguments)}}
{const _mb=mysteryBuy;mysteryBuy=function(pl){if(G&&G.opts.etherOff){if(G.p[pl]&&!G.p[pl].cpu)flash("The Ether is off in this game.");return null}return _mb.apply(this,arguments)}}
/* an endless Ether shows ∞ */
{const _r=render;render=function(){_r.apply(this,arguments);if(!G||!G.etherInf)return;const a=$("#seeether b");if(a)a.textContent="∞";const d=$("#openEther .dc");if(d)d.textContent="endless souls"}}
