/* ---------- v75b: Diplomacy (Factions by default; an option in Free For All) ----------
   Under the Bank, a flag opens Diplomacy. Relations are between sides: each player in Free For All, each faction in Factions.
   - Everyone starts at war.
   - Peace (a pact of non-aggression): neither side can attack the other for 1 to 4 rounds, as agreed; then war again unless
     renewed. Mercury's Total War lifts it while it lasts. Breaking a peace: the computers' trust in you falls all the way.
   - Alliance: shared vision, friendly spells on each other, and surrounding an enemy works as it does for teammates. There
     is no shared win: when only two sides are left every alliance breaks by itself (peace is still allowed).
   - Breaking an alliance: everyone's trust in you falls hard, and for 8 rounds the Banker disapproves: your Bank loans
     grow half as fast again, cards from the Ether cost 1d3 − 2 more and other spells 1d4 − 3 more (rolled each turn; never
     less than their price). Under Mercury's Total War none of that applies and the trust falls less.
   - Trust (the computers'): from −100 to +100, shown as +/− in colors from dark red (worst) through red, orange, yellow
     (neutral), light green and green to a rich green (great). It starts low at war, rises with peace and more with an
     alliance, falls with every attack, and decides what a computer accepts.
   - Proposals to a person wait for their answer: Accept, Decline or Counter (another number of rounds). */
const DIP_PEN_ROUNDS=8,TRUST0=-20;
const FLAG_SVG=`<svg class="dipflag" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 2v16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5.8 3 16 7 5.8 11Z" fill="currentColor"/></svg>`;
const TRUST_BANDS=[[-60,"Hostile","#7d1018"],[-30,"Very bad","#d32f2f"],[-10,"Bad","#ef8a2a"],[10,"Neutral","#e8cf4a"],[30,"Good","#a5d66b"],[60,"Really good","#4caf50"],[1e9,"Great","#1f8a3a"]];
const trustBand=v=>TRUST_BANDS.find(b=>v<b[0])||TRUST_BANDS[6];
const dipOn=()=>!!(G&&G.opts&&G.opts.diplomacy&&!survival()&&G.map&&(G.map.layout==="ffa"||G.map.layout==="factions"));
const dipD=()=>G.dip||(G.dip={rel:{},trust:{},pend:[],pen:{},n:0});
const dipKey=(a,b)=>a<b?a+"|"+b:b+"|"+a;
const teamOf=pl=>G.p[pl]?G.p[pl].team:null;
const dipPlayersOf=t=>G.p.filter(P=>P.team===t&&!P.out&&!isNPC(P.i)&&P.cpu!=="horde").map(P=>P.i);
const dipTeams=()=>[...new Set(G.p.filter(P=>!P.out&&!isNPC(P.i)&&P.cpu!=="horde").map(P=>P.team))];
function dipRel(a,b){if(a===b)return {s:"team"};if(!G||!G.dip)return {s:"war"};return G.dip.rel[dipKey(a,b)]||{s:"war"}}
function dipAllied(pa,pb){if(!G||!G.dip||!G.p[pa]||!G.p[pb])return false;const a=G.p[pa].team,b=G.p[pb].team;return a!==b&&dipRel(a,b).s==="ally"&&dipOn()}
const dipAtPeace=(pa,pb)=>!!(G&&G.dip&&G.p[pa]&&G.p[pb]&&G.p[pa].team!==G.p[pb].team&&dipRel(G.p[pa].team,G.p[pb].team).s==="peace"&&dipOn());
function dipTeamName(t){if(G.opts.factions&&typeof SIDE_COL!=="undefined"&&SIDE_COL[t])return SIDE_COL[t][0]+" faction";const ps=G.p.filter(P=>P.team===t&&!isNPC(P.i)&&P.cpu!=="horde");return ps.length?ps.map(P=>P.name).join(" & "):"Side "+(t+1)}
function dipTeamCol(t){if(G.opts.factions&&typeof SIDE_COL!=="undefined"&&SIDE_COL[t])return SIDE_COL[t][1];const P=G.p.find(P=>P.team===t&&!isNPC(P.i));return P?P.color:"#888"}
const dipTN=t=>`<b style="color:${dipTeamCol(t)}">${esc(dipTeamName(t))}</b>`;
const dipCpuTeam=t=>dipPlayersOf(t).length>0&&dipPlayersOf(t).every(i=>G.p[i].cpu);
/* trust: how much side a's computers trust side b */
function dipTrust(a,b){const v=dipD().trust[a+">"+b];return v==null?TRUST0:v}
function dipTrustAdd(a,b,d){const T=dipD().trust;T[a+">"+b]=Math.max(-100,Math.min(100,dipTrust(a,b)+d))}
function dipTrustSet(a,b,v){dipD().trust[a+">"+b]=Math.max(-100,Math.min(100,v))}
const trustTxt=v=>`${v>0?"+":v<0?"−":""}${Math.abs(Math.round(v))}`;
const trustChip=v=>{const b=trustBand(v);return `<span class="trustchip" style="--tc:${b[2]}" title="Trust: ${b[1]}">${trustTxt(v)} <small>${b[1]}</small></span>`};
function dipSet(a,b,s,extra){dipD().rel[dipKey(a,b)]=Object.assign({s,since:G.moon.round},extra||{});G._vis=null}
/* the betrayer's penalties (8 rounds): the Banker disapproves */
const dipPenOn=pl=>{const t=teamOf(pl),p=G&&G.dip&&t!=null&&G.dip.pen[t];return !!(p&&G.moon.round<=p.until)};

