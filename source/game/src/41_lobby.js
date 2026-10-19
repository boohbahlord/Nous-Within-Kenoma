/* ---------------- v38: the online lobby ----------------
   Everyone in the room sees the lobby: who is there, what each of them has chosen, and what the host is doing (in the room, or
   setting up the game and on which tab). While the host sets up, a joined player chooses their own name, Substance, color and
   symbol in "Your player" (a Substance someone else holds is greyed out, except the Beginner), and their own look in "Display",
   which is saved on their device like any display setting and carries into the game. When the host gives them a seat, their
   choices fill it. */

const LOBBY_STATUS={room:"The host is in the room, waiting for everyone to join.",players:"The host is setting up the game: the players and seats.",
  map:"The host is setting up the game: the map.",deck:"The host is setting up the game: the decks.",rules:"The host is setting up the game: the rules.",
  display:"The host is setting up the game.",starting:"The game is starting."};
const netPickOf=()=>{const p=PREF.netPick||{};return {name:NET.name||p.name||"Player",tribe:TRIBES[p.tribe]&&!TRIBES[p.tribe].soon&&p.tribe!=="random"?p.tribe:"beginner",
  color:COLORS.some(c=>c[1]===p.color)?p.color:COLORS[0][1],solid:SOLIDS[p.solid]?p.solid:"tetra"}};
/* the host checks what a joined player sends */
function cleanPick(p){p=p||{};return {name:String(p.name||"Player").slice(0,20),tribe:TRIBES[p.tribe]&&!TRIBES[p.tribe].soon&&p.tribe!=="random"?p.tribe:"beginner",
  color:COLORS.some(c=>c[1]===p.color)?p.color:COLORS[0][1],solid:SOLIDS[p.solid]?p.solid:"tetra"}}
const pickLook=p=>{const T=TRIBES[p.tribe]||{};return {color:T.color||p.color,solid:T.solid||p.solid}};

/* ---------- the host ---------- */
NET.status="room";NET.seatInfo=[];
let lobbyT=null;
function lobbySend(){clearTimeout(lobbyT);lobbyT=setTimeout(()=>{lobbyT=null;if(NET.role!=="lobby-host"&&!(NET.role==="host"&&(!G||G.over)))return;
  const n=$("#pcount")?+$("#pcount").value:4,seats=NET.inSetup?(NET.seatInfo||[]).slice(0,n):[];
  const roster=[{id:"host",name:NET.name,host:true,seat:seats.findIndex(s=>s&&s.type==="human"),tribe:(seats.find(s=>s&&s.type==="human")||{}).tribe||null}]
    .concat(guestIds().map(id=>{const g=NET.guests[id],si=seats.findIndex(s=>s&&s.type==="net:"+id);return {id,name:g.name,pick:g.pick||null,seat:si}}));
  const taken=seats.filter(Boolean).map((s,i)=>({i,tribe:s.tribe,type:s.type}));
  const room=myRoom();for(const id of guestIds())sendTo(id,{t:"lobby",host:NET.name,roster,taken,status:NET.status,you:id,room})},80)}
function setStatus(k){if(NET.status===k)return;NET.status=k;lobbySend()}
/* the room screen shows the same list */
{const _lr=lobbyRoster;lobbyRoster=function(){_lr();const e=$("#onRoster");
  if(e&&(NET.role==="lobby-host"||NET.role==="host")){const rows=guestIds().map(id=>{const g=NET.guests[id],p=g.pick;const L=p?pickLook(p):null;
      return `<li>${L?solidSVG(L.solid,L.color,16):""} <b>${esc(g.name)}</b>${p?` <span class="dim">· ${esc(TRIBES[p.tribe].name)}</span>`:` <span class="dim">· choosing…</span>`}</li>`}).join("");
    e.innerHTML=`<b>In the room</b><ul class="lroster"><li><b>${esc(NET.name)}</b> <b class="youtag">You</b> <span class="dim">· the host</span></li>${rows}</ul>${guestIds().length?"":'<span class="dim">Share the code and wait for the others to join.</span>'}`}
  lobbySend()}}
