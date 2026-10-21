/* ---------------- Online play, part 2 (v37) ----------------
   Every screen sees the same animations and hears the same sounds: the host sends each one as it happens (where, who, what), and a
   joined player's screen plays it from their own seat (the fog still hides what it hides).
   A player who drops comes back to their own seat: reconnecting is automatic for a while, and reloading the page and joining the
   same room again works too. The host's device can have more than one player on it (they pass it, as in a local game).
   Someone who joins without a seat, or after the start, watches. And a chat for everyone in the room. */

/* ---------- the host tells every screen what to show and play ---------- */
function netFX(e){if(NET.role!=="host"||!G||!G.opts.online||G.opts.fast)return;const ids=guestIds();if(!ids.length)return;for(const id of ids)if(!netQuiet(id)&&fxSeen(e,id))sendTo(id,{t:"fx",e})}   // v71j: none for a poor connection; v71l: none they couldn't see
const hostOnline=()=>NET.role==="host"&&G&&G.opts.online&&guestIds().length>0;
{const _pl=place;place=function(card,r,c){const pl=card&&card.owner;const out=_pl.apply(this,arguments);if(hostOnline())netFX({k:"place",r,c,pl});return out}}
{const _dm=doMove;doMove=function(r,c){const s=G.sel,st=s&&G.board[s.r]&&G.board[s.r][s.c],pl=st?st.owner:null;const out=_dm.apply(this,arguments);if(hostOnline()&&s)netFX({k:"move",a:[s.r,s.c],b:[r,c],pl});return out}}
{const _at=attack;attack=function(r1,c1,r2,c2,mode){const A=G.board[r1]&&G.board[r1][c1];
  if(hostOnline()&&A){const o=attackOptions(r1,c1).find(x=>x.r===r2&&x.c===c2&&(mode==null||x.mode===mode))||{},id=o.mode||mode;
    const snd=id==="slug"?"slug":id==="gun"?"gun":id==="bow"?"arrow":id==="cannon"||hasK(A,"cannon")&&o.ranged?"cannon":id==="charge"||id==="charge2"?"charge":id==="ram"?"blunt":o.ranged?"arrow":"clash";
    const kind=mode==="ram"||hasK(A,"cannon")&&o.ranged?"boom":hasK(A,"debt")||isNPC(A.owner)&&G.p[A.owner].npc==="bank"?"dollar":o.ranged?null:"blunt";
    netFX({k:"strike",a:[r1,c1],b:[r2,c2],pl:A.owner,kind,snd})}
  return _at.apply(this,arguments)}}
{const _bs=blindShot;blindShot=function(r1,c1,r2,c2,o){const A=G.board[r1]&&G.board[r1][c1],pl=A?A.owner:null;const out=_bs.apply(this,arguments);if(hostOnline()&&out&&out.win)netFX({k:"fogHit",pl});return out}}
{const _dg=damage;damage=function(r,c,n,d){const out=_dg.apply(this,arguments);if(hostOnline()&&n>0&&out!==0)netFX({k:"hit",r,c});return out}}
{const _bu=bury;bury=function(card,r,c,st){const pl=st&&st.owner;const out=_bu.apply(this,arguments);if(hostOnline())netFX({k:"death",r,c,pl});return out}}
{const _sc=sacrifice;sacrifice=function(card,from){const pl=G.active,m0=effMana(pl);const ok=_sc.apply(this,arguments);
  if(ok&&hostOnline())netFX({k:"sac",pl,from:from==="hand"?"hand":from&&from.r!=null?[from.r,from.c]:null,got:Math.max(0,effMana(pl)-m0)});return ok}}
{const _js=jokerSuicide;jokerSuicide=async function(r,c,st,pl){if(hostOnline())netFX({k:"suicide",r,c,pl});return _js.apply(this,arguments)}}
{const _sh=shuffle;shuffle=function(a){const out=_sh(a);if(G&&hostOnline()){if(a===G.grave)netFX({k:"shuffle",pl:-1});else{const P=G.p.find(Q=>Q.deck===a);if(P&&!isHorde(P.i))netFX({k:"shuffle",pl:P.i})}}return out}}
{const _ss=skyStrike;skyStrike=function(r,c,why){if(hostOnline())netFX({k:"meteor",r,c});return _ss.apply(this,arguments)}}
{const _pg=pickGrave;pickGrave=async function(pl,n,title){const got=await _pg.apply(this,arguments);if(got&&hostOnline())netFX({k:"raise",pl,n:got});return got}}
{const _sp=spend;spend=function(pl,n){if(n>0&&hostOnline())netFX({k:"pour",pl,n});return _sp.apply(this,arguments)}}
{const _gm=giveMana;giveMana=function(pl,n){const got=_gm.apply(this,arguments);if(got>0&&hostOnline()&&G.phase!=="setup")netFX({k:"fill",pl,n:got});return got}}
{const _ra=repairAct;repairAct=function(r,c,T){const out=_ra.apply(this,arguments);if(hostOnline())netFX({k:"repair",r,c});return out}}
{const _ta=turnAsync;turnAsync=async function(pl){const P=G.p[pl];
  if(hostOnline()&&P&&!isHorde(pl)){if(planetUp("saturn")&&paysSaturn(pl))netFX({k:"snd",s:"bell"});if(sunUp()&&P.tribe!=="firm"&&P.sunNext!=null&&tnOf(pl)>=P.sunNext)netFX({k:"snd",s:"drums"})}
  return _ta.apply(this,arguments)}}
{const _cr=cycleRound;cycleRound=async function(){const out=await _cr.apply(this,arguments);if(hostOnline()){if(cycleNow("venus"))netFX({k:"snd",s:"harp"});if(cycleNow("mercury"))netFX({k:"snd",s:"quill"})}return out}}

