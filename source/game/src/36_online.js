/* ---------------- Online play (v36) ----------------
   One player hosts: their browser runs the game. The others join with a room code; their browsers show the game as the host sends
   it, from their own seat, and send back what they do. Nothing has to be installed and no account is needed: the connection is made
   through the free PeerJS service, then runs directly between the browsers. (A room code starting with LOCAL connects tabs of the
   same browser instead, for trying it alone.)
   The host's setup is the usual one: each seat can be the host, a player who joined, or a computer. Online, play is always turn by
   turn and there is no phase timer. A player who leaves is replaced by a computer. */

const NET={role:null,code:null,name:"",seat:null,hostSeat:null,guests:{},ctx:null,pend:{},askN:0,rid:0,rets:{},sent:{},tr:null,queue:Promise.resolve()};
const netOn=()=>!!NET.role&&NET.role!=="lobby";
const PEER_SRC="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
const CODE_CH="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode=()=>Array.from({length:5},()=>CODE_CH[Math.floor(Math.random()*CODE_CH.length)]).join("");
function loadPeer(){if(window.Peer)return Promise.resolve();return new Promise((res,rej)=>{const s=document.createElement("script");s.src=PEER_SRC;s.onload=()=>res();s.onerror=()=>rej(new Error("The online library couldn't be loaded. Check the connection."));document.head.appendChild(s)})}

/* ---------- the connection: PeerJS between devices, or a BroadcastChannel between tabs ---------- */
function transport(code,isHost,on){
  const local=/^LOCAL/i.test(code),me=isHost?"host":"g"+Math.random().toString(36).slice(2,9);const T={me,close(){}};
  if(local){const bc=new BroadcastChannel("ec-net-"+code.toUpperCase());
    bc.onmessage=e=>{const m=e.data;if(!m||m.to!==me&&m.to!=="*")return;on(m.from,m.d)};
    T.send=(to,d)=>bc.postMessage({from:me,to,d:JSON.parse(JSON.stringify(d))});T.close=()=>{try{bc.postMessage({from:me,to:isHost?"*":"host",d:{t:"bye"}})}catch(e){}bc.close()};
    return Promise.resolve(T)}
  return loadPeer().then(()=>new Promise((res,rej)=>{
    const conns={};const peer=isHost?new window.Peer("ec-"+code.toUpperCase()):new window.Peer();
    const wire=c=>{c.on("data",raw=>{let d=raw;try{if(typeof raw==="string")d=JSON.parse(raw)}catch(e){return}on(c.peer,d)});c.on("close",()=>{delete conns[c.peer];on(c.peer,{t:"bye"})});c.on("error",()=>{})};
    peer.on("error",e=>{if(!T.ready)rej(new Error(e.type==="unavailable-id"?"That room code is taken. Try again.":e.type==="peer-unavailable"?"No room with that code.":"The connection failed ("+e.type+")."));else on(isHost?"?":"host",{t:"neterr",msg:e.type})});
    peer.on("open",()=>{
      if(isHost){T.ready=true;T.me="host";peer.on("connection",c=>{conns[c.peer]=c;wire(c)});res(T)}
      else{const c=peer.connect("ec-"+code.toUpperCase(),{reliable:true});conns.host=c;c.on("open",()=>{T.ready=true;res(T)});c.on("data",raw=>{let d=raw;try{if(typeof raw==="string")d=JSON.parse(raw)}catch(e){return}on("host",d)});c.on("close",()=>on("host",{t:"bye"}));setTimeout(()=>{if(!T.ready)rej(new Error("No room with that code answered."))},12000)}});
    T.send=(to,d)=>{const c=conns[to];if(c&&c.open)c.send(JSON.stringify(d))};
    T.close=()=>{try{peer.destroy()}catch(e){}}}))}
const sendTo=(id,d)=>{if(NET.tr)NET.tr.send(id,d)};
const sendHost=d=>sendTo("host",d);
const guestIds=()=>Object.keys(NET.guests);