/* a seat given to a joined player takes their name, Substance, color and symbol */
{const _sf=seatForm;seatForm=function(i,S,mode,L,taken){
  const apply=()=>{if(!(NET.role==="lobby-host"&&NET.inSetup)||!S.type||!String(S.type).startsWith("net:"))return false;const g=NET.guests[S.type.slice(4)];if(!g||!g.pick)return false;
    const p=g.pick,before=JSON.stringify([S.name,S.tribe,S.color,S.solid]);S.name=p.name;if(!(taken&&taken.has(p.tribe))||p.tribe==="beginner")S.tribe=p.tribe;S.color=p.color;S.solid=p.solid;S.named=true;
    return JSON.stringify([S.name,S.tribe,S.color,S.solid])!==before};
  apply();let h=_sf(i,S,mode,L,taken);if(apply())h=_sf(i,S,mode,L,taken);
  if(NET.role==="lobby-host"&&NET.inSetup){NET.seatInfo[i]={type:S.type,tribe:S.tribe};if(String(S.type).startsWith("net:"))h=h.replace("<legend>",`<legend title="This player chooses their own name, Substance, color and symbol in the lobby">`);lobbySend()}
  return h}}
/* the host's setup tells the room which tab it is on */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".ovbox.setup .stab");if(!b||NET.role!=="lobby-host"||!NET.inSetup)return;setStatus(b.dataset.t)},true);
{const _ss=showStart;showStart=function(){const out=_ss.apply(this,arguments);
  if(NET.role==="lobby-host"){if(NET.inSetup){NET.seatInfo=NET.seatInfo||[];setStatus("players")}else{NET.seatInfo=[];setStatus("room")}}return out}}
{const _sg=startGame;startGame=function(opts){if(NET.role==="lobby-host"&&NET.inSetup&&opts&&!opts.fast){NET.status="starting";lobbySend()}return _sg.apply(this,arguments)}}

