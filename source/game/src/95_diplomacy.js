/* ---------- v75b: Diplomacy (Factions by default; an option in Free For All) ----------
   Under the Bank, a flag opens Diplomacy. Relations are between sides: each player in Free For All, each faction in Factions.
   - Everyone starts at war.
   - Peace (a pact of non-aggression): neither side can attack the other for 1 to 4 rounds, as agreed; then war again unless
     renewed. Mercury's Total War lifts it while it lasts. Breaking a peace: the computers' trust in you falls all the way.
   - Alliance: shared vision, friendly spells on each other, and surrounding an enemy works as it does for teammates. There
     is no shared win: when only two sides are left every alliance breaks by itself (peace is still allowed).
   - Breaking an alliance: everyone's trust in you falls hard, and for 8 rounds the Banker disapproves: your Bank loans
     grow half as fast again, cards from the Ether cost 1d3 − 2 more (−1 to +1) and other spells 1d4 − 3 more (−2 to +1),
     rolled each turn, so the dice can also make them cheaper (never below 0). Under Mercury's Total War none of that applies and the trust falls less.
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
function dipSet(a,b,s,extra){const D=dipD();D.rel[dipKey(a,b)]=Object.assign({s,since:G.moon.round},extra||{});G._vis=null;
  if(s!=="ally"&&D.deals)D.deals=D.deals.filter(d=>!(d.ft===a&&d.tt===b||d.ft===b&&d.tt===a))}   // v75c: trade deals end with the alliance
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
const dipKindTxt=(k,n,tr)=>k==="terms"?`terms of war: ${tr&&DIP_TERMS[tr.term]?DIP_TERMS[tr.term].name:""}`:k==="peace"?`Peace for ${n} round${n>1?"s":""}`:k==="trade"?`a trade deal for ${n} round${n>1?"s":""} (${tr?tr.a:0} mana a round from them, ${tr?tr.b:0} back)`:"an Alliance";
/* v75c: envoys: Jokers sent as diplomats (two a player); each is a point with the side it is sent to */
const envoysOf=pl=>G.p[pl]&&G.p[pl].envoys||[];
const envoyPts=(from,to)=>dipPlayersOf(from).reduce((a,i)=>a+envoysOf(i).filter(e=>e.to===to).length,0);
function strengthOfTeam(t){return dipPlayersOf(t).reduce((a,i)=>a+strength(i),0)}
function dipCommonFoe(a,b){return dipTeams().some(c=>c!==a&&c!==b&&dipRel(a,c).s==="war"&&dipRel(b,c).s==="war")}
function aiDipAccept(t,from,kind,n,terms){const tr=dipTrust(t,from)+10*envoyPts(from,t),me=strengthOfTeam(t),them=Math.max(1,strengthOfTeam(from));   // v75c: every envoy counts for 10
  if(kind==="terms"){if(dipRel(t,from).s!=="war"||tr<=-60)return false;return me>=them*.9||Math.random()<.4}
  if(kind==="trade"){if(dipRel(t,from).s!=="ally"||!terms)return false;return terms.a>=terms.b||tr>=40&&terms.b-terms.a<=1}
  if(kind==="peace"){if(tr<=-60)return false;return me<them*1.1||tr>=0||Math.random()<.25+tr/200}
  if(kind==="ally"){if(dipTeams().length<=2)return false;const need=dipRel(t,from).s==="peace"?25:40;return tr>=need&&dipCommonFoe(t,from)}
  return false}
function dipApply(kind,a,b,n,terms){
  if(kind==="terms"){dipTermsStart(a,b,terms.term);render();return}
  if(kind==="trade"){(dipD().deals=dipD().deals||[]).push({ft:a,tt:b,a:terms.a,b:terms.b,until:G.moon.round+n-1});
    log(`<b>A trade deal</b> between ${dipTN(a)} and ${dipTN(b)} for ${n} round${n>1?"s":""}: ${dipTN(a)} send${dipPlayersOf(a).length>1?"":"s"} ${terms.a} mana a round, ${dipTN(b)} ${terms.b}.`,"event");render();return}
  if(kind==="peace"){dipSet(a,b,"peace",{until:G.moon.round+n-1,n});dipTrustAdd(a,b,15);dipTrustAdd(b,a,15);
    log(`<b>Peace</b> between ${dipTN(a)} and ${dipTN(b)} for ${n} round${n>1?"s":""}: neither may attack the other.`,"event")}
  else if(kind==="ally"){dipSet(a,b,"ally");dipTrustAdd(a,b,20);dipTrustAdd(b,a,20);
    log(`<b>Alliance</b> between ${dipTN(a)} and ${dipTN(b)}: shared vision, friendly spells, and they surround enemies together.`,"event")}
  render()}