/* ---------- a joined player's screen plays it ---------- */
function playFX(e){window.__fxn=(window.__fxn||0)+1;if(!G)return;const V=view(),col=pl=>G.p[pl]?G.p[pl].color:"#ccc",fx=FX.on(),T=(r,c)=>FX.tile(r,c),see=(r,c)=>FX.sees(r,c);
  switch(e.k){
    case "place":if(e.pl===V||see(e.r,e.c)){if(fx)FX.burst(T(e.r,e.c),col(e.pl));AUD.place()}break;
    case "move":if(e.pl===V||see(e.a[0],e.a[1])&&see(e.b[0],e.b[1])){if(fx)FX.slide(T(...e.a),T(...e.b),col(e.pl));AUD.move()}break;
    case "strike":{const sa=e.pl===V||see(...e.a),sb=see(...e.b);if(!sa&&!sb)break;if(fx&&sa)FX.strike(T(...e.a),T(...e.b),col(e.pl));
      if(fx&&sb){const r=T(...e.b);setTimeout(()=>{if(e.kind==="boom")FX.boom(r);else if(e.kind==="dollar"){FX.blunt(r);FX.dollar(r)}else if(e.kind==="blunt")FX.blunt(r)},180)}
      if(e.snd&&AUD[e.snd])AUD[e.snd]();break}
    case "fogHit":if(e.pl===V)setTimeout(()=>AUD.hit(),260);break;
    case "hit":if(fx&&see(e.r,e.c))FX.hit(T(e.r,e.c),"#ff5a4a");break;
    case "death":if(e.pl===V||see(e.r,e.c)){if(fx){const r=T(e.r,e.c);FX.smoke(r);FX.skull(r)}AUD.death()}break;
    case "sac":{const r=e.from==="hand"?(e.pl===V?FX.rectOf($("#hand")):FX.rectOf(barOf(e.pl,".manabar"))):e.from&&(e.pl===V||see(...e.from))?T(...e.from):null;
      if(fx&&r){FX.sigil(r,false);FX.pop(r,`+${e.got}`,"#8f80ee")}if(e.pl===V)AUD.fill();break}
    case "suicide":if(fx&&(e.pl===V||see(e.r,e.c)))FX.sigil(T(e.r,e.c),true);break;
    case "shuffle":if(fx)FX.shuffle(FX.rectOf(e.pl<0?$("#seegrave"):barOf(e.pl,".deckbar")));break;
    case "cast":{const sp=SP(e.id);if(!sp)break;if(fx)castFX(sp,e.pl,e.sel,e.fires||[]);AUD.cast(sp.id==="robbank"?"Bank":sp.school);break}
    case "meteor":AUD.meteor();if(fx&&see(e.r,e.c)){FX.meteor(T(e.r,e.c));for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if((dr||dc)&&see(e.r+dr,e.c+dc))FX.flames(T(e.r+dr,e.c+dc),520)}break;
    case "raise":{if(fx){const a=FX.rectOf($("#seegrave")),b=e.pl===V?FX.rectOf($("#hand")):FX.rectOf(barOf(e.pl,".deckbar"));for(let i=0;i<e.n;i++)FX.wisp(a,b,i*160)}AUD.raise();break}
    case "pour":if(e.pl===V){AUD.pour();if(fx)FX.pour(FX.rectOf(barOf(e.pl,".manabar")),e.n)}break;
    case "fill":if(e.pl===V){AUD.fill();if(fx)FX.fill(FX.rectOf(barOf(e.pl,".manabar")),e.n)}break;
    case "repair":if(see(e.r,e.c))AUD.repair();break;
    case "snd":if(AUD[e.s])AUD[e.s]();if(e.s==="quill")setTimeout(()=>AUD.whispers(),2600);break}}

