/* ---------- v78e: groups in Field Automation: guards, guarded areas and squadrons ----------
   While Field Automation plays your whole field (not Soft Automate), right-click one of your stacks (Shift+Enter on the
   keys, a double-tap on a phone):
   - Guard a stack…, then click the stack it guards (any of yours: a base, a Miner at its crystal…); Guard the selected
     stack does it at once. Up to nine stacks guard one. A green line runs from each guard to it, ending in an arrow.
     Guards keep one or two tiles from it, on the side the enemy comes from and beside its way rather than in it; they
     move after it, so they follow it, and strike first at what comes near it, turning bold while it is threatened.
   - Guard an area…, then click a tile: the stack holds the ground within two tiles of it and fights what comes in.
     A light dashed green circle shows the area; up to nine stacks guard one. (v78s: a guard's right-click menu makes the
     area wider or smaller, from its own tile only up to six tiles around it, and stays open while you do.)
   - Attack…, then click an enemy stack (v79e): the stack goes after it and nothing else, boldly, taking chances it
     wouldn't otherwise; a red arrow runs to it. Cards that leave the stack keep attacking it (whatever the option below
     says) until you right-click them and Cancel the attack. Up to nine stacks go after one target; when it is gone
     from the field (or is no longer an enemy) they stand down. Out of sight, they make for where it was last seen.
   - Defend an area…, then click a tile (v79e): like guarding an area, but aggressive: the stack goes out to meet
     whatever comes within three tiles of the area's edge and strikes it boldly, then comes back. An orange circle.
   - A squadron, up to nine stacks: New squadron…, then click the stacks to bring in (Esc or Done when finished); Join the
     selected stack's squadron; Add stacks…; Promote to Leader; Disband. Blue lines join it and it keeps together; with a
     leader they become arrows pointing at it, the leader moves first and the rest keep within two tiles of it.
   - Strategy: one of your Automated Strategies plays the group (or a stack in no group) in place of your own settings,
     as a class does; Your own settings takes it back.
   - Leave group, here or in the Selected box. A group ends when its leader (the guarded stack, or a squadron's leader)
     is destroyed, or when no stack is left in it; you are told.
   What happens when cards leave a stack of a group is an option in the Automated Strategies fold: they stay in it (the
   default) or leave it. Only you see the lines. The group is marked on its cards (x.fgId, so it goes wherever they go; a
   stack's own strategy rides on its strongest card, x.fgStrat); the groups and the strategies they play by are kept with
   the player (G.p[pl].fg), so the host plays them. */
const FG_MAX=9,FG_RAD=2,FG_RADMAX=6;   // v78s: an area's radius in tiles: 2 unless changed (0, its own tile only, to 6)
const fgRad=g=>g&&Number.isInteger(g.rad)?Math.max(0,Math.min(FG_RADMAX,g.rad)):FG_RAD;
const fgData=pl=>{const P=G.p[pl];if(!P.fg||typeof P.fg!=="object")P.fg={n:0,g:{},s:{}};return P.fg};
const fgFull=pl=>faOn(pl)&&(faState(pl).cfg||{}).scope!=="soft";
const fgCheb=(a,b,c,d)=>Math.max(Math.abs(a-c),Math.abs(b-d));
/* the group a stack is in: that of its strongest card that has one */
function fgGid(pl,st){const D=G.p[pl]&&G.p[pl].fg;if(!D||!st)return null;let best=null;
  for(const x of st.cards)if(x.fgId&&D.g[x.fgId]&&(!best||rate(x)>rate(best)))best=x;return best?best.fgId:null}
const fgMembers=(pl,gid)=>stacksOf(pl).filter(o=>fgGid(pl,o.st)===gid);
/* a leader (the guarded stack, a squadron's leader) is known by its head card, else by any card it had */
const fgRef=st=>{const cards=[...st.cards].sort((a,b)=>(isBase(b)?99:rate(b))-(isBase(a)?99:rate(a)));return {h:cards[0].id,ids:st.cards.map(x=>x.id)}};
function fgFind(pl,ref){if(!ref)return null;let any=null;for(const o of stacksOf(pl)){if(o.st.cards.some(x=>x.id===ref.h))return o;if(!any&&o.st.cards.some(x=>ref.ids.includes(x.id)))any=o}return any}
const fgLoc=st=>{for(let r=0;r<G.rows;r++){const c=G.board[r].indexOf(st);if(c>=0)return {st,r,c}}return null};
const fgCanJoin=st=>st.cards.some(x=>!isBase(x));   // a base alone can be guarded, not join
const fgIsArea=g=>g&&(g.k==="area"||g.k==="defend");
/* v79e: an Attack group's target, an enemy stack: known by its head card (else any card it had), wherever it stands */
function fgFoe(pl,ref){if(!ref)return null;let any=null;
  for(let r=0;r<G.rows;r++)for(let c=0;c<G.board[r].length;c++){const st=G.board[r][c];if(!st||st.owner===pl)continue;
    if(st.cards.some(x=>x.id===ref.h))return {st,r,c};if(!any&&st.cards.some(x=>ref.ids.includes(x.id)))any={st,r,c}}
  return any}
const fgHostile=(pl,o)=>isEnemy(pl,o)&&!(G.dip&&typeof dipAllied==="function"&&dipAllied(pl,o));
/* where the attackers make for: the target if they see it, else where it was last seen */
function fgAim(pl,g){const T=fgFoe(pl,g.tgt);if(T&&seesTile(pl,T.r,T.c))return {r:T.r,c:T.c,T,seen:true};const s=g.seen||(T?[T.r,T.c]:null);return s?{r:s[0],c:s[1],T,seen:false}:null}