function dipPropose(pl,toT,kind,n,terms){if(!G||!dipOn()||NET.ctx!=null&&NET.ctx!==pl)return false;const a=teamOf(pl);if(a==null||a===toT||!dipTeams().includes(toT))return false;
  n=Math.max(1,Math.min(4,+n||2));const rel=dipRel(a,toT).s;
  if(kind==="terms"){if(rel!=="war"||!terms||!DIP_TERMS[terms.term]||(dipD().contests||[]).some(c=>c.a===a&&c.b===toT||c.a===toT&&c.b===a))return false;terms={term:terms.term}}
  if(kind==="trade"){if(rel!=="ally"||!terms)return false;terms={a:Math.max(0,Math.min(5,+terms.a|0)),b:Math.max(0,Math.min(5,+terms.b|0))};if(!terms.a&&!terms.b)return false}
  if(kind==="peace"&&rel!=="war")return false;if(kind==="ally"&&(rel==="ally"||dipTeams().length<=2))return false;
  const D=dipD();if(D.pend.some(p=>p.ft===a&&p.tt===toT))return false;
  const hum=dipPlayersOf(toT).filter(i=>!G.p[i].cpu);
  const tx=kind==="terms"?dipKindTxt("terms",n,terms):kind==="trade"?`a trade deal for ${n} round${n>1?"s":""}: ${terms.a} mana a round to them, ${terms.b} back`:dipKindTxt(kind,n);
  log(`${plName(pl)} offers ${dipTN(toT)} ${tx}.`,"event");
  if(hum.length){D.pend.push({id:++D.n,from:pl,ft:a,tt:toT,kind,n,tr:terms||null,to:hum[0],round:G.moon.round});render();return true}
  const yes=aiDipAccept(toT,a,kind,n,terms);
  if(yes)dipApply(kind,a,toT,n,terms);else{log(`${dipTN(toT)} decline${dipPlayersOf(toT).length>1?"":"s"} ${tx}.`,"event");if(!G.p[pl].cpu)notify(pl,`${dipTeamName(toT)} declines.`);render()}
  return true}