/* ---------- what each relation does ---------- */
{const _ao=attackOptions;attackOptions=function(r,c){const out=_ao.apply(this,arguments),st=G&&G.board[r]&&G.board[r][c];if(!st||!G.dip||!dipOn()||warOn())return out;
  return Array.isArray(out)?out.filter(o=>{const t=G.board[o.r]&&G.board[o.r][o.c];return !(t&&dipAtPeace(st.owner,t.owner))}):out}}
/* every attack at war costs the attacker some of the defender's trust; an attack on an ally (only possible under Total War) breaks the alliance */
{const _at=attack;attack=function(r1,c1,r2,c2,mode){const A=G&&G.board[r1]&&G.board[r1][c1],D=G&&G.board[r2]&&G.board[r2][c2];
  const a=A&&A.owner,d=D&&D.owner,ally=G&&G.dip&&a!=null&&d!=null&&dipAllied(a,d);
  const out=_at.apply(this,arguments);
  if(NET.role!=="guest"&&G&&G.dip&&dipOn()&&a!=null&&d!=null&&!isNPC(a)&&!isNPC(d)&&teamOf(a)!==teamOf(d)){dipTrustAdd(teamOf(d),teamOf(a),-4);if(ally)dipBreakNow(a,teamOf(d),"attack")}
  return out}}

/* ---------- proposals, answers, breaking ---------- */
const dipKindTxt=(k,n)=>k==="peace"?`Peace for ${n} round${n>1?"s":""}`:"an Alliance";
function strengthOfTeam(t){return dipPlayersOf(t).reduce((a,i)=>a+strength(i),0)}
function dipCommonFoe(a,b){return dipTeams().some(c=>c!==a&&c!==b&&dipRel(a,c).s==="war"&&dipRel(b,c).s==="war")}
function aiDipAccept(t,from,kind,n){const tr=dipTrust(t,from),me=strengthOfTeam(t),them=Math.max(1,strengthOfTeam(from));
  if(kind==="peace"){if(tr<=-60)return false;return me<them*1.1||tr>=0||Math.random()<.25+tr/200}
  if(kind==="ally"){if(dipTeams().length<=2)return false;const need=dipRel(t,from).s==="peace"?25:40;return tr>=need&&dipCommonFoe(t,from)}
  return false}
