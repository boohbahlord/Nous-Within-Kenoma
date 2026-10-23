/* ---------- v78a: spawn lines are your own; sharing them is by leave (Diplomacy) ----------
   - Everyone spawns only in their own two spawn lines (and on their Bank land and Flags). A teammate or an ally may let
     you spawn in theirs: ask them in Diplomacy; a person answers, a computer teammate always agrees, and a computer ally
     only at Great trust (60 or more). Either may take it back. Never during setup, and only where Diplomacy is played
     (Free For All and Factions): in Teams and the other modes nobody shares.
   - The switch "Keep teammates' and allies' cards out of my spawn lines": no one may spawn in them, even with leave, and
     no teammate's or ally's card may step into them (cards already there may leave). Those it keeps out are told when it
     is turned on, and again whenever they try. */
const ssD=()=>G.ss||(G.ss={ok:{},block:{},ask:[],n:0});
const ssFriend=(a,b)=>a!==b&&!!G.p[a]&&!!G.p[b]&&!isNPC(a)&&!isNPC(b)&&!isHorde(a)&&!isHorde(b)&&(G.p[a].team===G.p[b].team||dipAllied(a,b));
const ssOn=()=>typeof dipOn==="function"&&dipOn();
function spawnShared(owner,guest){if(!G||!G.ss||!ssOn()||G.phase==="setup")return false;return !!G.ss.ok[owner+">"+guest]&&!G.ss.block[owner]&&ssFriend(owner,guest)}
const ssBlocks=(owner,guest)=>!!(G&&G.ss&&G.ss.block[owner])&&ssFriend(owner,guest);
const ssFriends=pl=>alive().filter(i=>ssFriend(pl,i));
const ssAsks=pl=>G&&G.ss?G.ss.ask.filter(a=>a.to===pl):[];
const ssWho=pl=>G.p[pl]&&G.p[pl].team===G.p[view()].team?"teammate":"ally";
const ssAiYes=(owner,guest)=>G.p[owner].team===G.p[guest].team||dipTrust(teamOf(owner),teamOf(guest))>=60;
function ssGrant(owner,guest,yes){const D=ssD();if(yes){D.ok[owner+">"+guest]=true;log(`${plName(owner)} lets ${plName(guest)} spawn in their spawn lines.`,"event")}
  else log(`${plName(owner)} doesn't let ${plName(guest)} spawn in their spawn lines.`,"event");
  if(!G.p[guest].cpu)notify(guest,yes?`${esc(G.p[owner].name)} lets you spawn in their spawn lines.`:`${esc(G.p[owner].name)} doesn't let you spawn in their spawn lines.`)}
function ssAsk(guest,owner){if(!G||!ssOn()||NET.ctx!=null&&NET.ctx!==guest||G.phase==="setup"||!ssFriend(owner,guest))return false;const D=ssD();
  if(D.ok[owner+">"+guest]||D.ask.some(a=>a.from===guest&&a.to===owner))return false;
  if(D.block[owner]){if(!G.p[guest].cpu)notify(guest,`${esc(G.p[owner].name)} keeps teammates' and allies' cards out of their spawn lines.`);return false}
  log(`${plName(guest)} asks ${plName(owner)} to spawn in their spawn lines.`,"event");
  if(G.p[owner].cpu){ssGrant(owner,guest,ssAiYes(owner,guest));render();return true}
  D.ask.push({id:++D.n,from:guest,to:owner,round:G.moon.round});notify(owner,`${esc(G.p[guest].name)} asks to spawn in your spawn lines: answer in Diplomacy.`);render();return true}
function ssAnswer(owner,id,yes){if(!G||NET.ctx!=null&&NET.ctx!==owner)return false;const D=ssD(),a=D.ask.find(x=>x.id===id&&x.to===owner);if(!a)return false;
  D.ask.splice(D.ask.indexOf(a),1);if(ssFriend(owner,a.from))ssGrant(owner,a.from,!!yes);render();return true}
function ssRevoke(owner,guest){if(!G||NET.ctx!=null&&NET.ctx!==owner)return false;const D=ssD();if(!D.ok[owner+">"+guest])return false;delete D.ok[owner+">"+guest];
  log(`${plName(owner)} no longer lets ${plName(guest)} spawn in their spawn lines.`,"event");if(!G.p[guest].cpu)notify(guest,`${esc(G.p[owner].name)} no longer lets you spawn in their spawn lines.`);render();return true}
function ssBlock(owner,on){if(!G||NET.ctx!=null&&NET.ctx!==owner)return false;const D=ssD();D.block[owner]=!!on;
  log(on?`${plName(owner)} keeps teammates' and allies' cards out of their spawn lines.`:`${plName(owner)} opens their spawn lines to teammates and allies again.`,"event");
  if(on)for(const f of ssFriends(owner))if(!G.p[f].cpu)notify(f,`${esc(G.p[owner].name)} keeps teammates' and allies' cards out of their spawn lines: you can't spawn in them or step into them.`);
  render();return true}