/* ---------- the selection on each screen is its own ---------- */
function uiSnap(){if(!G)return{};return{sel:G.sel?{r:G.sel.r,c:G.sel.c,pick:[...(G.sel.pick||[])]}:null,selHand:G.selHand?G.selHand.id:null,mode:G.mode||null,faceDown:!!G.faceDown,libPick:G.libPick?[...G.libPick]:null}}
function applyUI(u){if(!G||!u)return;G.sel=u.sel&&G.board[u.sel.r]&&G.board[u.sel.r][u.sel.c]?{r:u.sel.r,c:u.sel.c,pick:new Set(u.sel.pick)}:null;
  G.selHand=u.selHand!=null?cardById(u.selHand):null;G.mode=u.mode||null;G.faceDown=!!u.faceDown;G.libPick=u.libPick?new Set(u.libPick):null}

/* ---------- small actions that used to live inside buttons ---------- */
function ambushToggle(r,c){const st=G.board[r]&&G.board[r][c];if(!st)return;st.ambush=!st.ambush;log(st.ambush?`${plName(st.owner)} sets a stack in ambush.`:`${plName(st.owner)} leaves the ambush.`,"ai")}
function libDone(){if(G.libation==="armed")G.libation=false;G.libPick=null}   // cancelling before any Pour gives the free spell back
function setCredit(pl,v){const P=G.p[pl];P.credit=!!v;log(`${plName(pl)} ${P.credit?"opens":"closes"} a line of credit at the Bank.`)}
function setAutoBless(pl,v){G.p[pl].autoBless=!!v}

/* ---------- what a joined player's clicks send to the host ---------- */
const netClean=v=>JSON.parse(JSON.stringify(v===undefined?null:v,(k,x)=>x instanceof Event||typeof Node!=="undefined"&&x instanceof Node||typeof x==="function"?undefined:x))||[];
const cid=c=>c&&c.id!=null?{cid:c.id}:c;
const uncid=v=>v&&typeof v==="object"&&v.cid!=null?cardById(v.cid):v;
const NETFN={
 placeOpening:{get:()=>placeOpening,set:f=>placeOpening=f},
 place:{get:()=>place,set:f=>place=f,map:a=>[cid(a[0]),a[1],a[2]],un:a=>[uncid(a[0]),a[1],a[2]]},
 doMove:{get:()=>doMove,set:f=>doMove=f},
 attack:{get:()=>attack,set:f=>attack=f},
 attackMoon:{get:()=>attackMoon,set:f=>attackMoon=f},
 nextPhase:{get:()=>nextPhase,set:f=>nextPhase=f,async:true},
 rollDraw:{get:()=>rollDraw,set:f=>rollDraw=f},
 cast:{get:()=>cast,set:f=>cast=f,async:true,map:a=>[a[0]&&a[0].id],un:a=>[SP(a[0])]},
 sacrifice:{get:()=>sacrifice,set:f=>sacrifice=f,map:a=>[cid(a[0]),a[1]],un:a=>[uncid(a[0]),a[1]]},
 sacrificeToSun:{get:()=>sacrificeToSun,set:f=>sacrificeToSun=f,map:a=>[cid(a[0]),a[1]],un:a=>[uncid(a[0]),a[1]]},
 healAct:{get:()=>healAct,set:f=>healAct=f,map:a=>[a[0],a[1],a[2].x.id],un:a=>{const st=G.board[a[0]][a[1]];return [a[0],a[1],st?healTargets(st,a[0],a[1]).find(t=>t.x.id===a[2]):null]}},
 repairAct:{get:()=>repairAct,set:f=>repairAct=f,map:a=>[a[0],a[1],a[2].b.id,a[2].act],un:a=>{const st=G.board[a[0]][a[1]];return [a[0],a[1],st?repairTargets(st,a[0],a[1]).find(t=>t.b.id===a[2]&&t.act===a[3]):null]}},
 release:{get:()=>release,set:f=>release=f},
 pourLibation:{get:()=>pourLibation,set:f=>pourLibation=f,map:a=>[a[0],a[1],[...(a[2]||[])]],un:a=>[a[0],a[1],new Set(a[2])]},
 takeLoan:{get:()=>takeLoan,set:f=>takeLoan=f},
 repay:{get:()=>repay,set:f=>repay=f},
 sellCards:{get:()=>sellCards,set:f=>sellCards=f,map:a=>[a[0],a[1].map(c=>c.id)],un:a=>[a[0],a[1].map(cardById).filter(Boolean)]},
 sellThrall:{get:()=>sellThrall,set:f=>sellThrall=f},
 askLoan:{get:()=>askLoan,set:f=>askLoan=f,any:true},
 answerLoan:{get:()=>answerLoan,set:f=>answerLoan=f,any:true,map:a=>[a[0].id,a[1],a[2]],un:a=>[p2pOf().find(x=>x.id===a[0]),a[1],a[2]]},
 repayLoan:{get:()=>repayLoan,set:f=>repayLoan=f,any:true,map:a=>[a[0].id,a[1]],un:a=>[p2pOf().find(x=>x.id===a[0]),a[1]]},
 buyPlot:{get:()=>buyPlot,set:f=>buyPlot=f,map:a=>[a[0],a[1].i],un:a=>[a[0],plotsOf()[a[1]]]},
 sellPlot:{get:()=>sellPlot,set:f=>sellPlot=f,map:a=>[a[0],a[1].i],un:a=>[a[0],plotsOf()[a[1]]]},
 plantMiner:{get:()=>plantMiner,set:f=>plantMiner=f,map:a=>[a[0],a[1].i],un:a=>[a[0],plotsOf()[a[1]]]},
 mysteryBuy:{get:()=>mysteryBuy,set:f=>mysteryBuy=f,ret:true},
 buyBankItem:{get:()=>buyBankItem,set:f=>buyBankItem=f,async:true,map:a=>[a[0],(G.auction||[]).indexOf(a[1])],un:a=>[a[0],G.auction[a[1]]]},
 makeOffer:{get:()=>makeOffer,set:f=>makeOffer=f,async:true,map:a=>[(G.auction||[]).indexOf(a[0]),a[1]||null],un:a=>[G.auction[a[0]],a[1]||undefined]},
 tradeCard:{get:()=>tradeCard,set:f=>tradeCard=f,async:true},
 toggleOath:{get:()=>toggleOath,set:f=>toggleOath=f},
 endAim:{get:()=>endAim,set:f=>endAim=f,aim:true},
 tileClick:{get:()=>tileClick,set:f=>tileClick=f,aim:true,only:()=>!!(G&&G.aim)},   // a tile is only sent while aiming
 setCredit:{get:()=>setCredit,set:f=>setCredit=f,any:true},
 setAutoBless:{get:()=>setAutoBless,set:f=>setAutoBless=f,any:true},
 setFieldAuto:{get:()=>setFieldAuto,set:f=>setFieldAuto=f,any:true},
 ambushToggle:{get:()=>ambushToggle,set:f=>ambushToggle=f},
 libDone:{get:()=>libDone,set:f=>libDone=f}};