/* ---------- more than one player on the host's device ---------- */
const localSeats=()=>G?G.p.filter(P=>P.cpu==null&&!P.net&&!P.netAway).map(P=>P.i):[];
{const _v=view;view=function(){
  if(NET.role==="guest"&&NET.watch&&G)return NET.watchSeat!=null?NET.watchSeat:0;
  if(NET.role==="host"&&G&&G.opts.online){const L=localSeats();if(L.length>1){if(L.includes(G.active))G.lastView=G.active;return L.includes(G.lastView)?G.lastView:L[0]}}
  return _v()}}
/* the setup: several seats can be "here" */
{const _sf=seatForm;seatForm=function(i,S,mode,L,taken){let h=_sf(i,S,mode,L,taken);if(NET.role==="lobby-host"&&NET.inSetup)h=h.replace(">You (the host)</option>",">Here, on this device</option>").replace(">You (the host)</span>",">Here, on this device</span>");return h}}

/* ---------- watching ---------- */
{const _ca=canAct;canAct=function(){if(NET.role==="guest"&&NET.watch)return false;return _ca()}}
{const _rd=render;render=function(){_rd.apply(this,arguments);if(!G||NET.role!=="guest"||!NET.watch)return;const h=$("#hand");if(h)h.innerHTML='<p class="dim">You are watching this game.</p>';const hh=$("#handh");if(hh)hh.textContent="Watching"}}