/* ---------- a group ends ---------- */
function fgEnd(pl,gid,why){const D=fgData(pl);if(!D.g[gid])return;delete D.g[gid];
  for(const o of stacksOf(pl))for(const x of o.st.cards)if(x.fgId===gid)delete x.fgId;
  if(why&&!G.p[pl].cpu)notify(pl,why)}
function fgTidy(pl){const D=G.p[pl]&&G.p[pl].fg;if(!D)return;
  for(const gid of Object.keys(D.g)){const g=D.g[gid],L=g.lead?fgFind(pl,g.lead):null;
    if(g.k==="guard"){if(!L){fgEnd(pl,gid,"The stack your guards protected is gone: they stand down.");continue}
      for(const x of L.st.cards)if(x.fgId===gid)delete x.fgId}   // a guard that joins the stack it guards is no longer its guard
    if(g.k==="attack"){const T=fgFoe(pl,g.tgt);
      if(!T){fgEnd(pl,gid,"The stack your attackers went after is gone: they stand down.");continue}
      if(!fgHostile(pl,T.st.owner)){fgEnd(pl,gid,"Your attackers stand down: their target is no longer an enemy.");continue}
      if(seesTile(pl,T.r,T.c))g.seen=[T.r,T.c]}
    if(g.k==="squad"&&g.lead&&!L){fgEnd(pl,gid,"Your squadron's leader fell: the squadron breaks up.");continue}
    if(g.k==="squad"&&L&&!L.st.cards.some(x=>x.fgId===gid))g.lead=null;   // v78j: it left the squadron
    const n=fgMembers(pl,gid).length;if(!n||g.k==="squad"&&n<2)fgEnd(pl,gid,g.k==="squad"&&n?"Your squadron breaks up: only one stack is left in it.":"")}
  const used=new Set(Object.values(D.g).map(g=>g.sid).filter(Boolean));for(const o of stacksOf(pl))for(const x of o.st.cards)if(x.fgStrat)used.add(x.fgStrat);
  for(const sid of Object.keys(D.s))if(!used.has(sid))delete D.s[sid]}
{const _r=render;render=function(){if(G&&!G.over&&NET.role!=="guest")for(const P of G.p)if(P.fg)try{fgTidy(P.i)}catch(e){console.error(e)}rSafe(_r,this,arguments)}}
/* a card back on the field comes back free */
{const _p=place;place=function(card){if(card){delete card.fgId;delete card.fgStrat}return _p.apply(this,arguments)}}
/* cards that leave a stack of a group (your own split, not the automation's moves) leave the group, when the option says so */
{const _dm=doMove;doMove=function(r,c){const s=G&&G.sel,from=s&&G.board[s.r]&&G.board[s.r][s.c],pl=from?from.owner:null;
  const moving=from&&s.pick&&s.pick.size<from.cards.length?[...s.pick]:null;const out=_dm.apply(this,arguments);
  if(moving&&!G.busy&&pl!=null&&G.p[pl]&&G.p[pl].fg&&((faState(pl)||{}).cfg||{}).grpSplit==="leave"){const to=G.board[r]&&G.board[r][c];if(to)for(const x of to.cards)if(moving.includes(x.id)&&!(G.p[pl].fg.g[x.fgId]&&G.p[pl].fg.g[x.fgId].k==="attack"))delete x.fgId}   // v79e: an attacker keeps attacking until it is called off
  return out}}
/* a stack in a group isn't sent off to guard a crystal */
{const _cc=crysCands;crysCands=function(pl){return _cc.apply(this,arguments).filter(o=>!fgGid(pl,o.st))}}