for(const [name,F] of Object.entries(NETFN)){const orig=F.get();
  F.set(function(...a){
    if(NET.role!=="guest")return orig.apply(this,a);
    if(F.only&&!F.only())return orig.apply(this,a);
    const rid=++NET.rid;a=a.filter(x=>!(x instanceof Event));sendHost({t:"cmd",fn:name,args:netClean(F.map?F.map(a):a),ui:uiSnap(),rid});
    if(F.ret)return new Promise(res=>{NET.rets[rid]=res;setTimeout(()=>{if(NET.rets[rid]){delete NET.rets[rid];res(null)}},15000)});
    return F.async?Promise.resolve():undefined})}
/* v78h: an action any player may take at any time, played by the host: online, a joined player's call is sent there.
   The later parts of the game register theirs with this (it was the same five lines in each of them). */
function netAny(name,get,set){NETFN[name]={get,set,any:true};const orig=get();
  set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}

/* ---------- the host runs what a joined player sends ---------- */
const seatOfGuest=id=>{if(!G)return null;const i=G.p.findIndex(P=>P.net===id);return i<0?null:i};
/* v78i: before a joined player's call runs, the host checks it acts for their own seat, with their own cards and stacks, and
   that a placing, move or attack is one their screen could have offered (the same tests its buttons use). Calls not listed
   here check the seat themselves (NET.ctx). */