/* ---------- a joined player's lobby ---------- */
let lobbyTab="lobby";
function guestLobby(){
  ovShow(`<div class="ovbox setup online glob"><div class="shead"><h2>Online${NET.hostName?` · ${esc(NET.hostName)}'s room`:""}</h2><p class="dim">Choose your player and your look while the host sets up the game.</p>${NET.roomInfo?`<p class="rmline"><b>${esc(NET.roomInfo.title)}</b>${NET.roomInfo.desc?` <span class="dim">· ${esc(NET.roomInfo.desc)}</span>`:""}</p>`:""}</div>
<div class="stabs" role="tablist">${[["lobby","Lobby"],["me","Your player"],["display","Display"]].map(([k,t])=>`<button type="button" role="tab" class="stab ${k===lobbyTab?"on":""}" data-lt="${k}" aria-selected="${k===lobbyTab}">${t}</button>`).join("")}</div>
<div class="spanel" data-lp="lobby" ${lobbyTab==="lobby"?"":"hidden"}><div class="onl"><p id="onMsg" class="lstatus"></p><div id="gRoster"></div></div></div>
<div class="spanel" data-lp="me" ${lobbyTab==="me"?"":"hidden"}><div id="gMe"></div></div>
<div class="spanel" data-lp="display" ${lobbyTab==="display"?"":"hidden"}><div id="gDisp"></div></div>
<p class="acts sfoot"><button class="btn ghost" id="onLeave">Leave the room</button></p></div>`);
  document.querySelectorAll("[data-lt]").forEach(b=>b.onclick=()=>{lobbyTab=b.dataset.lt;document.querySelectorAll("[data-lt]").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-selected",x===b)});
    document.querySelectorAll("[data-lp]").forEach(p=>p.hidden=p.dataset.lp!==lobbyTab)});
  $("#onLeave").onclick=()=>{netLeave();startMode=null;showStart()};
  paintGuestLobby();paintMe();paintDisp();
}
function paintGuestLobby(){const L=NET.lobby,m=$("#onMsg"),r=$("#gRoster");if(!m||!r)return;
  if(!L){m.textContent=NET.hostName?`Connected to ${NET.hostName}'s room.`:"Connecting…";r.innerHTML="";return}
  m.textContent=LOBBY_STATUS[L.status]||LOBBY_STATUS.room;
  r.innerHTML=`<ul class="lroster">${L.roster.map(x=>{const p=x.id===L.you?netPickOf():x.pick;const look=p?pickLook(p):null;
    return `<li>${look?solidSVG(look.solid,look.color,18):""} <b>${esc(x.id===L.you?netPickOf().name:x.name)}</b>${x.host?' <span class="dim">· the host</span>':""}${x.id===L.you?' <b class="youtag">You</b>':""}${p?` <span class="dim">· ${esc(TRIBES[p.tribe].name)}</span>`:x.host?"":' <span class="dim">· choosing…</span>'}${x.seat>=0?` <span class="seatag">P${x.seat+1}</span>`:x.host?"":' <span class="dim">· no seat yet</span>'}</li>`}).join("")}</ul>
<p class="dim">The host gives each player a seat. Your choices in "Your player" fill your seat; your Display settings are your own.</p>`}
/* Substances other seats hold (the Beginner can be shared) */
const takenByOthers=()=>{const L=NET.lobby;if(!L)return new Set();const me="net:"+L.you,s=new Set();
  for(const t of L.taken||[])if(t.type!==me&&t.tribe&&t.tribe!=="beginner"&&t.tribe!=="random")s.add(t.tribe);
  for(const x of L.roster)if(x.id!==L.you&&x.pick&&x.pick.tribe!=="beginner")s.add(x.pick.tribe);return s};
function sendMe(){const p=netPickOf();PREF.netPick=p;PREF.netName=p.name;savePrefs();if(NET.role==="guest")sendHost({t:"me",pick:p})}
function paintMe(){const box=$("#gMe");if(!box)return;const p=netPickOf(),taken=takenByOthers(),T=TRIBES[p.tribe]||{};
  box.innerHTML=`<fieldset class="pf seat" style="--pc:${T.color||p.color}"><legend>Your player</legend>
<div class="srow"><label class="f">Name <input id="gName" value="${esc(p.name)}" maxlength="20"></label></div>
<div class="f"><span>Substance</span><div class="opts subs">${Object.entries(TRIBES).filter(([k])=>k!=="random").map(([k,t])=>{const off=t.soon||taken.has(k)&&k!==p.tribe;
  return `<label class="opt${off?" off":""}"><input type="radio" name="gTr" value="${k}" ${k===p.tribe?"checked":""} ${off?"disabled":""}><span>${t.solid?`<i class="subsym">${solidSVG(t.solid,t.color||"#f3d6a6",18)}</i>`:""}${t.name}<small>${taken.has(k)&&k!==p.tribe?"Another player has it.":esc(t.sub||"")}</small></span></label>`}).join("")}</div></div>
${T.color?`<p class="dim fixednote">${esc(T.name)} always plays in its own color and symbol: ${solidSVG(T.solid,T.color,20)}</p>`:`<div class="f"><span>Color</span><div class="opts swatches">${COLORS.map(([nm,hex])=>`<label class="sw" title="${nm}"><input type="radio" name="gCo" value="${hex}" ${hex===p.color?"checked":""}><span style="--pc:${hex}"></span><em>${nm}</em></label>`).join("")}</div></div>
${T.solid?`<p class="dim fixednote">${esc(T.name)} always bears its own symbol: ${solidSVG(T.solid,p.color,20)}</p>`:`<div class="f"><span>Symbol</span><div class="opts solids">${Object.entries(SOLIDS).map(([k,nm])=>`<label class="so-opt" title="${nm}"><input type="radio" name="gSo" value="${k}" ${k===p.solid?"checked":""}><span>${solidSVG(k,"#f3d6a6",28)}<em>${nm}</em></span></label>`).join("")}</div></div>`}`}
</fieldset>`;
  const upd=(k,v)=>{PREF.netPick=Object.assign(netPickOf(),{[k]:v});if(k==="name")NET.name=v;sendMe();if(k!=="name")paintMe();paintGuestLobby()};
  $("#gName").addEventListener("input",e=>upd("name",(e.target.value||"").slice(0,20)||"Player"));
  box.querySelectorAll("input[name=gTr]").forEach(i=>i.onchange=()=>upd("tribe",i.value));
  box.querySelectorAll("input[name=gCo]").forEach(i=>i.onchange=()=>upd("color",i.value));
  box.querySelectorAll("input[name=gSo]").forEach(i=>i.onchange=()=>upd("solid",i.value))}
/* their own Display settings, saved on their device */
function paintDisp(){const box=$("#gDisp");if(!box)return;
  const sel=(id,label,opts,cur,note)=>`<label class="f">${label} <select id="${id}">${opts.map(([v,t])=>`<option value="${v}" ${String(v)===String(cur)?"selected":""}>${t}</option>`).join("")}</select></label>${note?`<p class="dim">${note}</p>`:""}`;
  const pct=(a,b)=>Array.from({length:Math.round((b-a)*10)+1},(_,i)=>{const v=Math.round((a+i/10)*10)/10;return [v,Math.round(v*100)+"%"]});
  box.innerHTML=`<fieldset class="pf"><legend>Your display</legend><p class="dim">Only for you, on this device. It carries into the game, and next time too.</p><div class="mgrid">
${sel("gTheme","Page theme",Object.entries(THEMES).map(([k,[n]])=>[k,n]),PREF.theme)}
${sel("gHand","Your hand",[["below","Under your deck and mana"],["side","Beside the field"]],PREF.hand)}
${sel("gSel","Selected stack box",[["bottom","Below the spells"],["top","Above the spells"]],PREF.sel)}
${sel("gCtl","Turn buttons",[["bottom","Under the field"],["top","At the top"]],PREF.ctl)}
${sel("gCoord","Tile names",[["0","Off"],["1","On"]],PREF.coords?"1":"0")}
${sel("gLines","Background lines",[["1","On"],["0","Off"]],PREF.lines===false?"0":"1")}
${sel("gAnimC","Card animations",[["1","On"],["0","Off"]],PREF.fxCards===false?"0":"1")}
${sel("gAnimM","Magic animations",[["1","On"],["0","Off"]],PREF.fxMagic===false?"0":"1")}
${sel("gBright","Brightness",pct(.7,1.3),Math.round((PREF.bright||1)*10)/10)}
${sel("gCi","Card icons",pct(.8,1.8),PREF.ci)}
${sel("gUi","Interface size",pct(.8,1.4),PREF.ui)}
${sel("gTz","Text size",pct(.8,1.8),PREF.tz)}
</div></fieldset>`;
  const set=(id,f)=>{$("#"+id).onchange=e=>{f(e.target.value);savePrefs();applyPrefs()}};
  set("gTheme",v=>PREF.theme=v);set("gHand",v=>PREF.hand=v);set("gSel",v=>PREF.sel=v);set("gCtl",v=>PREF.ctl=v);set("gCoord",v=>PREF.coords=v==="1");
  set("gLines",v=>PREF.lines=v==="1");set("gAnimC",v=>PREF.fxCards=v==="1");set("gAnimM",v=>PREF.fxMagic=v==="1");
  set("gBright",v=>PREF.bright=+v);set("gCi",v=>PREF.ci=+v);set("gUi",v=>PREF.ui=+v);set("gTz",v=>PREF.tz=+v)}
{const _ol=onlineLobby;onlineLobby=function(){if(NET.role==="guest"&&!(G&&!G.over&&NET.started))return guestLobby();return _ol.apply(this,arguments)}}

/* ---------- the messages ---------- */
{const _on=onNet;onNet=function(from,d){
  if(d&&NET.role==="guest"){
    if(d.t==="welcome"){_on(from,d);NET.hostName=d.host;sendMe();if($(".glob"))guestLobby();return}
    if(d.t==="lobby"){NET.lobby=d;paintGuestLobby();const a=document.activeElement;if(!(a&&a.id==="gName")&&$("#gMe"))paintMe();return}
    if(d.t==="start"&&!d.watch&&!d.rejoin){const out=_on(from,d);setTimeout(()=>{try{askAnimations()}catch(e){}},400);return out}}
  if(d&&(NET.role==="lobby-host"||NET.role==="host")){
    if(d.t==="me"){const g=NET.guests[from];if(!g)return;g.pick=cleanPick(d.pick);g.name=g.pick.name;lobbyRoster();
      if(NET.inSetup&&$("#pcount"))$("#pcount").dispatchEvent(new Event("change"));return}
    if(d.t==="hello"){const out=_on(from,d);lobbySend();return out}
    if(d.t==="bye"){const out=_on(from,d);lobbySend();return out}}
  return _on(from,d)}}
if(window.__EC)Object.assign(window.__EC,{guestLobby,lobbySend});