/* ---------- what you do with them (the host does it) ---------- */
function fgDo(pl,op,a,b,c){if(!G||!G.p[pl]||G.over||NET.ctx!=null&&NET.ctx!==pl||!faAllowed())return false;const D=fgData(pl);
  const at=p=>{if(!Array.isArray(p))return null;const st=G.board[p[0]]&&G.board[p[0]][p[1]];return st&&st.owner===pl?{st,r:p[0],c:p[1]}:null};
  const mark=(o,gid)=>{for(const x of o.st.cards)if(isBase(x)||!gid)delete x.fgId;else{x.fgId=gid;delete x.faCrys}};   // v78j: and off its crystal
  // a squadron's leader that goes leaves it leaderless
  const out=o=>{const was=fgGid(pl,o.st),g=was&&D.g[was];if(g&&g.k==="squad"&&g.lead){const L=fgFind(pl,g.lead);if(L&&L.st===o.st)g.lead=null}mark(o,null)};
  const room=gid=>fgMembers(pl,gid).length<FG_MAX,newG=g=>{const id="g"+(++D.n);D.g[id]=g;return id};
  const o=at(a);
  if(op==="guard"){const L=at(b);if(!o||!L||o.st===L.st||!fgCanJoin(o.st))return false;
    const lg=fgGid(pl,L.st);if(lg&&D.g[lg].k==="guard"){const LL=fgFind(pl,D.g[lg].lead);if(LL&&LL.st===o.st)return false}   // two stacks don't guard each other
    let gid=Object.keys(D.g).find(id=>{const g=D.g[id],X=g.k==="guard"&&fgFind(pl,g.lead);return X&&X.st===L.st});
    if(gid&&fgGid(pl,o.st)===gid)return false;if(gid&&!room(gid))return false;
    if(!gid)gid=newG({k:"guard",lead:fgRef(L.st),sid:null});out(o);mark(o,gid)}
  else if(op==="area"||op==="defend"){if(!o||!fgCanJoin(o.st)||!Array.isArray(b)||isVoid(b[0],b[1]))return false;   // v79e: defend, the bold one
    let gid=Object.keys(D.g).find(id=>D.g[id].k===op&&D.g[id].at[0]===b[0]&&D.g[id].at[1]===b[1]);if(gid&&fgGid(pl,o.st)===gid)return false;if(gid&&!room(gid))return false;
    if(!gid)gid=newG({k:op,at:[b[0],b[1]],sid:null});out(o);mark(o,gid)}
  else if(op==="attack"){const E=Array.isArray(b)&&G.board[b[0]]&&G.board[b[0]][b[1]];   // v79e: go after one enemy stack
    if(!o||!fgCanJoin(o.st)||!E||!fgHostile(pl,E.owner)||!seesTile(pl,b[0],b[1]))return false;
    let gid=Object.keys(D.g).find(id=>{const g=D.g[id],T=g.k==="attack"&&fgFoe(pl,g.tgt);return T&&T.st===E});
    if(gid&&fgGid(pl,o.st)===gid)return false;if(gid&&!room(gid))return false;
    if(!gid)gid=newG({k:"attack",tgt:fgRef(E),seen:[b[0],b[1]],sid:null});out(o);mark(o,gid)}
  else if(op==="squad"){const L=(Array.isArray(a)?a:[]).map(at).filter(x=>x&&fgCanJoin(x.st)).filter((x,i,A)=>A.findIndex(y=>y.st===x.st)===i).slice(0,FG_MAX);
    if(L.length<2)return false;const gid=newG({k:"squad",lead:null,sid:null});for(const x of L){out(x);mark(x,gid)}}
  else if(op==="join"){const g=D.g[b];if(!o||!g||g.k!=="squad"||!fgCanJoin(o.st)||fgGid(pl,o.st)===b||!room(b))return false;out(o);mark(o,b)}
  else if(op==="lead"){const gid=o&&fgGid(pl,o.st);if(!gid||D.g[gid].k!=="squad")return false;D.g[gid].lead=fgRef(o.st)}
  else if(op==="leave"){if(!o||!fgGid(pl,o.st))return false;out(o)}
  else if(op==="disband"){if(!D.g[a])return false;fgEnd(pl,a,"")}
  else if(op==="dismiss"){if(!o)return false;for(const id of Object.keys(D.g)){const g=D.g[id],X=g.k==="guard"&&fgFind(pl,g.lead);if(X&&X.st===o.st)fgEnd(pl,id,"")}}
  else if(op==="rad"){const gid=o&&fgGid(pl,o.st),g=gid&&D.g[gid];if(!fgIsArea(g))return false;   // v78s: the area wider or smaller
    const r=Math.max(0,Math.min(FG_RADMAX,fgRad(g)+(b>0?1:-1)));if(r===fgRad(g))return false;g.rad=r}
  else if(op==="strat"){if(!o)return false;const gid=fgGid(pl,o.st);let sid=null;
    if(c&&typeof c==="object"){sid="s"+(++D.n);D.s[sid]={name:stName(b)||"Strategy",cfg:stCfg(c)}}
    if(gid)D.g[gid].sid=sid;
    else{for(const x of o.st.cards)delete x.fgStrat;const h=o.st.cards.filter(x=>!isBase(x)).sort((x,y)=>rate(y)-rate(x))[0];if(h&&sid)h.fgStrat=sid}}
  else return false;
  fgTidy(pl);render();return true}
for(const [name,get,set] of [["fgDo",()=>fgDo,f=>fgDo=f]])netAny(name,get,set);

/* ---------- how the field plays them (the automation's per-stack settings, as the classes do) ---------- */
/* a strategy's settings in place of yours: every card of the stack under it */
function fgStratCtx(pl,cfg){const over=Object.assign({},faEff(cfg),{ctl:Object.fromEntries(Object.keys(FA_DEF.ctl).map(x=>[x,true])),extra:[],xminus:[],scope:"full"});delete over.classes;   // v78j: scope
  FA_OVR={pl,cfg:faClean(over)};try{return Object.assign({pl},faCtx(pl))}finally{FA_OVR=null}}
/* the side the enemy comes from: the near ones weigh most; with none in sight, their ground */
function fgThreat(pl,r,c,foes){let vr=0,vc=0;for(const e of foes){const d=Math.max(1,Math.abs(e.r-r)+Math.abs(e.c-c));vr+=(e.r-r)/(d*d);vc+=(e.c-c)/(d*d)}
  if(!foes.length){let n=0,sr=0,sc=0;for(const e of enemiesOf(pl))for(const [a,b] of zoneTiles(e)){sr+=a;sc+=b;n++}if(n){vr=sr/n-r;vc=sc/n-c}}
  const L=Math.hypot(vr,vc);return L?[vr/L,vc/L]:null}