function dipApply(kind,a,b,n){
  if(kind==="peace"){dipSet(a,b,"peace",{until:G.moon.round+n-1,n});dipTrustAdd(a,b,15);dipTrustAdd(b,a,15);
    log(`<b>Peace</b> between ${dipTN(a)} and ${dipTN(b)} for ${n} round${n>1?"s":""}: neither may attack the other.`,"event")}
  else if(kind==="ally"){dipSet(a,b,"ally");dipTrustAdd(a,b,20);dipTrustAdd(b,a,20);
    log(`<b>Alliance</b> between ${dipTN(a)} and ${dipTN(b)}: shared vision, friendly spells, and they surround enemies together.`,"event")}
  render()}
function dipPropose(pl,toT,kind,n){if(!G||!dipOn()||NET.ctx!=null&&NET.ctx!==pl)return false;const a=teamOf(pl);if(a==null||a===toT||!dipTeams().includes(toT))return false;
  n=Math.max(1,Math.min(4,+n||2));const rel=dipRel(a,toT).s;
  if(kind==="peace"&&rel!=="war")return false;if(kind==="ally"&&(rel==="ally"||dipTeams().length<=2))return false;
  const D=dipD();if(D.pend.some(p=>p.ft===a&&p.tt===toT))return false;
  const hum=dipPlayersOf(toT).filter(i=>!G.p[i].cpu);
  log(`${plName(pl)} offers ${dipTN(toT)} ${dipKindTxt(kind,n)}.`,"event");
  if(hum.length){D.pend.push({id:++D.n,from:pl,ft:a,tt:toT,kind,n,to:hum[0],round:G.moon.round});render();return true}
  const yes=aiDipAccept(toT,a,kind,n);
  if(yes)dipApply(kind,a,toT,n);else{log(`${dipTN(toT)} decline${dipPlayersOf(toT).length>1?"":"s"} ${dipKindTxt(kind,n)}.`,"event");if(!G.p[pl].cpu)notify(pl,`${dipTeamName(toT)} declines.`);render()}
  return true}
function dipAnswer(pl,id,yes,counter){if(!G||NET.ctx!=null&&NET.ctx!==pl)return false;const D=dipD(),p=D.pend.find(x=>x.id===id);if(!p||p.to!==pl)return false;
  D.pend.splice(D.pend.indexOf(p),1);
  if(counter&&p.kind==="peace"&&+counter!==p.n){log(`${plName(pl)} answers with ${dipKindTxt("peace",+counter)} instead.`,"event");
    const hum=dipPlayersOf(p.ft).filter(i=>!G.p[i].cpu);
    if(hum.length&&dipRel(p.ft,p.tt).s==="war"){D.pend.push({id:++D.n,from:pl,ft:p.tt,tt:p.ft,kind:"peace",n:+counter,to:hum[0],round:G.moon.round});render();return true}
    if(aiDipAccept(p.ft,p.tt,"peace",+counter))dipApply("peace",p.tt,p.ft,+counter);else log(`${dipTN(p.ft)} decline${dipPlayersOf(p.ft).length>1?"":"s"} the counter.`,"event");render();return true}
  if(yes&&(p.kind!=="ally"||dipTeams().length>2)&&(p.kind!=="peace"||dipRel(p.ft,p.tt).s==="war"))dipApply(p.kind,p.ft,p.tt,p.n);
  else{log(`${plName(pl)} declines ${dipKindTxt(p.kind,p.n)}.`,"event");render()}
  return true}