const netMine=(s,r,c)=>{const st=G.board[r]&&G.board[r][c];return !!st&&st.owner===s};
const netAt=(list,r,c)=>list.some(([a,b])=>a===r&&b===c);
const netHas=(s,card,from)=>!!card&&(from==="hand"?G.p[s].hand.includes(card):!!from&&netMine(s,from.r,from.c)&&G.board[from.r][from.c].cards.includes(card));
const NET_OK={
  placeOpening:(s,a)=>a[0]===s&&G.phase==="setup"&&G.setupStep==="ace"&&netAt(zoneTiles(s),a[1],a[2])&&!G.board[a[1]][a[2]],
  place:(s,a)=>(G.p[s].hand.includes(a[0])||G.placing===a[0])&&canPlace(a[0],a[1],a[2]),   // G.placing: a card being put out from elsewhere (a Slave)
  doMove:(s,a)=>!!G.sel&&netMine(s,G.sel.r,G.sel.c)&&netAt(moveTargets(),a[0],a[1]),
  attack:(s,a)=>netMine(s,a[0],a[1])&&netAt([...attackOptions(a[0],a[1]),...blindOptions(a[0],a[1])].map(o=>[o.r,o.c]),a[2],a[3]),
  sacrifice:(s,a)=>netHas(s,a[0],a[1]),sacrificeToSun:(s,a)=>netHas(s,a[0],a[1]),
  sellCards:(s,a)=>a[0]===s&&a[1].every(c=>G.p[s].hand.includes(c)),
  answerLoan:(s,a)=>a[0].to===s,repayLoan:(s,a)=>a[0].from===s,forgiveLoan:(s,a)=>!!a[0]&&a[0].to===s,
  endAim:(s,a)=>a[0]==null};   // a tile is chosen through tileClick, which checks it; endAim itself only cancels
for(const fn of ["attackMoon","healAct","repairAct","release","pourLibation","ambushToggle"])NET_OK[fn]=(s,a)=>netMine(s,a[0],a[1]);
for(const fn of ["takeLoan","repay","sellThrall","buyPlot","sellPlot","plantMiner","mysteryBuy","buyBankItem","tradeCard","setCredit","setAutoBless","askLoan","giftMana","giftCard",
  "payDebtFor","acceptBounty","buyBountyColl","turnInCapt","setCheat","cheatEvent","setFaLock","setAutoCfg","moonPlant","buyLand"])NET_OK[fn]=(s,a)=>a[0]===s;
async function runCmd(id,m){
  const seat=seatOfGuest(id),F=Object.prototype.hasOwnProperty.call(NETFN,m.fn)&&NETFN[m.fn];if(seat==null||!F||!G||G.over)return;
  const P=G.p[seat];if(P.out||P.cpu)return;
  const aiming=G.aim&&G.aim.pl===seat;
  if(F.aim){if(!aiming)return}else if(!F.any&&!(G.active===seat&&!G.busy))return;
  let args;try{args=F.un?F.un(Array.isArray(m.args)?m.args:[]):m.args||[]}catch(e){return}   // v78i: a call that doesn't read is dropped
  if(!Array.isArray(args))return;
  if(args.some(x=>x===undefined||x===null)&&["place","sacrifice","sacrificeToSun","healAct","repairAct","answerLoan","repayLoan","buyPlot","sellPlot","plantMiner","buyBankItem","makeOffer","cast","forgiveLoan"].includes(m.fn))return;
  const host=uiSnap();NET.ctx=seat;let ret;
  try{applyUI(m.ui);const ok=NET_OK[m.fn];if(!ok||ok(seat,args))ret=await F.get().apply(null,args);else if(!F.any)flash("That can't be done now.")}catch(e){console.error(e)}
  finally{const u=uiSnap();if(NET.ctx===seat)NET.ctx=null;applyUI(host);sendTo(id,{t:"ui",ui:u});render()}
  if(F.ret)sendTo(id,{t:"ret",rid:m.rid,v:ret==null?null:JSON.parse(JSON.stringify(ret,netRep))})}