for(const [name,get,set] of [["ssAsk",()=>ssAsk,f=>ssAsk=f],["ssAnswer",()=>ssAnswer,f=>ssAnswer=f],["ssRevoke",()=>ssRevoke,f=>ssRevoke=f],["ssBlock",()=>ssBlock,f=>ssBlock=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}
/* a friend's card doesn't step into lines kept closed */
let ssCut=[];   // the steps the last list lost to closed lines
{const _mt=moveTargets;moveTargets=function(){const out=_mt.apply(this,arguments);ssCut=[];if(!G||!G.ss||!G.sel)return out;const st=G.board[G.sel.r]&&G.board[G.sel.r][G.sel.c];if(!st)return out;
  return out.filter(([r,c])=>{const z=G.zone[r][c],cut=z>=0&&z!==st.owner&&ssBlocks(z,st.owner);if(cut)ssCut.push([r,c]);return !cut})}}
/* and whoever tries is told why */
{const _tc=tileClick;tileClick=function(r,c){if(G&&!G.over&&canAct()&&G.phase!=="setup"&&!isVoid(r,c)){const z=G.zone[r][c],V=G.active;
    if(z>=0&&z!==V&&ssFriend(z,V)&&!G.board[r][c]){
      if(G.sel&&G.mode==="move"&&ssBlocks(z,V)&&(moveTargets(),ssCut.some(([a,b])=>a===r&&b===c))){flash(`${G.p[z].name} keeps teammates' and allies' cards out of their spawn lines.`);return}
      if(G.selHand&&!canPlace(G.selHand,r,c)){flash(ssBlocks(z,V)?`${G.p[z].name} keeps teammates' and allies' cards out of their spawn lines.`:ssOn()?`These are ${G.p[z].name}'s spawn lines: you may spawn in them only if they let you (ask in Diplomacy).`:`These are ${G.p[z].name}'s spawn lines: you spawn only in your own.`);return}}}
  return _tc.apply(this,arguments)}}
/* the Diplomacy window: a section for the spawn lines */
function ssHTML(V){const D=ssD(),F=ssFriends(V),asks=ssAsks(V),mine=G.phase!=="setup";
  const row=f=>{const P=G.p[f],them=!!D.ok[f+">"+V],us=!!D.ok[V+">"+f],asked=D.ask.some(a=>a.from===V&&a.to===f),blk=!!D.block[f];
    return `<li><b style="color:${P.color}">${esc(P.name)}</b> <small class="dim">(${ssWho(f)}${P.cpu?", computer":""})</small><span class="ssst">
In their lines: ${blk?`<i class="dim">kept closed</i>`:them?`<b>you may spawn</b>`:asked?`<i class="dim">asked, waiting</i>`:mine?`<button type="button" class="btn ghost sm" data-ss="ask|${f}">Ask to spawn there</button>`:`<i class="dim">not yet</i>`}
 · In yours: ${us?`<b>they may spawn</b> <button type="button" class="btn ghost sm" data-ss="rev|${f}">Stop it</button>`:`<i class="dim">not allowed</i>`}</span></li>`};
  return `<section class="dipsec dipspawn"><h3>Spawn lines</h3>
${asks.map(a=>`<p class="ssask">${plName(a.from)} asks to spawn in your spawn lines. <button type="button" class="btn sm" data-ss="yes|${a.id}">Allow</button> <button type="button" class="btn ghost sm" data-ss="no|${a.id}">Refuse</button></p>`).join("")}
<label class="farow"><span class="fal"><b>Keep teammates' and allies' cards out of my spawn lines</b><small>No one else may spawn in them, even with leave, and no teammate's or ally's card may step into them. They are told.</small></span><input type="checkbox" id="ssBlk" ${D.block[V]?"checked":""}></label>
${F.length?`<ul class="sslist">${F.map(row).join("")}</ul>`:`<p class="dim">No teammates or allies yet: an ally can let you spawn in their lines, and you in yours.</p>`}</section>`}
{const _dp=dipPaint;dipPaint=function(){_dp.apply(this,arguments);const w=$("#dipwin");if(!w||!G)return;const V=view(),body=w.querySelector(".dipbody");if(!body)return;
  const at=body.querySelector(".dipsec.dipp2p");at?at.insertAdjacentHTML("beforebegin",ssHTML(V)):body.insertAdjacentHTML("beforeend",ssHTML(V));
  const ul=body.querySelector(".dipnote ul");if(ul)ul.insertAdjacentHTML("beforeend",`<li><b>Spawn lines</b>: you spawn only in your own. A teammate or an ally may let you spawn in theirs: ask here (a computer teammate always agrees, a computer ally only at Great trust). Anyone can keep teammates' and allies' cards out of their spawn lines; those kept out are told.</li>`);
  body.querySelectorAll("[data-ss]").forEach(b=>b.onclick=()=>{const [a,x]=b.dataset.ss.split("|"),n=+x;
    if(a==="ask")ssAsk(V,n);else if(a==="rev")ssRevoke(V,n);else ssAnswer(V,n,a==="yes");dipPaint()});
  const bk=body.querySelector("#ssBlk");if(bk)bk.onchange=()=>{ssBlock(V,bk.checked);dipPaint()}}}

if(window.__EC)Object.assign(window.__EC,{spawnShared:(a,b)=>spawnShared(a,b),ssAsk:(...a)=>ssAsk(...a),ssAnswer:(...a)=>ssAnswer(...a),ssBlock:(...a)=>ssBlock(...a),ssRevoke:(...a)=>ssRevoke(...a),canSpawnW:(p,r,c)=>canSpawn(p,r,c)});
