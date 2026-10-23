/* ---------------- Survival ---------------- */
function roman(n){if(n<=0)return "0";const T=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];let s="";for(const [v,l] of T)while(n>=v){s+=l;n-=v}return s}
const spawnRank=c=>({joker:100,king:90,jack:80,queen:70}[kind(c)]||num(c));
/* the Horde spawns once for every player still standing */
/* v70d: three rounds of grace, then a wave every 1d2 + 2 rounds; each wave is one step of strength (what a round used to bring) */
function hordeSpawn(){if(G.hordeNextR==null)G.hordeNextR=4;if(G.round<G.hordeNextR)return;
  G.hordeWave=(G.hordeWave||0)+1;G.hordeNextR=G.round+R(2)+2;
  const n=Math.max(1,G.p.filter(P=>!P.out&&!isHorde(P.i)).length);for(let k=0;k<n;k++)hordeSpawnOne(k,n);hordeCounters()}
function hordeSpawnOne(k,n){
  const r=G.hordeWave||G.round,pl=hordeIx(),dice=[];
  const roll=(n,s)=>{let t=0;for(let i=0;i<n;i++){const v=R(s);dice.push({s,v});t+=v}return t};
  let g=0,inf=0,sp=0,cap=0,jk=0;
  if(r<=5){g=roll(1,4)+r;inf=Math.max(0,roll(1,2)-2+r);cap=Math.min(4,Math.ceil(r/2))}
  else if(r<=10){const k=r-5;g=roll(1,4);inf=roll(1,4)+k;sp=Math.max(0,roll(1,2)-1+Math.floor(k/2));cap=roll(3,2)+Math.floor(k/2)}
  else{const k=r-5;g=roll(1,4);inf=roll(1,4)+k;sp=Math.max(0,roll(1,2)-1+Math.floor(k/2));cap=roll(3,2)+2+Math.floor(Math.max(0,r-11)/5);
    while(jk<2){const v=roll(1,4);if(v===4)jk++;else break}}
  // draw the souls from a fresh deck
  const d=freshDeck(),take=(f,n)=>{const out=[];for(let i=d.length-1;i>=0&&out.length<n;i--)if(f(d[i]))out.push(...d.splice(i,1));return out};
  let pool=[...take(c=>kind(c)==="joker",jk),...take(c=>["jack","queen","king"].includes(kind(c)),sp),...take(c=>kind(c)==="infantry",inf),...take(c=>kind(c)==="grunt",g)];
  pool.sort((a,b)=>spawnRank(b)-spawnRank(a));
  const chosen=pool.slice(0,cap);chosen.forEach(c=>c.owner=pl);
  let placed=0,lost=0;
  for(const c of chosen){if(hordePlace(c))placed++;else lost++}
  tray(pl,`Wave ${roman(r)}${n>1?` ${k+1}/${n}`:""}`,dice,`${placed} spawn${placed===1?"":"s"}`);
  log(`Wave ${roman(r)} (round ${roman(G.round)})${n>1?`, spawn ${k+1} of ${n}`:""}: the Horde rolls ${dice.map(x=>"d"+x.s+":"+x.v).join(" ")}; ${g} grunts, ${inf} infantry${sp?`, ${sp} royals`:""}${jk?`, ${jk} Joker${jk>1?"s":""}`:""}, cap ${cap}. ${placed} spawn${lost?`, ${lost} find no room`:""}.`,"event");
}
function hordePlace(c){
  const pl=hordeIx(),zone=zoneTiles(pl),front=zone.filter(([r,cc])=>!isBack(pl,r,cc)),back=zone.filter(([r,cc])=>isBack(pl,r,cc));
  const mid=(COLS-1)/2,byCenter=t=>[...t].sort((a,b)=>Math.abs(a[1]-mid)-Math.abs(b[1]-mid));
  // stack onto its own stacks when it can, front line first
  for(const [r,col] of [...byCenter(front),...byCenter(back)]){const st=G.board[r][col];
    if(st&&st.owner===pl&&!hasK(st,"ace")&&stackLegal([...st.cards,c])){st.cards.push(c);return true}}
  const foes=enemiesOf(pl).flatMap(stacksOf);
  for(const line of [front,back]){const free=line.filter(([r,col])=>!G.board[r][col]);if(free.length){
    // lean toward the columns where the players' stacks are
    free.sort((a,b)=>Math.min(99,...foes.map(x=>Math.abs(x.c-a[1])))-Math.min(99,...foes.map(x=>Math.abs(x.c-b[1]))));
    const [r,col]=free[0];G.board[r][col]={owner:pl,cards:[c],moved:false,attacked:false};return true}}
  // no room: a stronger soul replaces the weakest stack still standing on the Horde's lines, which fades back into the Ether
  let weak=null;for(const [r,col] of zone){const st=G.board[r][col];if(st&&st.owner===pl&&!st.cards.some(x=>x.captured&&x.captured.length)&&(!weak||stackRate(st)<stackRate(weak.st)))weak={st,r,col}}
  if(weak&&stackRate(weak.st)<rate(c)){G.board[weak.r][weak.col]={owner:pl,cards:[c],moved:false,attacked:false};return true}
  return false;
}
function endSurvival(why){
  G.over=true;stopTimer();closeEther();closeDrawer();const n=Math.max(0,G.round-1);   // v78j: the timer and the drawers end with it
  log(`<b>The Horde takes the field.</b> You survived ${n} round${n===1?"":"s"}.`,"win");render();
  $("#ov").className="";
  $("#ov").innerHTML=`<div class="ovbox"><p class="bl roundbig">${roman(n)}</p><h2>You survived ${n} round${n===1?"":"s"}</h2><p class="dim">${why&&!/^every (card|base)/.test(why)?`${why.charAt(0).toUpperCase()+why.slice(1)}, in round ${roman(Math.max(1,G.round))}.`:`Your last card on the field fell in round ${roman(Math.max(1,G.round))}.`}</p><p><button class="btn" id="again">Play again</button></p></div>`;
  $("#ov").hidden=false;$("#again").onclick=showStart;
}