/* while a joined player's action runs, it is that player who can act */
{const _ca=canAct;canAct=function(){if(NET.ctx!=null)return !!G&&!G.over&&!G.p[NET.ctx].out&&G.active===NET.ctx;return _ca()}}
document.addEventListener("click",e=>{if(NET.ctx==null||NET.role!=="host")return;if(e.target.closest&&e.target.closest("#ov,#pop,#notes,#cinfo,#menu,.xclose"))return;e.stopPropagation();e.preventDefault()},true);

/* ---------- questions for a joined player go to their screen ---------- */
const netRep=function(k,v){if(typeof v==="function")return undefined;if(v instanceof Set)return{__set:[...v]};return v};
const netRev=(k,v)=>v&&typeof v==="object"&&Array.isArray(v.__set)?new Set(v.__set):v;
{const _ask=ask;ask=function(pl,spec){
  if(NET.role==="host"&&G&&G.p[pl]&&G.p[pl].net&&!G.p[pl].cpu){const id=++NET.askN,to=G.p[pl].net;flushSnap();
    return new Promise(res=>{NET.pend[id]={res,pl,spec};sendTo(to,{t:"ask",id,pl,spec:JSON.parse(JSON.stringify(spec,netRep))})})}
  return _ask(pl,spec)}}
/* popups and notes go to everyone; a joined player's own warnings go to them */
{const _p=popup;popup=function(title,html,pl){_p(title,html,pl);if(NET.role==="host"&&G&&!G.opts.fast)for(const id of guestIds())sendTo(id,{t:"pop",title,html,pl})}}
{const _n=notify;notify=function(pl,html){_n(pl,html);if(NET.role==="host"&&G&&!G.opts.fast)for(const id of guestIds())sendTo(id,{t:"note",pl,html})}}
{const _f=flash;flash=function(t){if(NET.role==="host"&&NET.ctx!=null&&G&&G.p[NET.ctx]&&G.p[NET.ctx].net){sendTo(G.p[NET.ctx].net,{t:"flash",text:t});return}_f(t)}}
/* every log line gets a number, so only new lines travel */
{const _l=log;log=function(html,cls){_l(html,cls);if(G&&G.log[0])G.log[0].n=G.logN=(G.logN||0)+1}}

/* ---------- the host sends the game to each joined player ---------- */
const SNAP_SKIP_TOP=new Set(["journal","_vis","waiter","setupResolve","log","sel","selHand","mode","comparePick","faceDown","libPick","aim","shopT"]);
function snapshot(full){
  const aim=G.aim?{title:G.aim.title,pl:G.aim.pl,tiles:(()=>{const t=[];if(G.aim.valid)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){try{if(G.aim.valid(r,c))t.push([r,c])}catch(e){}}return t})()}:null;
  const g=JSON.stringify(G,function(k,v){if(this===G&&SNAP_SKIP_TOP.has(k))return undefined;if(k==="art"&&this===G.map)return undefined;if(k==="ground"&&this===G.map&&!full)return undefined;
    if(typeof v==="function")return undefined;if(v instanceof Set)return{__set:[...v]};if(k==="hist"&&Array.isArray(v))return v.slice(-40);return v});
  return{g,aim}}
let snapT=null;
function flushSnap(){clearTimeout(snapT);snapT=null;if(NET.role!=="host"||!G||!G.opts.online)return;let base=null;
  for(const id of guestIds()){const st=NET.sent[id]||(NET.sent[id]={n:0,full:false});const full=!st.full;if(!base||full)base=snapshot(full);
    const lines=G.log.filter(l=>!full?(l.n||0)>st.n:true);
    sendTo(id,{t:"snap",full,g:base.g,aim:base.aim,log:lines.slice(0,full?600:200)});st.full=true;st.n=G.logN||0}}
{const _rd=render;render=function(){rSafe(_rd,this,arguments);if(NET.role==="host"&&G&&G.opts.online&&!snapT)snapT=setTimeout(flushSnap,60)}}