function dipAnswer(pl,id,yes,counter){if(!G||NET.ctx!=null&&NET.ctx!==pl)return false;const D=dipD(),p=D.pend.find(x=>x.id===id);if(!p||p.to!==pl)return false;
  D.pend.splice(D.pend.indexOf(p),1);
  if(counter&&p.kind==="peace"&&+counter!==p.n){log(`${plName(pl)} answers with ${dipKindTxt("peace",+counter)} instead.`,"event");
    const hum=dipPlayersOf(p.ft).filter(i=>!G.p[i].cpu);
    if(hum.length&&dipRel(p.ft,p.tt).s==="war"){D.pend.push({id:++D.n,from:pl,ft:p.tt,tt:p.ft,kind:"peace",n:+counter,to:hum[0],round:G.moon.round});render();return true}
    if(aiDipAccept(p.ft,p.tt,"peace",+counter))dipApply("peace",p.tt,p.ft,+counter);else log(`${dipTN(p.ft)} decline${dipPlayersOf(p.ft).length>1?"":"s"} the counter.`,"event");render();return true}
  if(yes&&(p.kind!=="ally"||dipTeams().length>2)&&(p.kind!=="peace"||dipRel(p.ft,p.tt).s==="war")&&(p.kind!=="trade"||dipRel(p.ft,p.tt).s==="ally")&&(p.kind!=="terms"||dipRel(p.ft,p.tt).s==="war"))dipApply(p.kind,p.ft,p.tt,p.n,p.tr);
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
      :`<p>${esc(G.p[pl].name)} breaks the alliance with ${esc(dipTeamName(toT))}.</p><ul><li>Trust in ${esc(dipTeamName(a))} falls hard: −70 with them, −40 with everyone else.</li><li>For ${DIP_PEN_ROUNDS} rounds the Banker disapproves: Bank loans grow half as fast again, cards from the Ether cost 1d3 − 2 more (−1 to +1) and other spells 1d4 − 3 more (−2 to +1), rolled each turn: the dice can also make them cheaper (never below 0).</li></ul>`)}
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
  /* v75c: trade deals pay each round; envoys raise the trust of the side they are with */
  for(const d of [...(D.deals||[])]){if(dipRel(d.ft,d.tt).s!=="ally"||!T.includes(d.ft)||!T.includes(d.tt)){D.deals.splice(D.deals.indexOf(d),1);continue}
    if(r>d.until){D.deals.splice(D.deals.indexOf(d),1);log(`The trade deal between ${dipTN(d.ft)} and ${dipTN(d.tt)} ends.`,"event");continue}
    const pa=dipPlayersOf(d.ft)[0],pb=dipPlayersOf(d.tt)[0];
    if(mana(pa)<d.a||mana(pb)<d.b){const who=mana(pa)<d.a?d.ft:d.tt,other=who===d.ft?d.tt:d.ft;D.deals.splice(D.deals.indexOf(d),1);dipTrustAdd(other,who,-10);
      log(`${dipTN(who)} can't pay the trade deal with ${dipTN(other)}: it ends, and trust falls.`,"event");continue}
    if(d.a)giveMana(pb,payQuiet(pa,d.a));if(d.b)giveMana(pa,payQuiet(pb,d.b));
    log(`Trade: ${dipTN(d.ft)} send${dipPlayersOf(d.ft).length>1?"":"s"} ${d.a} mana, ${dipTN(d.tt)} ${d.b}.`)}
  for(const P of G.p){if(!P.envoys||!P.envoys.length)continue;
    for(const e of [...P.envoys]){if(P.out||!T.includes(e.to)){P.envoys.splice(P.envoys.indexOf(e),1);if(!P.out){P.deck.push(e.card);shuffle(P.deck);log(`${plName(P.i)}'s envoy comes home to the deck: the side it was with is gone.`)}continue}
      if(dipCpuTeam(e.to))dipTrustAdd(e.to,P.team,4)}}
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
  P.dipPen={e:R(3)-2,s:R(4)-3};   // 1d3 − 2 (−1 to +1) and 1d4 − 3 (−2 to +1): the dice can go below zero
  (P.loans||[]).forEach((L,i)=>{const d=L.owed-(before[i]||L.owed);if(d>0){const x=Math.ceil(d/2);L.owed+=x;log(`The Banker disapproves of ${plName(pl)}: their loan grows by ${x} more.`)}});
  return out}}
{const _sc=spellCost;spellCost=function(sp){let c=_sc.apply(this,arguments);if(!sp||!G||!G.dip)return c;const pl=G.active,P=G.p[pl];if(!P||!dipPenOn(pl)||!P.dipPen||c<=0)return c;
  return Math.max(0,c+(sp.school==="Conjuring"?P.dipPen.e:P.dipPen.s))}}

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
  else if(rel.s==="war")act=`<label class="dpn">Peace for <select data-dpn="${t}">${[1,2,3,4].map(n=>`<option value="${n}" ${n===2?"selected":""}>${n} round${n>1?"s":""}</option>`).join("")}</select></label><button type="button" class="btn sm" data-dact="peace|${t}">Offer peace</button>${many?`<button type="button" class="btn ghost sm" data-dact="ally|${t}">Propose an alliance</button>`:""}${dipContest(me,t)?"":`<label class="dpn">or settle by <select data-dterm="${t}">${Object.entries(DIP_TERMS).map(([k,v])=>`<option value="${k}" title="${esc(v.tip)}">${esc(v.name)}</option>`).join("")}</select></label><button type="button" class="btn ghost sm" data-dact="terms|${t}" title="Terms of war: the side that wins them takes tribute, and Peace follows for 2 rounds">Propose terms</button>`}`;
  else if(rel.s==="peace")act=`${many?`<button type="button" class="btn sm" data-dact="ally|${t}">Propose an alliance</button>`:""}${dipUI.brk===t?`<span class="dsure">Break the peace? Their trust falls all the way. <button type="button" class="btn sm danger" data-dact="brk|${t}">Break it</button> <button type="button" class="btn ghost sm" data-dact="nobrk|${t}">Keep it</button></span>`:`<button type="button" class="btn ghost sm" data-dact="ask|${t}">Break the peace</button>`}`;
  else act=dipAllyTools(me,t,V)+(dipUI.brk===t?`<span class="dsure">Break the alliance? ${tw?"Under Total War it costs less.":"Trust falls hard and the Banker disapproves for 8 rounds."} <button type="button" class="btn sm danger" data-dact="brk|${t}">Break it</button> <button type="button" class="btn ghost sm" data-dact="nobrk|${t}">Keep it</button></span>`:`<button type="button" class="btn ghost sm" data-dact="ask|${t}">Break the alliance</button>`);
  return `<div class="diprow" style="--dc:${dipTeamCol(t)}"><div class="dipwho">${dipTN(t)}${G.opts.factions?`<small>${dipPlayersOf(t).map(i=>esc(G.p[i].name)).join(", ")}</small>`:""}${envoyPts(me,t)?`<small class="envn">✉ ${envoyPts(me,t)} envoy${envoyPts(me,t)>1?"s":""} of yours with them</small>`:""}${envoyPts(t,me)?`<small class="envn">✉ ${envoyPts(t,me)} of their envoys with you</small>`:""}</div><div class="dipst">${st}${dipContestHTML(me,t)}</div><div class="diptr">${cpu?trustChip(dipTrust(t,me)):`<span class="dim" title="People decide for themselves">person</span>`}</div><div class="dipact">${act}</div></div>`}