function dipBreakNow(pl,toT,how){const a=teamOf(pl),rel=dipRel(a,toT).s;if(rel!=="peace"&&rel!=="ally")return false;const tw=warOn();
  dipSet(a,toT,"war");
  const others=dipTeams().filter(t=>t!==a&&t!==toT);
  if(rel==="peace"){dipTrustSet(toT,a,-100);for(const t of others)dipTrustAdd(t,a,-30);
    log(`<b>${plName(pl)} breaks the peace</b> with ${dipTN(toT)}. Their trust is gone${others.length?", and everyone else trusts ${esc(dipTeamName(a))} less":""}.`,"event");
    popup("Peace broken",`<p>${esc(G.p[pl].name)} breaks the peace with ${esc(dipTeamName(toT))}.</p><p>The computers' trust in ${esc(dipTeamName(a))} falls all the way (−100)${others.length?"; every other side trusts them 30 less":""}.</p>`)}
  else{if(tw){dipTrustAdd(toT,a,-30);for(const t of others)dipTrustAdd(t,a,-10)}
    else{dipTrustAdd(toT,a,-70);for(const t of others)dipTrustAdd(t,a,-40);dipD().pen[a]={until:G.moon.round+DIP_PEN_ROUNDS-1}}
    log(`<b>${plName(pl)} ${how==="attack"?"strikes their ally and breaks":"breaks"} the alliance</b> with ${dipTN(toT)}${tw?" under Total War: the Banker looks away, and trust falls less":": the Banker disapproves"}.`,"event");
    popup("Betrayal",tw?`<p>${esc(G.p[pl].name)} breaks the alliance with ${esc(dipTeamName(toT))} under Mercury's Total War.</p><p>In the war of all against all it isn't seen as badly: no penalties from the Bank or the Ether, and trust falls less (−30 with them, −10 with everyone else).</p>`
      :`<p>${esc(G.p[pl].name)} breaks the alliance with ${esc(dipTeamName(toT))}.</p><ul><li>Trust in ${esc(dipTeamName(a))} falls hard: −70 with them, −40 with everyone else.</li><li>For ${DIP_PEN_ROUNDS} rounds the Banker disapproves: Bank loans grow half as fast again, cards from the Ether cost 1d3 − 2 more and other spells 1d4 − 3 more (rolled each turn, never less than their price).</li></ul>`)}
  render();return true}