/* ---------- a joined player's screen ---------- */
function applySnap(m){
  const ui=NET.pendUI||(G?uiSnap():{}),old=G;NET.pendUI=null;let g;try{g=JSON.parse(m.g,netRev)}catch(e){console.error(e);return}
  if(!m.full&&old&&old.map&&g.map)g.map.ground=old.map.ground;
  if(g.map)g.map.art=old&&old.map&&old.map.seed===g.map.seed&&old.map.art?old.map.art:{};
  g.log=m.full?m.log:[...m.log,...(old&&old.log?old.log:[])].slice(0,600);
  g.journal=[];g.aim=m.aim;g.passing=false;G=g;COLS=g.board&&g.board[0]?g.board[0].length:(g.map&&g.map.cols)||COLS;applyUI(ui);
  if(!NET.started){NET.started=true;ovHide();applyMoonTheme()}
  render();
  if(g.over&&!(old&&old.over)){const w=g.log.find(l=>l.cls==="win"),txt=w?w.html:"The game is over.";
    ovShow(`<div class="ovbox"><h2>The game is over</h2><p>${txt}</p><p class="acts"><button class="btn" id="netAgain">Back to the room</button></p></div>`);$("#netAgain").onclick=()=>onlineLobby()}}
{const _v=view;view=function(){if(NET.role==="guest"&&NET.seat!=null&&G)return NET.seat;if(NET.role==="host"&&NET.hostSeat!=null&&G&&G.opts.online)return NET.hostSeat;return _v()}}
{const _ps=passScreen;passScreen=function(msg){if(G&&G.opts.online){if(NET.role==="host"&&typeof localSeats==="function"&&localSeats().length>1&&localSeats().includes(G.active))return _ps.apply(this,arguments);return Promise.resolve()}return _ps.apply(this,arguments)}}

/* ---------- messages ---------- */
function onNet(from,d){if(!d||!d.t)return;
  if(NET.role==="guest"){
    if(d.t==="welcome"){NET.hostName=d.host;lobbyMsg(`Connected to ${esc(d.host)}'s room. Waiting for the host to start the game.`)}
    else if(d.t==="start"){NET.seat=d.seat;NET.started=false;lobbyMsg(`The game is starting. You are seat P${d.seat+1}.`)}
    else if(d.t==="seatless")lobbyMsg("The host started the game without a seat for you. You can wait for the next one, or leave.");
    else if(d.t==="snap")applySnap(d);
    else if(d.t==="ui"){NET.pendUI=d.ui;applyUI(d.ui);render()}
    else if(d.t==="ret"){const f=NET.rets[d.rid];if(f){delete NET.rets[d.rid];f(d.v)}}
    else if(d.t==="ask"){(async()=>{const v=await askHuman(d.pl,JSON.parse(JSON.stringify(d.spec),netRev));sendHost({t:"ans",id:d.id,v})})()}
    else if(d.t==="pop")popup(d.title,d.html,d.pl);
    else if(d.t==="note")notify(d.pl,d.html);
    else if(d.t==="flash")flash(d.text);
    else if(d.t==="bye"){if(G)G.over=true;ovShow(`<div class="ovbox"><h2>The host left</h2><p>The room is closed.</p><p class="acts"><button class="btn" id="netOk">Back to the menu</button></p></div>`);$("#netOk").onclick=()=>{netLeave();startMode=null;showStart()}}
    return}
  if(NET.role==="host"||NET.role==="lobby-host"){
    if(d.t==="hello"){NET.guests[from]={name:String(d.name||"Guest").slice(0,20)};sendTo(from,{t:"welcome",host:NET.name});lobbyRoster();
      if(G&&G.opts.online&&!G.over)sendTo(from,{t:"seatless"})}
    else if(d.t==="cmd"){NET.queue=NET.queue.then(()=>runCmd(from,d)).catch(e=>console.error(e))}
    else if(d.t==="ans"){const p=NET.pend[d.id];if(p){delete NET.pend[d.id];p.res(d.v)}}
    else if(d.t==="bye")guestLeft(from)}}