function fgShape(pl,gid,g,base,role){const cx=Object.assign({},base,{pl}),foes=AI.enemyStacks(pl),pos=new Map(foes.map(e=>[e.st,e])),gm=base.gainMul||(()=>1),pull0=base.extraPull;
  const pull=f=>{cx.extraPull=(S,r,c,walk)=>(pull0?pull0(S,r,c,walk):0)+f(S,r,c,walk)};
  if(g.k==="guard"){const L0=fgFind(pl,g.lead);if(!L0)return cx;
    pull((S,r,c)=>{const L=fgFind(pl,g.lead)||L0,d=fgCheb(r,c,L.r,L.c);let p=d===0?6:d<=2?0:2.4*(d-2);   // one or two tiles from it, where it stands now
      const u=fgThreat(pl,L.r,L.c,foes);if(u&&d){p+=1.1*(1-((r-L.r)*u[0]+(c-L.c)*u[1])/Math.hypot(r-L.r,c-L.c));   // on the side the enemy comes from
        if(r===L.r+Math.round(u[0])&&c===L.c+Math.round(u[1]))p+=.9}   // beside its way, not in it
      return p});
    const ns=base.noStack;cx.noStack=(grp,t)=>{const L=fgFind(pl,g.lead);return !!L&&t===L.st||(ns?ns(grp,t):false)};
    cx.late=true;   // it moves first; they follow
    cx.aggr={on:!!(base.aggr&&base.aggr.on),how:"square",n:2};   // v79f: a guard chases only what comes right up to it
    cx.gainMul=E=>{const e=pos.get(E);if(!e)return gm(E);const d=fgCheb(e.r,e.c,L0.r,L0.c);return gm(E)*(d<=1?3.2:d<=2?2.4:d<=3?1.5:1)};
    if(foes.some(e=>fgCheb(e.r,e.c,L0.r,L0.c)<=4)){cx.W=faMix(base.W,FA_OFF,.65);cx.thrAdj=(base.thrAdj||0)-.12}   // threatened: bold
    return cx}
  /* v79e: Attack: after its target, boldly; a stack that isn't it is worth little unless it is in the way */
  if(g.k==="attack"){const A=fgAim(pl,g);if(!A)return cx;const T=A.seen?A.T.st:null;
    const isT=E=>!!T&&(E===T||E.owner===T.owner&&E.cards.length===T.cards.length&&Object.keys(T).every(k=>k==="cards"||E[k]===T[k]));   // a face-down target comes as a copy
    pull((S,r,c,walk)=>{let d=walk?walk(r,c,A.r,A.c):99;if(!(d<99))d=fgCheb(r,c,A.r,A.c);return d<=1?0:1.7*(d-1)});
    cx.gainMul=E=>isT(E)?gm(E)*5:gm(E)*.6;cx.aggr={on:true,how:"auto"};
    cx.W=faMix(base.W,FA_OFF,.9);cx.thrAdj=(base.thrAdj||0)-.22;cx.lossMul=(base.lossMul||1)*.6;   // reckless, somewhat
    return cx}
  /* v79e: Defend: goes out to meet what comes within three tiles of the area's edge, strikes it boldly, comes back */
  if(g.k==="defend"){const [ar,ac]=g.at,R=fgRad(g),reach=R+3,dA=(r,c)=>Math.hypot(r-ar,c-ac),near=foes.filter(e=>dA(e.r,e.c)<=reach+.3);cx.aggr={on:true,how:"radius",n:3};
    pull((S,r,c)=>{const d=dA(r,c);if(near.length)return d>reach+.3?2.6*(d-reach)+1:0;return d>R+.3?2.2*(d-R)+.8:.1*d});
    cx.gainMul=E=>{const e=pos.get(E);if(!e)return gm(E);const d=dA(e.r,e.c);return gm(E)*(d<=R+.3?3.4:d<=reach+.3?2.8:.5)};
    if(near.length){cx.W=faMix(base.W,FA_OFF,.9);cx.thrAdj=(base.thrAdj||0)-.2;cx.lossMul=(base.lossMul||1)*.7}else cx.W=faMix(base.W,FA_OFF,.35);
    return cx}
  if(g.k==="area"){const [ar,ac]=g.at,R=fgRad(g),inA=(r,c)=>Math.hypot(r-ar,c-ac)<=R+.3;cx.aggr={on:!!(base.aggr&&base.aggr.on),how:"radius",n:Math.max(1,R)};   // v79f: it holds its ground
    pull((S,r,c)=>{const d=Math.hypot(r-ar,c-ac);return d>R+.3?2.6*(d-R)+1:.12*d});
    // v78s: a guard caught outside its area fights the enemies in its way back (nearer the area than it is, within two tiles of it)
    const away=fgMembers(pl,gid).filter(m=>!inA(m.r,m.c)),inWay=e=>away.some(m=>Math.hypot(e.r-ar,e.c-ac)<Math.hypot(m.r-ar,m.c-ac)&&fgCheb(e.r,e.c,m.r,m.c)<=2);
    cx.gainMul=E=>{const e=pos.get(E);return gm(E)*(e?(inA(e.r,e.c)?2.2:inWay(e)?2.4:.55):1)};
    if(foes.some(e=>inA(e.r,e.c))||away.length&&foes.some(inWay)){cx.W=faMix(base.W,FA_OFF,.55);cx.thrAdj=(base.thrAdj||0)-.08}
    return cx}
  /* a squadron: the leader leads (not too far ahead of the rest); the others keep within two tiles of it, or (no leader) of one another */
  if(role==="L"){pull((S,r,c)=>{const M=fgMembers(pl,gid).filter(o=>!S.cards.some(x=>o.st.cards.includes(x)));if(!M.length)return 0;
    const mr=M.reduce((a,o)=>a+o.r,0)/M.length,mc=M.reduce((a,o)=>a+o.c,0)/M.length;return .25*Math.max(0,Math.hypot(r-mr,c-mc)-3)});return cx}
  cx.late=!!g.lead;
  pull((S,r,c)=>{const L=g.lead&&fgFind(pl,g.lead);if(L){const d=fgCheb(r,c,L.r,L.c);return d<=2?0:1.8*(d-2)}
    let d=99;for(const o of fgMembers(pl,gid))if(!S.cards.some(x=>o.st.cards.includes(x)))d=Math.min(d,fgCheb(r,c,o.r,o.c));return d===99||d<=2?0:1.2*(d-2)});
  return cx}