function dipBreak(pl,toT){if(!G||!dipOn()||NET.ctx!=null&&NET.ctx!==pl)return false;return dipBreakNow(pl,toT,"choice")}
for(const [name,get,set] of [["dipPropose",()=>dipPropose,f=>dipPropose=f],["dipAnswer",()=>dipAnswer,f=>dipAnswer=f],["dipBreak",()=>dipBreak,f=>dipBreak=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}

/* ---------- each round: peace runs out, trust drifts, alliances end when two sides are left, computers propose ---------- */
function dipRound(){if(!dipOn()||NET.role==="guest")return;const D=dipD(),r=G.moon.round,T=dipTeams();
  for(const k in D.rel){const R0=D.rel[k],[a,b]=k.split("|").map(Number);if(!T.includes(a)||!T.includes(b))continue;
    if(R0.s==="peace"&&r>R0.until){R0.s="war";log(`The peace between ${dipTN(a)} and ${dipTN(b)} runs out: war again.`,"event")}
    else if(R0.s==="peace"){dipTrustAdd(a,b,2);dipTrustAdd(b,a,2)}
    else if(R0.s==="ally"){dipTrustAdd(a,b,3);dipTrustAdd(b,a,3)}}
  dipTwoLeft();
  D.pend=D.pend.filter(p=>r-p.round<=2&&T.includes(p.ft)&&T.includes(p.tt));   // an answer not given in two rounds lapses
  for(const t of T){if(!dipCpuTeam(t))continue;const pl=dipPlayersOf(t)[0];
    for(const u of T){if(u===t||D.pend.some(p=>p.ft===t&&p.tt===u))continue;const rel=dipRel(t,u).s,tr=dipTrust(t,u);
      if(rel==="war"&&tr>-50&&strengthOfTeam(t)<strengthOfTeam(u)*.9&&Math.random()<.2){dipPropose(pl,u,"peace",1+R(3));break}
      if(rel==="peace"&&tr>=30&&T.length>2&&dipCommonFoe(t,u)&&Math.random()<.15){dipPropose(pl,u,"ally");break}}}}
function dipTwoLeft(){if(!G||!G.dip||!dipOn())return;const T=dipTeams();if(T.length>2)return;let n=0;
  for(const k in G.dip.rel){const R0=G.dip.rel[k];if(R0.s==="ally"){R0.s="war";n++}}
  if(n){G._vis=null;log("<b>Only two sides are left</b>: every alliance ends (peace is still allowed).","event")}}
{const _cr=cycleRound;cycleRound=async function(){await _cr.apply(this,arguments);if(G&&!G.over)try{dipRound()}catch(e){console.error(e)}}}
{const _el=eliminate;eliminate=function(){const out=_el.apply(this,arguments);try{dipTwoLeft()}catch(e){}return out}}
/* the Banker's disapproval: rolled at the start of each of the betrayer's turns */
{const _bt=bankTurn;bankTurn=function(pl){const P=G&&G.p[pl],pen=P&&dipPenOn(pl);const before=pen?(P.loans||[]).map(L=>L.owed):null;
  const out=_bt.apply(this,arguments);if(!pen)return out;
  P.dipPen={e:Math.max(0,R(3)-2),s:Math.max(0,R(4)-3)};
  (P.loans||[]).forEach((L,i)=>{const d=L.owed-(before[i]||L.owed);if(d>0){const x=Math.ceil(d/2);L.owed+=x;log(`The Banker disapproves of ${plName(pl)}: their loan grows by ${x} more.`)}});
  return out}}
{const _sc=spellCost;spellCost=function(sp){let c=_sc.apply(this,arguments);if(!sp||!G||!G.dip)return c;const pl=G.active,P=G.p[pl];if(!P||!dipPenOn(pl)||!P.dipPen||c<=0)return c;
  return c+(sp.school==="Conjuring"?P.dipPen.e:P.dipPen.s)}}

/* ---------- the flag under the Bank, and the window ---------- */
const dipIncoming=V=>G&&G.dip?G.dip.pend.filter(p=>p.to===V):[];
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;let b=$("#dipbar");
  if(!dipOn()){if(b)b.remove();return}if(!G.dip&&NET.role!=="guest")dipD();const V=view(),me=teamOf(V);if(me==null||isNPC(V))return;
  const T=dipTeams().filter(t=>t!==me),cnt={war:0,peace:0,ally:0};for(const t of T)cnt[dipRel(me,t).s]=(cnt[dipRel(me,t).s]||0)+1;const inc=dipIncoming(V).length;
  if(!b){b=document.createElement("button");b.type="button";b.id="dipbar";b.className="dipbar";b.onclick=()=>dipWin()}
  const slot=$("#bankslot");if(slot&&b.previousElementSibling!==slot)slot.after(b);
  b.classList.toggle("notify",!!inc);
  b.innerHTML=`${FLAG_SVG}<span>Diplomacy</span><small>${[cnt.war?`${cnt.war} at war`:"",cnt.peace?`${cnt.peace} at peace`:"",cnt.ally?`${cnt.ally} allied`:""].filter(Boolean).join(" · ")}</small>${inc?`<i class="bang" aria-label="${inc} proposal${inc>1?"s":""} for you">!</i>`:""}`;
  if($("#dipwin")&&!$("#dipwin").hidden)dipPaint();
  dipAskCheck()}}