function guestLeft(id){delete NET.guests[id];delete NET.sent[id];lobbyRoster();if(!G||!G.opts.online||G.over)return;
  const seat=seatOfGuest(id);if(seat==null)return;const P=G.p[seat];P.cpu="medium";P.net=null;
  log(`<b>${plName(seat)} left the game.</b> A computer (Medium) plays the seat from here.`,"event");popup("A player left",`<p>${esc(P.name)} left the room. A computer plays their seat from now on.</p>`);
  for(const [k,p] of Object.entries(NET.pend))if(p.pl===seat){delete NET.pend[k];p.res(p.spec&&p.spec.ai?p.spec.ai():AI.choose(seat,p.spec))}
  if(G.active===seat&&G.waiter){const f=G.waiter;G.waiter=null;f()}
  // v78i: gone while setting up: the computer finishes their setup (online there is no setup timer to do it)
  if(G.phase==="setup"&&G.active===seat&&G.setupResolve){const f=G.setupResolve;G.setupResolve=null;stopTimer();G.busy=true;
    AI.setup(seat).then(()=>{G.busy=false;f();render()})}
  render()}
function netLeave(){try{if(NET.tr)NET.tr.close()}catch(e){}Object.assign(NET,{role:null,tr:null,guests:{},seat:null,hostSeat:null,sent:{},pend:{},started:false})}
addEventListener("beforeunload",()=>{try{if(NET.tr)NET.tr.close()}catch(e){}});

/* ---------- the lobby ---------- */
MODES.push(["online","Online","Play with friends on their own devices. One of you hosts and shares a room code; the others join with it. Seats can also be computers."]);
function lobbyMsg(t){const e=$("#onMsg");if(e)e.innerHTML=t}
function lobbyRoster(){const e=$("#onRoster");if(!e)return;const g=Object.values(NET.guests).map(x=>esc(x.name));
  e.innerHTML=`<b>In the room:</b> ${esc(NET.name)} (you, the host)${g.length?", "+g.join(", "):""}.${g.length?"":" Share the code and wait for the others to join."}`}