function dipPaint(){const w=$("#dipwin");if(!w||!G)return;const V=view(),me=teamOf(V);const T=dipTeams().filter(t=>t!==me),inc=dipIncoming(V),pen=dipPenOn(V);
  w.querySelector(".dipbody").innerHTML=`${inc.map(p=>dipIncHTML(p)).join("")}${dipCouncilLine()}
${pen?`<p class="dippen">The Banker disapproves of you for ${G.dip.pen[me].until-G.moon.round+1} more round${G.dip.pen[me].until-G.moon.round+1===1?"":"s"}: loans grow half as fast again, the Ether and spells cost more.</p>`:""}
<div class="diphead"><span>Side</span><span>Relation</span><span>Their trust in you</span><span></span></div>${T.map(t=>dipRowHTML(me,t,V)).join("")||'<p class="dim">No other side is left.</p>'}
${dipEnvoyHTML(V,T)}
<section class="dipsec dipp2p"><h3>Loans between players</h3>${p2pHTML(V)}</section>
<details class="sub dipnote"><summary>How diplomacy works</summary><ul>
<li>Everyone starts at war.</li><li><b>Peace</b>: neither side may attack the other for 1 to 4 rounds, as agreed. Mercury's Total War lifts it while it lasts. Breaking it makes the computers' trust in you fall all the way.</li>
<li><b>Alliance</b>: shared vision, friendly spells on each other, and surrounding an enemy works as it does for teammates. No shared win: when only two sides are left, every alliance ends by itself.</li>
<li><b>Breaking an alliance</b>: trust falls hard (−70 with them, −40 with everyone else), and for 8 rounds Bank loans grow half as fast again, cards from the Ether cost 1d3 − 2 more (−1 to +1) and other spells 1d4 − 3 more (−2 to +1), rolled each turn. Under Total War none of that, and trust falls less.</li>
<li><b>Envoys</b>: a Joker from your hand or the field can go as your diplomat, two at most. Each envoy is a point with the side it is with: a computer side trusts you 4 more every round, and counts it for 10 more when you propose. Recalled, it goes back into your deck as it was; souls it had captured go to the grave when it leaves the field.</li>
<li><b>Allies</b> can give each other mana or a card from the hand, and agree trade deals: mana each round, each way, for 1 to 4 rounds. A deal one side can't pay ends, and trust falls.</li>
<li><b>Terms of war</b> (between sides at war, both agreeing): first to kill an Ace of the other (or the Tree, when a Jester has one on the field), within 8 rounds; holding the middle longest over 4 rounds (the middle tiles are outlined in red while it runs; each round's end, whoever holds more of them scores); or the most value killed over 4 rounds (each card killed scores its soul's worth). The winner takes 2 + 1d6 mana in tribute, and Peace follows for 2 rounds; a tie brings the peace without tribute.</li>
<li><b>The Council</b> meets on the first round after every cycle (every 8 rounds): one resolution, put to a vote; each player has a vote, and one more for each envoy they have out. More votes for than against passes it for 8 rounds.</li>
<li><b>Loans between players</b> are asked and answered here; a computer lends by its trust in you.</li>
<li><b>Trust</b> (the computers'): it starts at −20 at war, rises with peace and more with an alliance, and falls with every attack. ${TRUST_BANDS.map(b=>`<span class="trustchip" style="--tc:${b[2]}">${b[1]}</span>`).join(" ")}</li></ul></details>`;
  w.querySelectorAll("[data-dact]").forEach(btn=>btn.onclick=()=>{const [a,t0]=btn.dataset.dact.split("|"),t=+t0;
    if(a==="peace"){const s=w.querySelector(`[data-dpn="${t}"]`);dipPropose(V,t,"peace",s?+s.value:2)}
    else if(a==="ally")dipPropose(V,t,"ally");
    else if(a==="gm"){const s=w.querySelector(`[data-dgm="${t}"]`);dipGift(V,t,"mana",s?+s.value:1)}
    else if(a==="gc"){const s=w.querySelector(`[data-dgc="${t}"]`);if(s&&s.value)dipGift(V,t,"card",+s.value)}
    else if(a==="terms"){const s=w.querySelector(`[data-dterm="${t}"]`);if(s)dipPropose(V,t,"terms",2,{term:s.value})}
    else if(a==="trade"){const g=k=>{const s=w.querySelector(`[data-${k}="${t}"]`);return s?+s.value:0};dipPropose(V,t,"trade",g("dtr")||2,{a:g("dta"),b:g("dtb")})}
    else if(a==="ask")dipUI.brk=t;else if(a==="nobrk")dipUI.brk=null;else if(a==="brk"){dipUI.brk=null;dipBreak(V,t)}
    dipPaint();render()});
  w.querySelectorAll("[data-drec]").forEach(b=>b.onclick=()=>{dipRecall(V,+b.dataset.drec);dipPaint();render()});
  const eg=w.querySelector("#dipEGo");if(eg)eg.onclick=()=>{const j=w.querySelector("#dipEJ"),t=w.querySelector("#dipET");if(j&&t)dipEnvoy(V,+j.value,+t.value);dipPaint();render()};
  dipWireP2P(w,V);dipWireInc(w)}