let dipUI={brk:null};
function dipRowHTML(me,t,V){const rel=dipRel(me,t),cpu=dipCpuTeam(t),out=G.dip&&G.dip.pend.find(p=>p.ft===me&&p.tt===t),many=dipTeams().length>2,tw=warOn();
  const st=rel.s==="war"?`<b class="dst dwar">War</b>`:rel.s==="peace"?`<b class="dst dpeace">Peace</b> <small>${Math.max(0,rel.until-G.moon.round+1)} round${rel.until-G.moon.round+1===1?"":"s"} left${tw?" · lifted by Total War":""}</small>`:`<b class="dst dally">Alliance</b>`;
  let act="";
  if(out)act=`<span class="dim">Waiting for their answer…</span>`;
  else if(rel.s==="war")act=`<label class="dpn">Peace for <select data-dpn="${t}">${[1,2,3,4].map(n=>`<option value="${n}" ${n===2?"selected":""}>${n} round${n>1?"s":""}</option>`).join("")}</select></label><button type="button" class="btn sm" data-dact="peace|${t}">Offer peace</button>${many?`<button type="button" class="btn ghost sm" data-dact="ally|${t}">Propose an alliance</button>`:""}`;
  else if(rel.s==="peace")act=`${many?`<button type="button" class="btn sm" data-dact="ally|${t}">Propose an alliance</button>`:""}${dipUI.brk===t?`<span class="dsure">Break the peace? Their trust falls all the way. <button type="button" class="btn sm danger" data-dact="brk|${t}">Break it</button> <button type="button" class="btn ghost sm" data-dact="nobrk|${t}">Keep it</button></span>`:`<button type="button" class="btn ghost sm" data-dact="ask|${t}">Break the peace</button>`}`;
  else act=dipUI.brk===t?`<span class="dsure">Break the alliance? ${tw?"Under Total War it costs less.":"Trust falls hard and the Banker disapproves for 8 rounds."} <button type="button" class="btn sm danger" data-dact="brk|${t}">Break it</button> <button type="button" class="btn ghost sm" data-dact="nobrk|${t}">Keep it</button></span>`:`<button type="button" class="btn ghost sm" data-dact="ask|${t}">Break the alliance</button>`;
  return `<div class="diprow" style="--dc:${dipTeamCol(t)}"><div class="dipwho">${dipTN(t)}${G.opts.factions?`<small>${dipPlayersOf(t).map(i=>esc(G.p[i].name)).join(", ")}</small>`:""}</div><div class="dipst">${st}</div><div class="diptr">${cpu?trustChip(dipTrust(t,me)):`<span class="dim" title="People decide for themselves">person</span>`}</div><div class="dipact">${act}</div></div>`}
function dipPaint(){const w=$("#dipwin");if(!w||!G)return;const V=view(),me=teamOf(V);const T=dipTeams().filter(t=>t!==me),inc=dipIncoming(V),pen=dipPenOn(V);
  w.querySelector(".dipbody").innerHTML=`${inc.map(p=>dipIncHTML(p)).join("")}
${pen?`<p class="dippen">The Banker disapproves of you for ${G.dip.pen[me].until-G.moon.round+1} more round${G.dip.pen[me].until-G.moon.round+1===1?"":"s"}: loans grow half as fast again, the Ether and spells cost more.</p>`:""}
<div class="diphead"><span>Side</span><span>Relation</span><span>Their trust in you</span><span></span></div>${T.map(t=>dipRowHTML(me,t,V)).join("")||'<p class="dim">No other side is left.</p>'}
<details class="sub dipnote"><summary>How diplomacy works</summary><ul>
<li>Everyone starts at war.</li><li><b>Peace</b>: neither side may attack the other for 1 to 4 rounds, as agreed. Mercury's Total War lifts it while it lasts. Breaking it makes the computers' trust in you fall all the way.</li>
<li><b>Alliance</b>: shared vision, friendly spells on each other, and surrounding an enemy works as it does for teammates. No shared win: when only two sides are left, every alliance ends by itself.</li>
<li><b>Breaking an alliance</b>: trust falls hard (−70 with them, −40 with everyone else), and for 8 rounds Bank loans grow half as fast again, cards from the Ether cost 1d3 − 2 more and other spells 1d4 − 3 more. Under Total War none of that, and trust falls less.</li>
<li><b>Trust</b> (the computers'): it starts at −20 at war, rises with peace and more with an alliance, and falls with every attack. ${TRUST_BANDS.map(b=>`<span class="trustchip" style="--tc:${b[2]}">${b[1]}</span>`).join(" ")}</li></ul></details>`;
  w.querySelectorAll("[data-dact]").forEach(btn=>btn.onclick=()=>{const [a,t0]=btn.dataset.dact.split("|"),t=+t0;
    if(a==="peace"){const s=w.querySelector(`[data-dpn="${t}"]`);dipPropose(V,t,"peace",s?+s.value:2)}
    else if(a==="ally")dipPropose(V,t,"ally");else if(a==="ask")dipUI.brk=t;else if(a==="nobrk")dipUI.brk=null;else if(a==="brk"){dipUI.brk=null;dipBreak(V,t)}
    dipPaint();render()});
  dipWireInc(w)}