/* ---------- rejoining ---------- */
const REJOIN_KEY="ec-net-rejoin";
const rejoinSave=o=>{try{localStorage.setItem(REJOIN_KEY,JSON.stringify(o))}catch(e){}};
const rejoinLoad=()=>{try{return JSON.parse(localStorage.getItem(REJOIN_KEY)||"null")}catch(e){return null}};
const newToken=()=>Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
/* the host: tokens for every seat, and seats that wait for their player */
{const _sg=startGame;startGame=function(opts){const was=NET.role==="lobby-host"&&NET.inSetup;const out=_sg(opts);
  if(was&&NET.role==="host"&&G&&G.opts.online){
    for(const P of G.p)if(P.net){P.netToken=newToken();sendTo(P.net,{t:"start",seat:P.i,token:P.netToken,code:NET.code})}
    for(const id of guestIds())if(!G.p.some(P=>P.net===id))sendTo(id,{t:"start",seat:null,watch:true,watchSeat:NET.hostSeat});
    NET.chat=NET.chat||[];flushSnap()}
  return out}}
{const _gl=guestLeft;guestLeft=function(id){const s=G&&G.opts.online&&!G.over?seatOfGuest(id):null;_gl(id);if(s!=null){const P=G.p[s];P.netAway=true;if(P.jail)P.jail.cpu="medium"}}}
function netRejoin(from,tok,name){if(!G||!G.opts.online||G.over)return false;const P=G.p.find(Q=>Q.netToken&&Q.netToken===tok);if(!P)return false;
  P.net=from;P.netAway=false;if(P.jail)P.jail.cpu=null;else P.cpu=null;NET.guests[from]={name:String(name||P.name).slice(0,20)};NET.sent[from]={n:0,full:false};
  log(`<b>${plName(P.i)} is back.</b> The seat is theirs again.`,"event");notify(P.i,`${esc(P.name)} is back in the game.`);
  sendTo(from,{t:"start",seat:P.i,token:tok,code:NET.code,rejoin:true});flushSnap();lobbyRoster();render();return true}
/* the guest: remember the seat, come back on its own when the line drops */
{const _on=onNet;onNet=function(from,d){
  if(!d||!d.t)return _on(from,d);
  if(NET.role==="guest"){
    if(d.t==="start"){NET.watch=!!d.watch;NET.watchSeat=d.watchSeat;if(d.token)rejoinSave({code:NET.code,token:d.token,name:NET.name});
      if(d.watch){NET.seat=null;NET.started=false;lobbyMsg("The game has started. You are watching it.");return}
      if(d.rejoin){NET.seat=d.seat;NET.started=false;netBanner("");return}}
    if(d.t==="fx"){setTimeout(()=>playFX(d.e),70);return}
    if(d.t==="chat"){chatAdd(d.from,d.text);return}
    if(d.t==="closing"){NET.closing=true;return _on(from,{t:"bye"})}
    if(d.t==="bye"&&!NET.closing&&NET.code&&G&&!G.over){netReconnect();return}}
  if(NET.role==="host"||NET.role==="lobby-host"){
    if(d.t==="hello"&&d.token&&netRejoin(from,d.token,d.name))return;
    if(d.t==="hello"&&G&&G.opts.online&&!G.over){NET.guests[from]={name:String(d.name||"Guest").slice(0,20)};NET.sent[from]={n:0,full:false};sendTo(from,{t:"welcome",host:NET.name});
      sendTo(from,{t:"start",seat:null,watch:true,watchSeat:NET.hostSeat});(NET.chat||[]).slice(-20).forEach(m=>sendTo(from,{t:"chat",from:m.from,text:m.text}));flushSnap();lobbyRoster();return}
    if(d.t==="chat"){const g=NET.guests[from];const nm=g?g.name:"?";chatAdd(nm,d.text);for(const id of guestIds())sendTo(id,{t:"chat",from:nm,text:String(d.text).slice(0,300)});return}}
  return _on(from,d)}}
/* the join button also sends the saved seat, when it's the same room */
{const _jl=onlineLobby;onlineLobby=function(){_jl();const j=$("#onJoin");if(!j)return;const old=j.onclick;
  j.onclick=async()=>{const code=($("#onCode").value||"").trim().toUpperCase(),saved=rejoinLoad();NET.token=saved&&saved.code===code?saved.token:null;return old()}}}
let reTries=0;
/* v71j: a poor connection keeps trying for a minute and a half (30 tries), not 24 seconds */
async function netReconnect(){if(NET.reconnecting)return;NET.reconnecting=true;reTries=0;netBanner("The connection dropped. Reconnecting…");
  const saved=rejoinLoad();NET.token=saved&&saved.code===NET.code?saved.token:NET.token;
  while(reTries<(netLvl()>1?30:8)&&NET.role==="guest"){reTries++;try{try{NET.tr&&NET.tr.close()}catch(e){}NET.tr=await transport(NET.code,false,onNet);sendHost({t:"hello",name:NET.name,token:NET.token});NET.reconnecting=false;netBanner("Reconnected.");setTimeout(()=>netBanner(""),2500);return}catch(e){await new Promise(r=>setTimeout(r,3000))}}
  NET.reconnecting=false;netBanner("");_netLost()}