function dipIncHTML(p){const kindT=dipKindTxt(p.kind,p.n,p.tr);return `<div class="dipinc" data-pid="${p.id}"><p>${plName(p.from)} offers ${p.kind==="peace"?"":"you "}<b>${kindT}</b>${G.opts.factions?` (to the ${esc(dipTeamName(p.tt))})`:""}.</p>
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

/* ---------- v75c: envoys, gifts and trade between allies, and the loans between players (moved here from the Bank) ---------- */
function dipJokersOf(pl){const P=G.p[pl],out=[];for(const c of P.hand)if(kind(c)==="joker")out.push({c,where:"hand"});
  for(const {st,r,c} of stacksOf(pl))for(const x of st.cards)if(kind(x)==="joker")out.push({c:x,where:coord(r,c)});return out}
function dipEnvoyHTML(V,T){const my=envoysOf(V),js=dipJokersOf(V),mine=G.active===V&&canAct()&&G.phase!=="setup";
  return `<section class="dipsec"><h3>Envoys <small class="dim">${my.length}/2</small></h3>
${my.length?`<ul class="envl">${my.map((e,i)=>`<li>${esc(nameOf(e.card))} with ${dipTN(e.to)} <button type="button" class="btn ghost sm" data-drec="${i}" ${mine?"":"disabled"}>Recall to the deck</button></li>`).join("")}</ul>`:""}
${my.length<2?(js.length&&T.length?`<p class="envform"><label>Send <select id="dipEJ">${js.map(j=>`<option value="${j.c.id}">${esc(nameOf(j.c))} (${esc(j.where)})</option>`).join("")}</select></label> <label>to <select id="dipET">${T.map(t=>`<option value="${t}">${esc(dipTeamName(t))}</option>`).join("")}</select></label> <button type="button" class="btn sm" id="dipEGo" ${mine?"":"disabled"}>Send as envoy</button>${mine?"":` <small class="dim">on your turn</small>`}</p>`
  :`<p class="dim">No Joker in your hand or on the field to send.</p>`):""}</section>`}
function dipAllyTools(me,t,V){const P=G.p[V],deals=(G.dip&&G.dip.deals||[]).filter(d=>d.ft===me&&d.tt===t||d.ft===t&&d.tt===me),op=n=>Array.from({length:n},(_,i)=>`<option value="${i}">${i}</option>`).join("");
  return `<details class="diptools"><summary>Gifts and trade${deals.length?` <small>(${deals.length} deal${deals.length>1?"s":""})</small>`:""}</summary>
${deals.map(d=>`<p class="dim">Deal until round ${d.until}: you send ${d.ft===me?d.a:d.b} mana a round, they send ${d.ft===me?d.b:d.a}.</p>`).join("")}
<p><label>Give <select data-dgm="${t}">${[1,2,3,4,5,6,8].map(n=>`<option>${n}</option>`).join("")}</select> mana</label> <button type="button" class="btn ghost sm" data-dact="gm|${t}">Give</button></p>
${P.hand.length?`<p><label>Give a card <select data-dgc="${t}">${P.hand.map(c=>`<option value="${c.id}">${esc(nameOf(c))}</option>`).join("")}</select></label> <button type="button" class="btn ghost sm" data-dact="gc|${t}">Give</button></p>`:""}
<p><label>Each round for <select data-dtr="${t}">${[1,2,3,4].map(n=>`<option ${n===2?"selected":""}>${n}</option>`).join("")}</select> rounds: you send <select data-dta="${t}">${op(6)}</select> and they send <select data-dtb="${t}">${op(6)}</select> mana</label> <button type="button" class="btn ghost sm" data-dact="trade|${t}">Propose a trade</button></p></details>`}
function dipEnvoy(pl,cardId,toT){if(!G||!dipOn()||NET.ctx!=null&&NET.ctx!==pl)return false;const P=G.p[pl];if(G.active!==pl||envoysOf(pl).length>=2||toT===P.team||!dipTeams().includes(toT))return false;
  let card=null;const hi=P.hand.findIndex(c=>c.id===cardId&&kind(c)==="joker");
  if(hi>=0)card=P.hand.splice(hi,1)[0];
  else for(const {st,r,c} of stacksOf(pl)){const i=st.cards.findIndex(x=>x.id===cardId&&kind(x)==="joker");if(i<0)continue;card=st.cards.splice(i,1)[0];if(!st.cards.length)G.board[r][c]=null;break}
  if(!card)return false;
  const souls=card.captured||[];card.captured=[];for(const x of souls)toGrave(x,"death");   // its captured souls go to the grave as it leaves the field
  (P.envoys=P.envoys||[]).push({card,to:toT});
  log(`${plName(pl)} sends ${esc(nameOf(card))} as an envoy to ${dipTN(toT)}${souls.length?` (the ${souls.length} soul${souls.length>1?"s":""} it held go to the grave)`:""}.`,"event");G._vis=null;render();return true}
function dipRecall(pl,i){if(!G||NET.ctx!=null&&NET.ctx!==pl)return false;const P=G.p[pl],e=envoysOf(pl)[i];if(!e||G.active!==pl)return false;
  P.envoys.splice(i,1);P.deck.push(e.card);shuffle(P.deck);log(`${plName(pl)} recalls the envoy from ${dipTN(e.to)}: ${esc(nameOf(e.card))} goes back into the deck.`,"event");render();return true}
function dipGift(pl,toT,what,val){if(!G||!dipOn()||NET.ctx!=null&&NET.ctx!==pl)return false;const a=teamOf(pl);if(dipRel(a,toT).s!=="ally")return false;const to=dipPlayersOf(toT)[0];if(to==null)return false;
  if(what==="mana"){const n=Math.min(Math.max(1,+val|0),mana(pl));if(n<=0){if(!G.p[pl].cpu)flash("You have no mana to give.");return false}
    const got=giveMana(to,payQuiet(pl,n));if(dipCpuTeam(toT))dipTrustAdd(toT,a,Math.min(12,2*n));log(`${plName(pl)} gives ${plName(to)} ${n} mana${got<n?` (${got} fit)`:""}.`,"event")}
  else{const P=G.p[pl],i=P.hand.findIndex(c=>c.id===+val);if(i<0)return false;const c=P.hand.splice(i,1)[0],Q=G.p[to];c.owner=to;
    if(Q.hand.length<handCap(to))Q.hand.push(c);else{Q.deck.push(c);shuffle(Q.deck)}if(dipCpuTeam(toT))dipTrustAdd(toT,a,3);log(`${plName(pl)} gives ${plName(to)} a card from the hand.`,"event")}
  render();return true}
for(const [name,get,set] of [["dipEnvoy",()=>dipEnvoy,f=>dipEnvoy=f],["dipRecall",()=>dipRecall,f=>dipRecall=f],["dipGift",()=>dipGift,f=>dipGift=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}
/* the loans between players: in Diplomacy while it is on (the Bank keeps its own loans and the land) */
function dipWireP2P(w,V){const re=()=>{dipPaint();render()};
  w.querySelectorAll("[data-lend]").forEach(b=>b.onclick=()=>{const L=p2pOf().find(x=>x.id===+b.dataset.lend);const d=w.querySelector(`[data-ldue="${b.dataset.lend}"]`);if(L)answerLoan(L,true,d?+d.value:P2P_DUE);re()});
  w.querySelectorAll("[data-nolend]").forEach(b=>b.onclick=()=>{const L=p2pOf().find(x=>x.id===+b.dataset.nolend);if(L)answerLoan(L,false);re()});
  w.querySelectorAll("[data-repay]").forEach(b=>b.onclick=()=>{const L=p2pOf().find(x=>x.id===+b.dataset.repay);if(L)repayLoan(L,L.owed);re()});
  const go=w.querySelector("#p2pGo");if(go)go.onclick=()=>{askLoan(V,+w.querySelector("#p2pTo").value,+w.querySelector("#p2pN").value);re()}}
{const _ob=openBank;openBank=function(){_ob.apply(this,arguments);if(!dipOn())return;const box=$("#ov .ovbox.bank");if(!box)return;
  const t=box.querySelector('[data-bt="p2p"]'),sec=box.querySelector(".btab.p2p");if(t)t.remove();if(sec)sec.remove();
  if(!box.querySelector(".btab:not([hidden])")){const b=box.querySelector('[data-bt="bank"]');if(b)b.click()}
  const tabs=box.querySelector(".btabs");if(tabs&&!box.querySelector(".dipp2pnote"))tabs.insertAdjacentHTML("afterend",`<p class="dim dipp2pnote">Loans between players are in Diplomacy, under the Bank.</p>`)}}
/* a computer lends by its trust in you */
{const _al=aiLend;aiLend=function(L){if(!dipOn())return _al.apply(this,arguments);const m=mana(L.to);if(m<L.n+3)return false;
  const tr=dipTrust(teamOf(L.to),teamOf(L.from))+10*envoyPts(teamOf(L.from),teamOf(L.to));if(tr<-30)return false;if(tr>=30)return true;return Math.random()<.25+(tr+30)/120}}
if(window.__EC)Object.assign(window.__EC,{dipEnvoy:(...a)=>dipEnvoy(...a),dipRecall:(...a)=>dipRecall(...a),dipGift:(...a)=>dipGift(...a),dipJokersOf:pl=>dipJokersOf(pl)});

/* ---------- v75d: terms of war, and the Council ----------
   Terms of war (two sides at war, both agreeing): the first to kill an Ace of the other (or the Tree, when a Jester has
   one on the field) within 8 rounds; holding the middle longest over 4 rounds (the middle tiles are outlined in red while
   it runs, and at each round's end whoever holds more of them scores); or the most value killed over 4 rounds (each card
   killed scores its soul's worth). The winner takes 2 + 1d6 mana in tribute, and Peace follows for 2 rounds; a tie
   brings the peace without tribute.
   The Council meets on the first round after every cycle (every 8 rounds): one resolution, put to a vote. Each player has
   a vote, and one more for each envoy they have out. More votes for than against passes it until the next Council. */
const DIP_TERMS={ace:{name:"First to kill an Ace",tip:"The first side to kill an Ace of the other (or the Tree, when a Jester has one on the field) within 8 rounds wins."},
  middle:{name:"Hold the middle longest",tip:"Over 4 rounds the middle tiles are outlined in red on the field; at each round's end, whoever holds more of them scores."},
  value:{name:"Most value killed",tip:"Over 4 rounds, each card killed scores its soul's worth in mana for the side that killed it."}};
const dipContest=(a,b)=>(G.dip&&G.dip.contests||[]).find(c=>c.a===a&&c.b===b||c.a===b&&c.b===a)||null;
function dipContestHTML(me,t){const c=dipContest(me,t);if(!c)return "";const mine=c.a===me?c.sa:c.sb,theirs=c.a===me?c.sb:c.sa;
  return `<small class="dterm" title="${esc(DIP_TERMS[c.term].tip)}">Terms: ${esc(DIP_TERMS[c.term].name)}${c.term==="ace"?"":` · you ${mine}, them ${theirs}`} · until round ${c.until}</small>`}
function dipTermsStart(a,b,term){const D=dipD(),r=G.moon.round;(D.contests=D.contests||[]).push({a,b,term,from:r,until:r+(term==="ace"?7:3),sa:0,sb:0});
  log(`<b>Terms of war</b> between ${dipTN(a)} and ${dipTN(b)}: ${DIP_TERMS[term].name.toLowerCase()}${term==="ace"?" (within 8 rounds)":" (over 4 rounds)"}. The winner takes tribute, and Peace follows.`,"event");
  popup("Terms of war",`<p>${esc(dipTeamName(a))} and ${esc(dipTeamName(b))} agree on terms: <b>${DIP_TERMS[term].name}</b>.</p><p>${DIP_TERMS[term].tip}</p><p>The winner takes 2 + 1d6 mana from the other in tribute, and Peace follows for 2 rounds; a tie brings the peace without tribute.</p>`);
  G._vis=null}
function dipTermsEnd(c,win){const D=dipD();D.contests=(D.contests||[]).filter(x=>x!==c);const lose=win==null?null:win===c.a?c.b:c.a;
  if(win!=null){const pw=dipPlayersOf(win)[0],pl=dipPlayersOf(lose)[0],n=pl!=null&&pw!=null?Math.min(mana(pl),2+R(6)):0;if(n>0)giveMana(pw,payQuiet(pl,n));
    log(`<b>${esc(dipTeamName(win))} win${dipPlayersOf(win).length>1?"":"s"} the terms</b> (${DIP_TERMS[c.term].name.toLowerCase()})${n?`: ${dipTN(lose)} pay${dipPlayersOf(lose).length>1?"":"s"} ${n} mana in tribute`:""}. Peace for 2 rounds.`,"event")}
  else log(`The terms between ${dipTN(c.a)} and ${dipTN(c.b)} end in a tie: Peace for 2 rounds, no tribute.`,"event");
  if(dipRel(c.a,c.b).s==="war")dipSet(c.a,c.b,"peace",{until:G.moon.round+1,n:2});render()}
/* the middle of any field: the tiles within one of its center (off the void) */
function dipMidTiles(){const rows=G.rows,cols=G.board[0].length,rc=(rows-1)/2,cc=(cols-1)/2,out=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(Math.abs(r-rc)<=1&&Math.abs(c-cc)<=1&&!isVoid(r,c))out.push([r,c]);return out}
const dipSideWorth=t=>{const ps=new Set(dipPlayersOf(t));let w=0;const aces=new Set();
  for(let r=0;r<G.rows;r++)for(let c=0;c<G.board[0].length;c++){const st=G.board[r][c];if(!st||!ps.has(st.owner))continue;for(const x of st.cards){w+=soulOf(x);const k=kind(x);if(k==="ace"||k==="tree")aces.add(x.id)}}
  return {w,aces}};
/* every attack: an Ace (or the Tree) killed, and the value killed, for the terms between the two sides */
{const _at=attack;attack=function(r1,c1,r2,c2,mode){const A=G&&G.board[r1]&&G.board[r1][c1],D=G&&G.board[r2]&&G.board[r2][c2];
  const on=NET.role!=="guest"&&G&&G.dip&&dipOn()&&A&&D;const ta=on?teamOf(A.owner):null,td=on?teamOf(D.owner):null;
  const c=on&&ta!==td?dipContest(ta,td):null,res=on&&G.dip.council&&G.moon.round<=G.dip.council.until?G.dip.council.id:null;
  if(res==="wartax"&&on&&!isNPC(A.owner)&&mana(A.owner)>0){const p=payQuiet(A.owner,1);if(typeof bankAdd==="function")bankAdd(p);log(`The Council's War Tax: ${plName(A.owner)} pays 1 mana to attack.`)}
  const b4=c?{a:dipSideWorth(ta),d:dipSideWorth(td)}:null;
  const out=_at.apply(this,arguments);
  if(c&&dipContest(ta,td)===c){const af={a:dipSideWorth(ta),d:dipSideWorth(td)};
    if(c.term==="ace"){const lostD=[...b4.d.aces].some(id=>!af.d.aces.has(id)),lostA=[...b4.a.aces].some(id=>!af.a.aces.has(id));if(lostD||lostA){dipTermsEnd(c,lostD&&!lostA?ta:lostA&&!lostD?td:null);return out}}
    else if(c.term==="value"){const kd=Math.max(0,b4.d.w-af.d.w),ka=Math.max(0,b4.a.w-af.a.w);if(c.a===ta){c.sa+=kd;c.sb+=ka}else{c.sb+=kd;c.sa+=ka}}}
  return out}}