/* per stack: its group's shape over its strategy (or its class, or your own settings) */
function fgCtxFor(pl,st,main,prev,cache){const D=G.p[pl].fg,gid=fgGid(pl,st),g=gid&&D.g[gid];
  const sid=g?g.sid:(st.cards.find(x=>x.fgStrat&&D.s[x.fgStrat])||{}).fgStrat;
  if(!g&&!sid)return prev?prev(st):null;
  const cls=!sid&&prev?prev(st):null,role=g&&g.k==="squad"&&g.lead&&st.cards.some(x=>x.id===g.lead.h)?"L":"m";
  const key=[gid||"",sid||"",cls?cls.clsId:"",role].join("|");if(cache.has(key))return cache.get(key);
  const base=sid&&D.s[sid]?fgStratCtx(pl,D.s[sid].cfg):cls||main,cx=g?fgShape(pl,gid,g,base,role):Object.assign({},base,{pl});
  cache.set(key,cx);return cx}
{const _fc=faCtx;faCtx=function(pl){const ctx=_fc.apply(this,arguments);if(FA_OVR)return ctx;const D=G&&G.p[pl]&&G.p[pl].fg;if(!D||!fgFull(pl))return ctx;
  fgTidy(pl);const prev=ctx.clsOf,cache=new Map();ctx.clsOf=st=>fgCtxFor(pl,st,ctx,prev,cache);return ctx}}

/* ---------- the right-click menu ---------- */
function fgName(V,gid,g,o){const n=fgMembers(V,gid).length,L=g.lead?fgFind(V,g.lead):null,s=g.sid&&G.p[V].fg.s[g.sid];let t;
  if(g.k==="guard")t=L?`Guards the stack on ${coord(L.r,L.c)} (${n} guard${n>1?"s":""})`:"Guards";
  else if(g.k==="area")t=`Guards the area around ${coord(g.at[0],g.at[1])}`;
  else if(g.k==="defend")t=`Defends the area around ${coord(g.at[0],g.at[1])}`;
  else if(g.k==="attack"){const A=fgAim(V,g);t=`Attacking ${A?(A.seen?`the stack on ${coord(A.r,A.c)}`:`a stack last seen on ${coord(A.r,A.c)}`):"a stack"} (${n} stack${n>1?"s":""})`}
  else t=`Squadron of ${n} stacks, ${L?(o&&L.st===o.st?"led by this one":`led from ${coord(L.r,L.c)}`):"no leader"}`;
  return t+(s?` · ${s.name}`:"")}
function fgItems(o){const V=view(),D=G.p[V].fg||{g:{},s:{}},gid=fgGid(V,o.st),g=gid&&D.g[gid];
  const ss=selStack(),selO=ss&&ss.owner===V&&ss!==o.st?{st:ss,r:G.sel.r,c:G.sel.c}:null;
  const b=(op,t,on)=>`<button type="button" role="menuitem" data-fg="${op}"${on?' class="on"':""}>${t}</button>`;
  let h=`<p class="clsmh">Field Automation group</p>`;
  if(g){h+=`<p class="fgnow">${esc(fgName(V,gid,g,o))}</p>`;
    if(fgIsArea(g)){const r=fgRad(g);h+=`<p class="fgrad">Area: ${r?`${r} tile${r>1?"s":""} around ${coord(g.at[0],g.at[1])}`:`${coord(g.at[0],g.at[1])} only`}</p><div class="fgradb">${b("rad+","Wider area (+1 tile)").replace("<button",r>=FG_RADMAX?"<button disabled":"<button")}${b("rad-","Smaller area (−1 tile)").replace("<button",r<=0?"<button disabled":"<button")}</div>`}
    if(g.k==="squad"){if(!(g.lead&&o.st.cards.some(x=>x.id===g.lead.h)))h+=b("lead","Promote to Leader");if(fgMembers(V,gid).length<FG_MAX)h+=b("add","Add stacks…")}
    if(g.k==="attack"){h+=b("leave","Cancel the attack");if(fgMembers(V,gid).length>1)h+=b("disband","Cancel the attack for all of them")}   // v79e
    else{h+=b("leave","Leave group");if(g.k==="squad")h+=b("disband","Disband the squadron")}}
  if(fgCanJoin(o.st)){
    if(selO){const X=g&&g.k==="guard"&&fgFind(V,g.lead);if(!(X&&X.st===selO.st))h+=b("guardsel",`Guard the selected stack (${coord(selO.r,selO.c)})`)}
    h+=b("attack","Attack…")+b("guard","Guard a stack…")+b("area","Guard an area…")+b("defend","Defend an area…");
    if(!g||g.k!=="squad"){const sg=selO&&fgGid(V,selO.st);if(sg&&D.g[sg].k==="squad")h+=b("joinsel","Join the selected stack's squadron");h+=b("squad","New squadron…")}}
  if(Object.values(D.g).some(x=>{const X=x.k==="guard"&&fgFind(V,x.lead);return X&&X.st===o.st}))h+=b("dismiss","Dismiss its guards");
  const L=stList();if(L.length&&fgCanJoin(o.st)){const cur=g?g.sid:(o.st.cards.find(x=>x.fgStrat)||{}).fgStrat,curName=cur&&D.s[cur]?D.s[cur].name:null;
    h+=`<p class="clsmh">Strategy for ${g?"the group":"this stack"}</p>`+b("strat:","Your own settings",!curName)+L.map(s=>b("strat:"+s.id,esc(s.name),curName===s.name)).join("")}
  return h}