function _netLost(){if(G)G.over=true;ovShow(`<div class="ovbox"><h2>Connection lost</h2><p>The game couldn't be reached again. You can join the room again with the same code: you'll get your seat back while the game is on.</p><p class="acts"><button class="btn" id="netOk">Back to the menu</button></p></div>`);$("#netOk").onclick=()=>{netLeave();startMode="online";showStart()}}
function netBanner(t){let b=$("#netbanner");if(!t){if(b)b.hidden=true;return}if(!b){b=document.createElement("div");b.id="netbanner";b.setAttribute("role","status");document.body.appendChild(b)}b.textContent=t;b.hidden=false}
/* the host closes the room on purpose: everyone is told */
{const _nl=netLeave;netLeave=function(){if(NET.role==="host"||NET.role==="lobby-host")for(const id of guestIds())sendTo(id,{t:"closing"});NET.closing=false;NET.token=null;return _nl()}}

/* ---------- the chat ---------- */
function chatAdd(from,text){NET.chat=NET.chat||[];NET.chat.push({from,text:String(text).slice(0,300)});if(NET.chat.length>80)NET.chat.shift();
  const open=$("#chatbox")&&!$("#chatbox").hidden;if(!open)NET.unread=(NET.unread||0)+1;chatPaint();if(!open&&from!==NET.name)AUD.ui()}
function chatSend(text){text=String(text||"").trim().slice(0,300);if(!text)return;
  if(NET.role==="guest")sendHost({t:"chat",text});else{chatAdd(NET.name||"Host",text);for(const id of guestIds())sendTo(id,{t:"chat",from:NET.name||"Host",text})}}
function chatPaint(){
  let btn=$("#chatbtn");const on=!!NET.role;if(!on){if(btn)btn.hidden=true;const bx=$("#chatbox");if(bx)bx.hidden=true;return}
  if(!btn){btn=document.createElement("button");btn.id="chatbtn";btn.type="button";document.body.appendChild(btn);
    btn.onclick=()=>{const bx=chatBox();bx.hidden=!bx.hidden;if(!bx.hidden){NET.unread=0;chatPaint();bx.querySelector("input").focus()}chatPaint()}}
  btn.hidden=false;btn.innerHTML=`Chat${NET.unread?` <i class="bang">${NET.unread}</i>`:""}`;
  const bx=$("#chatbox");if(bx&&!bx.hidden){const L=bx.querySelector(".chatlog");L.innerHTML=(NET.chat||[]).map(m=>`<li><b>${esc(m.from)}</b> ${esc(m.text)}</li>`).join("")||'<li class="dim">Nothing yet.</li>';L.scrollTop=L.scrollHeight}}
function chatBox(){let bx=$("#chatbox");if(bx)return bx;bx=document.createElement("div");bx.id="chatbox";bx.hidden=true;
  bx.innerHTML=`<div class="dhead"><b>Chat</b><button type="button" class="xclose" aria-label="Close the chat">×</button></div><ul class="chatlog"></ul><form class="chatin"><input maxlength="300" placeholder="Say something" aria-label="Message"><button class="btn sm">Send</button></form>`;
  document.body.appendChild(bx);bx.querySelector(".xclose").onclick=()=>{bx.hidden=true;chatPaint()};
  bx.querySelector("form").onsubmit=e=>{e.preventDefault();const i=bx.querySelector("input");chatSend(i.value);i.value=""};return bx}
setInterval(()=>{try{chatPaint()}catch(e){}},1000);

if(window.__EC)Object.assign(window.__EC,{playFX,netRejoin,chatSend,chatAdd,localSeats});