/* each round: the middle scores, terms run out, and the Council */
function dipTermsRound(){const D=G.dip;if(!D||!D.contests||!D.contests.length)return;const r=G.moon.round,mid=dipMidTiles();
  for(const c of [...D.contests]){if(!dipTeams().includes(c.a)||!dipTeams().includes(c.b)){D.contests.splice(D.contests.indexOf(c),1);continue}
    if(c.term==="middle"){const pa=new Set(dipPlayersOf(c.a)),pb=new Set(dipPlayersOf(c.b));let na=0,nb=0;for(const [rr,cc] of mid){const st=G.board[rr][cc];if(st&&pa.has(st.owner))na++;if(st&&pb.has(st.owner))nb++}
      if(na>nb)c.sa++;else if(nb>na)c.sb++}
    if(r>c.until)dipTermsEnd(c,c.term==="ace"?null:c.sa>c.sb?c.a:c.sb>c.sa?c.b:null)}}
{const _r=render;render=function(){_r.apply(this,arguments);if(!G||!G.dip||!(G.dip.contests||[]).some(c=>c.term==="middle"))return;
  for(const [r,c] of dipMidTiles()){const t=document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`);if(t){t.classList.add("midterm");if(!/terms of war/.test(t.title||""))t.title=(t.title?t.title+" · ":"")+"The middle (terms of war)"}}}}
const COUNCIL=[{id:"tithe",name:"The Ether's Tithe",text:"Every card from the Ether (every conjuring) costs 1 more mana."},
  {id:"wartax",name:"War Tax",text:"Every attack costs the attacker 1 mana, paid to the Bank."},
  {id:"dividend",name:"The Bank's Dividend",text:"Every player gains 1 mana at the start of each of their turns."},
  {id:"credit",name:"Cheap Credit",text:"Loans from the Bank don't grow."},
  {id:"silence",name:"The Silence",text:"No one may cast Sorcery spells."}];
const councilOn=id=>!!(G&&G.dip&&G.dip.council&&G.dip.council.id===id&&G.moon.round<=G.dip.council.until&&dipOn());
function dipCouncilLine(){const C=G.dip&&G.dip.council;if(!C||G.moon.round>C.until)return `<p class="dipcouncil dim">The Council meets on the first round after every cycle (every 8 rounds).</p>`;
  const R0=COUNCIL.find(x=>x.id===C.id);return `<p class="dipcouncil"><b>The Council's ${esc(R0.name)}</b> holds until round ${C.until}: ${esc(R0.text)}</p>`}
function aiCouncil(pl,res){const P=G.p[pl],rich=mana(pl)>=6,weak=strength(pl)<Math.max(1,...realPlayers().filter(i=>i!==pl).map(strength));
  if(res.id==="dividend")return Math.random()<.85;if(res.id==="credit")return (P.loans||[]).length>0||Math.random()<.35;
  if(res.id==="wartax")return weak?Math.random()<.8:Math.random()<.25;if(res.id==="tithe")return rich?Math.random()<.3:Math.random()<.55;return Math.random()<.5}
async function councilRound(){const D=dipD(),r=G.moon.round;D.councilAt=r;const pool=COUNCIL.filter(x=>!D.council||x.id!==D.council.id),res=pick(pool);
  log(`<b>The Council meets</b>: ${esc(res.name)}. ${esc(res.text)}`,"event");
  let yes=0,no=0;const tally=[];
  for(const pl of realPlayers()){if(G.over)return;const w=1+envoysOf(pl).length;
    const ok=await ask(pl,{kind:"yesno",id:"council",title:`The Council: ${esc(res.name)}`,text:`${esc(res.text)} If it passes, it holds for 8 rounds. Your vote counts ${w} (one, and one for each envoy you have out).`,yes:"For",no:"Against",ai:()=>aiCouncil(pl,res)});
    if(ok)yes+=w;else no+=w;tally.push(`${G.p[pl].name} ${ok?"for":"against"}${w>1?` (${w})`:""}`)}
  const pass=yes>no;D.council=pass?{id:res.id,until:r+CYCLE-1}:D.council&&r<=D.council.until?D.council:null;
  log(`The Council ${pass?"passes":"rejects"} ${esc(res.name)}, ${yes} to ${no} (${esc(tally.join(", "))}).${pass?` It holds until round ${r+CYCLE-1}.`:""}`,"event");
  if(pass)popup("The Council",`<p>The Council passes <b>${esc(res.name)}</b>, ${yes} votes to ${no}.</p><p>${esc(res.text)} It holds until round ${r+CYCLE-1}.</p>`);render()}
{const _cr=cycleRound;cycleRound=async function(){await _cr.apply(this,arguments);if(!G||G.over||!dipOn()||NET.role==="guest")return;
  try{dipTermsRound()}catch(e){console.error(e)}
  const r=G.moon.round,D=dipD();if(r>1&&(r-1)%CYCLE===0&&D.councilAt!==r)await councilRound()}}
/* what the Council's resolutions do */
{const _sc=spellCost;spellCost=function(sp){const c=_sc.apply(this,arguments);if(sp&&c>0&&sp.school==="Conjuring"&&councilOn("tithe"))return c+1;return c}}
{const _sb=spellBlock;spellBlock=function(sp){if(sp&&sp.school==="Sorcery"&&councilOn("silence"))return "The Council's Silence: no Sorcery until it ends.";return _sb.apply(this,arguments)}}
{const _bt=bankTurn;bankTurn=function(pl){const P=G&&G.p[pl],cr=P&&councilOn("credit"),before=cr?(P.loans||[]).map(L=>L.owed):null;const out=_bt.apply(this,arguments);if(!P||isNPC(pl))return out;
  if(cr)(P.loans||[]).forEach((L,i)=>{const d=L.owed-(before[i]==null?L.owed:before[i]);if(d>0)L.owed-=d});
  if(councilOn("dividend")&&!P.out&&giveMana(pl,1))log(`The Council's Dividend: ${plName(pl)} gains 1 mana.`);
  return out}}
if(window.__EC)Object.assign(window.__EC,{dipTermsStart:(...a)=>dipTermsStart(...a),dipTermsRound:()=>dipTermsRound(),dipMidTiles:()=>dipMidTiles(),councilRound:()=>councilRound(),dipContest:(a,b)=>dipContest(a,b)});