function fgWire(m,o){m.querySelectorAll("[data-fg]").forEach(btn=>btn.onclick=()=>{
  if(btn.dataset.fg==="rad+"||btn.dataset.fg==="rad-"){fgDo(view(),"rad",[o.r,o.c],btn.dataset.fg==="rad+"?1:-1);   // v78s: the menu stays open while the area changes
    const box=m.querySelector(".fgmenu");if(box)box.innerHTML=fgItems(o);else m.innerHTML=fgItems(o);fgWire(m,o);const again=m.querySelector(`[data-fg="${btn.dataset.fg}"]:not([disabled])`)||m.querySelector('[data-fg^="rad"]:not([disabled])');if(again)again.focus({preventScroll:true});return}
  m.hidden=true;fgUse(btn.dataset.fg,o)})}
function fgUse(op,o){const V=view(),gid=fgGid(V,o.st),here=[o.r,o.c];
  if(op==="guardsel"){const L=selStack();if(!L)return;if(!fgGuardRoom(V,L)){flash("Nine stacks already guard that one.");return}fgDo(V,"guard",here,[G.sel.r,G.sel.c]);flash("It guards the selected stack.")}
  else if(op==="guard")fgPick({op,from:here,text:"Click the stack it should guard"});
  else if(op==="area")fgPick({op,from:here,text:"Click the middle of the area it should guard (two tiles around it; its right-click menu makes it wider or smaller)"});
  else if(op==="defend")fgPick({op,from:here,text:"Click the middle of the area it should defend (it goes out to meet anything within three tiles of it)"});
  else if(op==="attack")fgPick({op,from:here,text:"Click the enemy stack it should attack"});
  else if(op==="squad")fgPick({op,from:here,list:[],text:"Click the stacks to bring into the squadron (up to nine)"});
  else if(op==="add")fgPick({op,from:here,gid,text:"Click the stacks to add to the squadron"});
  else if(op==="joinsel"){const sg=fgGid(V,selStack());if(fgMembers(V,sg).length>=FG_MAX){flash("A squadron holds nine stacks at most.");return}fgDo(V,"join",here,sg)}
  else if(op==="lead"){fgDo(V,"lead",here);flash("Promoted to leader: the squadron follows it.")}
  else if(op==="leave")fgDo(V,"leave",here);
  else if(op==="disband")fgDo(V,"disband",gid);
  else if(op==="dismiss")fgDo(V,"dismiss",here);
  else if(op.startsWith("strat:")){const s=stList().find(x=>x.id===op.slice(6));fgDo(V,"strat",here,s?s.name:null,s?s.cfg:null);flash(s?`“${s.name}” plays ${gid?"the group":"this stack"}.`:"Your own settings again.")}}
const fgGuardRoom=(V,L)=>{const D=G.p[V].fg;if(!D)return true;const id=Object.keys(D.g).find(k=>{const X=D.g[k].k==="guard"&&fgFind(V,D.g[k].lead);return X&&X.st===L});return !id||fgMembers(V,id).length<FG_MAX};
function fgTargetAt(e){if(!G||G.over)return null;const V=view();if(V==null||!G.p[V]||!fgFull(V))return null;
  const t=e.target.closest&&e.target.closest("#board .tile");if(!t)return null;const r=+t.dataset.r,c=+t.dataset.c,st=G.board[r]&&G.board[r][c];
  return st&&st.owner===V?{st,r,c}:null}
function fgMenu(o,x,y){let m=$("#clsmenu");if(!m){m=document.createElement("div");m.id="clsmenu";m.setAttribute("role","menu");document.body.appendChild(m)}
  m.innerHTML=fgItems(o);m.hidden=false;const w=m.offsetWidth||200,h=m.offsetHeight||220;m.style.left=Math.max(6,Math.min(innerWidth-w-6,x))+scrollX+"px";
  m.style.top=Math.max(6,Math.min(innerHeight-h-6,y))+scrollY+"px";
  fgWire(m,o);const f=m.querySelector("button");if(f)f.focus({preventScroll:true})}
/* the class menu carries the group's part when it opens on a stack */
{const _cm=clsMenu;clsMenu=function(target){_cm.apply(this,arguments);const o=target&&target.st&&G&&fgFull(view())?fgLoc(target.st):null,m=$("#clsmenu");if(!o||!m)return;
  m.insertAdjacentHTML("beforeend",`<div class="fgmenu">${fgItems(o)}</div>`);fgWire(m,o)}}
document.addEventListener("contextmenu",e=>{if(FG.pick){e.preventDefault();const m=$("#clsmenu");if(m)m.hidden=true;fgPickEnd(false);return}   // a right-click while picking stops it
  if(e.defaultPrevented)return;const o=fgTargetAt(e);if(!o)return;e.preventDefault();fgMenu(o,e.clientX,e.clientY)});
let fgTap=null;
document.addEventListener("pointerup",e=>{if(e.pointerType!=="touch"||clsTargetAt(e)||FG.pick)return;const o=fgTargetAt(e);if(!o){fgTap=null;return}
  const key=o.st.cards[0].id,now=performance.now();
  if(fgTap&&fgTap.key===key&&now-fgTap.t<350){fgTap=null;setTimeout(()=>fgMenu(o,e.clientX,e.clientY),0)}else fgTap={key,t:now}});