function onlineLobby(){
  const nm=esc(PREF.netName||"");
  if(NET.role==="guest"){ovShow(`<div class="ovbox setup online"><div class="shead"><h2>Online</h2></div><div class="onl"><p id="onMsg">${NET.hostName?`Connected to ${esc(NET.hostName)}'s room. Waiting for the host to start the game.`:"Connecting…"}</p></div><p class="acts sfoot"><button class="btn ghost" id="onLeave">Leave the room</button></p></div>`);
    $("#onLeave").onclick=()=>{netLeave();startMode=null;showStart()};return}
  if(NET.role==="lobby-host"||NET.role==="host"){ovShow(`<div class="ovbox setup online"><div class="shead"><h2>Online · your room</h2><p class="dim">Give this code to the others. They choose Online, then Join, and type it in.</p></div>
<div class="onl"><p class="roomcode">${esc(NET.code)}</p><p><button class="btn ghost sm" id="onCopy">Copy the code</button></p><p id="onRoster"></p><p id="onMsg" class="dim">When everyone is in, set up the game: each seat can be you, a player in the room, or a computer.</p></div>
<p class="acts sfoot"><button class="btn" id="onSetup">Set up the game →</button> <button class="btn ghost" id="onClose">Close the room</button></p></div>`);
    lobbyRoster();$("#onCopy").onclick=()=>{try{navigator.clipboard.writeText(NET.code);flash("Copied.")}catch(e){}};$("#onSetup").onclick=()=>{NET.role="lobby-host";startMode="local";NET.inSetup=true;showStart()};
    $("#onClose").onclick=()=>{netLeave();startMode=null;showStart()};return}
  ovShow(`<div class="ovbox setup online"><div class="shead"><h2>Online</h2><p class="dim">One of you hosts: the game runs in the host's browser, and the others join with a room code. No account, nothing to install.</p></div>
<div class="onl"><label class="f">Your name <input id="onName" maxlength="20" value="${nm}" placeholder="Name"></label>
<fieldset class="pf"><legend>Host a game</legend><p class="dim">Opens a room and gives you a code to share.</p><button class="btn" id="onHost">Open a room</button></fieldset>
<fieldset class="pf"><legend>Join a game</legend><label class="f">Room code <input id="onCode" maxlength="12" placeholder="ABCDE" autocapitalize="characters"></label> <button class="btn" id="onJoin">Join</button></fieldset>
<p id="onMsg" class="dim"></p></div>
<p class="acts sfoot"><button class="btn ghost" id="back">← Other modes</button></p></div>`);
  const name=()=>{const v=($("#onName").value||"").trim().slice(0,20)||"Player";PREF.netName=v;savePrefs();return v};
  $("#back").onclick=()=>{startMode=null;showStart()};
  $("#onHost").onclick=async()=>{const n=name();const code=(($("#onCode").value||"").trim().toUpperCase().startsWith("LOCAL")?$("#onCode").value.trim().toUpperCase():newCode());lobbyMsg("Opening a room…");
    try{NET.tr=await transport(code,true,onNet);Object.assign(NET,{role:"lobby-host",code,name:n,guests:{}});onlineLobby()}catch(e){lobbyMsg(esc(e.message))}};
  $("#onJoin").onclick=async()=>{const n=name(),code=($("#onCode").value||"").trim().toUpperCase();if(!code){lobbyMsg("Type the room code first.");return}lobbyMsg("Connecting…");
    try{NET.tr=await transport(code,false,onNet);Object.assign(NET,{role:"guest",code,name:n});sendHost({t:"hello",name:n,token:NET.token||undefined});onlineLobby()}catch(e){lobbyMsg(esc(e.message))}}}
{const _ss=showStart;showStart=function(){
  if(NET.role==="host"&&(!G||G.over)){NET.role="lobby-host";startMode="online"}
  if(startMode==="online"||NET.role==="guest"){if(NET.role==="guest"&&G&&!G.over)return;return onlineLobby()}
  if(startMode!=="local"&&NET.inSetup){NET.inSetup=false}
  return _ss()}}
/* the host's setup: each seat can be the host, someone in the room, or a computer */
{const _sf=seatForm;seatForm=function(i,S,mode,L,taken){
  if(!(NET.role==="lobby-host"&&NET.inSetup))return _sf(i,S,mode,L,taken);
  const gs=guestIds();
  if(S.type==="human"&&i>0){const used=new Set();S.type=gs.find(id=>!used.has(id))?"net:"+gs[(i-1)%Math.max(1,gs.length)]:"medium";if(!gs.length)S.type="medium"}
  if(S.type&&S.type.startsWith("net:")&&!NET.guests[S.type.slice(4)])S.type="medium";
  let h=_sf(i,S,"local",L,taken);
  const opts=`<option value="human" ${S.type==="human"?"selected":""}>You (the host)</option>`+gs.map(id=>`<option value="net:${id}" ${S.type==="net:"+id?"selected":""}>Online · ${esc(NET.guests[id].name)}</option>`).join("");
  h=h.replace(/<option value="human"[^>]*>Human<\/option>/,opts);
  if(i===0&&S.type==="human")h=h.replace(/<span class="dim">Human<\/span>/,`<span class="dim">You (the host)</span>`);
  return h}}
{const _sg=startGame;startGame=function(opts){
  if(!(NET.role==="lobby-host"&&NET.inSetup&&opts&&!opts.fast))return _sg(opts);
  const ps=opts.players,nets=ps.filter(p=>p.cpu&&String(p.cpu).startsWith("net:")).map(p=>p.cpu.slice(4));
  if(new Set(nets).size<nets.length){flash("Each player in the room can only take one seat.");return}
  for(const p of ps)if(p.cpu&&String(p.cpu).startsWith("net:")){p.net=p.cpu.slice(4);p.cpu=null}
  Object.assign(opts,{online:true,timer:0,turns:"classic",mode:"local"});
  NET.role="host";NET.inSetup=false;NET.sent={};NET.hostSeat=ps.findIndex(p=>p.cpu==null&&!p.net);if(NET.hostSeat<0)NET.hostSeat=0;
  const out=_sg(opts);
  G.p.forEach((P,i)=>{if(ps[i]&&ps[i].net)P.net=ps[i].net});
  flushSnap();return out}}
/* online, the joined players' own buttons that change only their screen keep working; the Bank's answers wait for your turn */
{const _ob=openBank;openBank=function(){_ob();if(netOn()&&G&&G.active!==view())$("#ov").querySelectorAll("[data-lend],[data-nolend]").forEach(b=>b.disabled=true)}}

if(window.__EC)Object.assign(window.__EC,{NET,netLeave,flushSnap,onlineLobby,applySnap,snapshot,ask:(...a)=>ask(...a)});