function dipIncHTML(p){const kindT=dipKindTxt(p.kind,p.n);return `<div class="dipinc" data-pid="${p.id}"><p>${plName(p.from)} offers ${p.kind==="peace"?"":"you "}<b>${kindT}</b>${G.opts.factions?` (to the ${esc(dipTeamName(p.tt))})`:""}.</p>
<p class="acts"><button type="button" class="btn sm" data-dans="yes|${p.id}">Accept</button> <button type="button" class="btn ghost sm" data-dans="no|${p.id}">Decline</button>${p.kind==="peace"?` <label class="dpn">or <select data-dcn="${p.id}">${[1,2,3,4].filter(n=>n!==p.n).map(n=>`<option value="${n}">${n} round${n>1?"s":""}</option>`).join("")}</select></label> <button type="button" class="btn ghost sm" data-dans="ctr|${p.id}">Counter</button>`:""}</p></div>`}
function dipWireInc(root){const V=view();root.querySelectorAll("[data-dans]").forEach(b=>b.onclick=()=>{const [a,id0]=b.dataset.dans.split("|"),id=+id0;
  if(a==="ctr"){const s=root.querySelector(`[data-dcn="${id}"]`);dipAnswer(V,id,false,s?+s.value:null)}else dipAnswer(V,id,a==="yes");
  const ask=$("#dipask");if(ask&&root!==ask)ask.hidden=true;if(root.id==="dipask")root.hidden=true;dipPaint();render()})}
function dipWin(){let w=$("#dipwin");if(!w){w=document.createElement("div");w.id="dipwin";w.className="faov";w.innerHTML=`<div class="ovbox wide dipbox" role="dialog" aria-labelledby="diph"><button type="button" class="xclose" id="dipX" aria-label="Close">×</button><h2 id="diph">${FLAG_SVG} Diplomacy</h2><div class="dipbody"></div><p class="acts"><button type="button" class="btn" id="dipOk">Done</button></p></div>`;document.body.appendChild(w);
  const close=()=>{w.hidden=true;dipUI.brk=null};$("#dipX").onclick=$("#dipOk").onclick=close;w.onclick=e=>{if(e.target===w)close()}}
  w.hidden=false;dipPaint()}
/* a proposal for you: it asks at once (online), or when your turn comes round (on one device) */
const dipAsked=new Set();
function dipAskCheck(){if(!G||G.over||G.passing)return;const V=view();if(!G.p[V]||G.p[V].cpu)return;const p=dipIncoming(V).find(x=>!dipAsked.has(x.id));if(!p)return;
  if(document.querySelector("#ov:not([hidden]),#dipwin:not([hidden])"))return;dipAsked.add(p.id);
  let a=$("#dipask");if(!a){a=document.createElement("div");a.id="dipask";a.className="faov";document.body.appendChild(a)}
  a.innerHTML=`<div class="ovbox dipbox" role="alertdialog" aria-labelledby="dipah"><h2 id="dipah">${FLAG_SVG} A proposal</h2>${dipIncHTML(p)}<p class="dim">It stays in Diplomacy (under the Bank) for two rounds if you'd rather decide later. <button type="button" class="link" id="dipLater">Later</button></p></div>`;
  a.hidden=false;dipWireInc(a);$("#dipLater").onclick=()=>{a.hidden=true}}

if(window.__EC)Object.assign(window.__EC,{dipPropose:(...a)=>dipPropose(...a),dipAnswer:(...a)=>dipAnswer(...a),dipBreak:(...a)=>dipBreak(...a),dipRel:(a,b)=>dipRel(a,b),dipTrust:(a,b)=>dipTrust(a,b),dipRound:()=>dipRound(),dipOn:()=>dipOn(),dipWin:()=>dipWin(),trustBand:v=>trustBand(v)});