/* ---------- picking on the field: the stack to guard, the area, the stacks of a squadron ---------- */
const FG={pick:null};
function fgPick(p){FG.pick=p;fgPickPaint()}
function fgPickEnd(keep){const p=FG.pick;FG.pick=null;if(keep&&p&&p.op==="squad"){if(p.list.length)fgDo(view(),"squad",[p.from,...p.list]);else flash("No squadron: no other stack was chosen.")}fgPickPaint()}
function fgPickPaint(){document.querySelectorAll(".fgok,.fgon,.fgfrom,.fgfoe").forEach(e=>e.classList.remove("fgok","fgon","fgfrom","fgfoe"));let bar=$("#fgpick");const p=FG.pick;
  if(!p||!G){if(bar)bar.hidden=true;return}const V=view(),tile=(r,c)=>document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`);
  for(const o of stacksOf(V)){const t=tile(o.r,o.c);if(!t)continue;if(o.r===p.from[0]&&o.c===p.from[1])t.classList.add("fgfrom");
    else if(p.op!=="area"&&p.op!=="defend"&&p.op!=="attack"&&(p.op==="guard"||fgCanJoin(o.st)))t.classList.add(p.list&&p.list.some(([a,b])=>a===o.r&&b===o.c)?"fgon":"fgok")}
  if(p.op==="attack")for(const e of AI.enemyStacks(V))if(fgHostile(V,e.st.owner)){const t=tile(e.r,e.c);if(t)t.classList.add("fgfoe")}   // v79e
  if(!bar){bar=document.createElement("div");bar.id="fgpick";bar.setAttribute("role","status");document.body.appendChild(bar)}
  const multi=p.op==="squad"||p.op==="add";
  bar.innerHTML=`<span>${esc(p.text)}${p.list?` · ${p.list.length+1} of ${FG_MAX}`:""} · ${fsTouchOnly()?`tap a stack${multi?"; Done when done":""}`:`Pick: ${esc(kmShow("act"))} or a click${multi?" · Done: Esc":" · Stop: Esc"}`}</span>${multi?`<button type="button" class="btn sm" id="fgDone">Done</button>`:""}<button type="button" class="btn ghost sm" id="fgStop">${multi?"Cancel":"Stop"}</button>`;
  bar.classList.toggle("fgatk",p.op==="attack");bar.hidden=false;const d=$("#fgDone");if(d)d.onclick=()=>fgPickEnd(true);$("#fgStop").onclick=()=>fgPickEnd(false)}
{const _tc=tileClick;tileClick=function(r,c){const p=FG.pick;if(!p||!G)return _tc.apply(this,arguments);const V=view(),st=G.board[r]&&G.board[r][c],mine=st&&st.owner===V,from=p.from;
  if(r===from[0]&&c===from[1]&&p.op!=="area"&&p.op!=="defend"){flash("That is the stack itself: click another.");return}
  if(p.op==="guard"){if(!mine){flash("Click one of your stacks (Esc stops).");return}if(!fgGuardRoom(V,st)){flash("Nine stacks already guard that one.");return}
    FG.pick=null;fgDo(V,"guard",from,[r,c]);fgPickPaint();flash(`It guards the stack on ${coord(r,c)}.`);return}
  if(p.op==="area"||p.op==="defend"){if(isVoid(r,c)){flash("Click a tile of the field.");return}FG.pick=null;fgDo(V,p.op,from,[r,c]);fgPickPaint();flash(`It ${p.op==="area"?"guards":"defends"} the area around ${coord(r,c)}.`);return}
  if(p.op==="attack"){if(!st||!fgHostile(V,st.owner)||!seesTile(V,r,c)){flash("Click an enemy stack you can see (Esc stops).");return}   // v79e
    const gid=Object.keys(G.p[V].fg?G.p[V].fg.g:{}).find(id=>{const g=G.p[V].fg.g[id],T=g.k==="attack"&&fgFoe(V,g.tgt);return T&&T.st===st});
    if(gid&&fgMembers(V,gid).length>=FG_MAX){flash("Nine stacks already go after that one.");return}
    FG.pick=null;fgDo(V,"attack",from,[r,c]);fgPickPaint();flash(`It attacks the stack on ${coord(r,c)}. Cards that leave it keep attacking until you cancel it.`);return}
  if(!mine){fgPickEnd(true);return}   // open ground or not yours: done
  if(!fgCanJoin(st)){flash("A base alone can't join a squadron: it can be guarded.");return}
  if(p.op==="add"){if(fgMembers(V,p.gid).length>=FG_MAX){flash("A squadron holds nine stacks at most.");return}fgDo(V,"join",[r,c],p.gid);fgPickPaint();return}
  const i=p.list.findIndex(([a,b])=>a===r&&b===c);if(i>=0)p.list.splice(i,1);else if(p.list.length+1>=FG_MAX)flash("A squadron holds nine stacks at most.");
  else p.list.push([r,c]);fgPickPaint()}}
addEventListener("keydown",e=>{if(!FG.pick||typing(e.target))return;if(e.key==="Escape"||kmIs(e,"close")){e.preventDefault();e.stopImmediatePropagation();fgPickEnd(true)}},true);
{const _r=render;render=function(){rSafe(_r,this,arguments);if(FG.pick){if(!G||G.over||!fgFull(view()))fgPickEnd(false);else fgPickPaint()}}}

/* ---------- the Selected box: the group, and Leave group ---------- */
{const _rs=renderSel;renderSel=function(){_rs.apply(this,arguments);if(!G||!G.sel)return;const V=view(),st=selStack(),box=$("#selbox");
  if(!box||!st||st.owner!==V||!fgFull(V)||!G.p[V].fg)return;const D=G.p[V].fg,gid=fgGid(V,st),sid=!gid&&(st.cards.find(x=>x.fgStrat&&D.s[x.fgStrat])||{}).fgStrat;
  if(!gid&&!sid)return;const o={st,r:G.sel.r,c:G.sel.c};
  box.insertAdjacentHTML("beforeend",gid?`<p class="fgselrow"><span class="dim">Group:</span> ${esc(fgName(V,gid,D.g[gid],o))} <button type="button" class="btn sm ghost" id="fgLeaveB">Leave group</button></p>`
    :`<p class="fgselrow"><span class="dim">Strategy:</span> ${esc(D.s[sid].name)} <button type="button" class="btn sm ghost" id="fgOwnB">Your own settings</button></p>`);
  const lb=$("#fgLeaveB");if(lb)lb.onclick=()=>fgDo(V,"leave",[o.r,o.c]);const ob=$("#fgOwnB");if(ob)ob.onclick=()=>fgDo(V,"strat",[o.r,o.c],null,null)}}

/* ---------- the lines (only for you): green to what a guard guards, a green circle for an area, blue in a squadron ----------
   Drawn in the board's own coordinates, as the crystal guards are, so the camera's zoom and pan carry them. */
let fgSig="";
function fgTree(M){const out=[],inT=[M[0]];const rest=M.slice(1);while(rest.length){let best=null;
    for(const a of inT)for(const b of rest){const d=Math.hypot(a.r-b.r,a.c-b.c);if(!best||d<best.d)best={a,b,d}}
    out.push([best.a,best.b]);inT.push(best.b);rest.splice(rest.indexOf(best.b),1)}return out}
function fgSVG(){const B=$("#board");if(!B||!G)return;const V=view(),D=V!=null&&G.p[V]&&G.p[V].fg,items=[];const old=B.querySelector(":scope>svg.fagroups");
  if(D&&!G.over&&fgFull(V))for(const [gid,g] of Object.entries(D.g)){const M=fgMembers(V,gid);
    if(g.k==="guard"){const L=fgFind(V,g.lead);if(L)for(const m of M)if(m.st!==L.st)items.push(["gd",m.r,m.c,L.r,L.c])}
    else if(fgIsArea(g)){const d=g.k==="defend";items.push([d?"dr":"ar",g.at[0],g.at[1],fgRad(g)]);for(const m of M)items.push([d?"dl":"al",m.r,m.c,g.at[0],g.at[1]])}
    else if(g.k==="attack"){const A=fgAim(V,g);if(A)for(const m of M)items.push(["at",m.r,m.c,A.r,A.c])}
    else{const L=g.lead?fgFind(V,g.lead):null;if(L){for(const m of M)if(m.st!==L.st)items.push(["sl",m.r,m.c,L.r,L.c])}else if(M.length>1)for(const [a,b] of fgTree(M))items.push(["sq",a.r,a.c,b.r,b.c])}}
  if(!items.length){if(old)old.remove();fgSig="";return}
  const sig=JSON.stringify([items,B.offsetWidth,B.offsetHeight]);if(old&&sig===fgSig)return;fgSig=sig;
  const at=(r,c)=>{const t=B.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`);if(!t)return null;let x=0,y=0,e=t;while(e&&e!==B){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent}
    if(e!==B){const R=t.getBoundingClientRect(),Q=B.getBoundingClientRect();x=R.left-Q.left;y=R.top-Q.top}return {x:x+t.offsetWidth/2,y:y+t.offsetHeight/2,s:Math.min(t.offsetWidth,t.offsetHeight)}};
  const f=v=>v.toFixed(1);let out="";
  const line=(cls,a,b,arrow)=>{const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);if(L<a.s*.6)return "";const ux=dx/L,uy=dy/L,x1=a.x+ux*a.s*.3,y1=a.y+uy*a.s*.3,x2=b.x-ux*b.s*(arrow?.46:.3),y2=b.y-uy*b.s*(arrow?.46:.3);
    return `<line class="fgu ${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/><line class="fgl ${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"${arrow?` marker-end="url(#${arrow})"`:""}/>`};
  for(const it of items){const a=at(it[1],it[2]);if(!a)continue;
    if(it[0]==="ar"||it[0]==="dr"){const n=at(it[1],it[2]+1)||at(it[1],it[2]-1),pitch=n?Math.abs(n.x-a.x):a.s*1.08,dc=it[0]==="dr"?" def":"";
      out+=`<circle class="fgc${dc}" cx="${f(a.x)}" cy="${f(a.y)}" r="${f(pitch*(it[3]+.5))}"/><circle class="fgcd${dc}" cx="${f(a.x)}" cy="${f(a.y)}" r="${f(a.s*.46)}"/>`;
      continue}
    const b=at(it[3],it[4]);if(!b)continue;
    out+=it[0]==="gd"?line("gd",a,b,"fgag"):it[0]==="al"?line("al",a,b,null):it[0]==="dl"?line("al def",a,b,null):it[0]==="at"?line("at",a,b,"fgar"):it[0]==="sl"?line("sq",a,b,"fgab"):line("sq",a,b,null)}
  const mk=(id,col)=>`<marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto" markerUnits="strokeWidth"><path d="M0,0L10,5L0,10L2.5,5z" fill="${col}"/></marker>`;
  const svg=`<svg class="fagroups" aria-hidden="true" width="${B.scrollWidth}" height="${B.scrollHeight}"><defs>${mk("fgag","#52d685")}${mk("fgab","#6aaeff")}${mk("fgar","#ff4b45")}</defs>${out}</svg>`;
  if(old)old.remove();B.insertAdjacentHTML("beforeend",svg)}
{const _r=render;render=function(){rSafe(_r,this,arguments);try{fgSVG()}catch(e){console.error(e)}}}

if(window.__EC)Object.assign(window.__EC,{fgFoe:(pl,r)=>fgFoe(pl,r),fgDo:(...a)=>fgDo(...a),fgGid:(pl,st)=>fgGid(pl,st),fgMembers:(pl,g)=>fgMembers(pl,g),fgFind:(pl,r)=>fgFind(pl,r),FG,fgSVG:()=>fgSVG()});
