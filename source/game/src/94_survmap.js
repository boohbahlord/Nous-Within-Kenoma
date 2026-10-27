/* ---------- v73b: Survival's maps ----------
   - The large map is Survival's default: 6 wide and 10 long. The Horde holds the top two lines. Each survivor spawns in a box
     3 wide and 2 deep at the bottom: two boxes side by side, then a second row of boxes on top of them. Survival takes four
     survivors at most, so the field never widens (v77c: my choice; survBoxes can still lay out more). One survivor
     holds the whole back line (six tiles).
   - The standard (small) sizes are only offered while every survivor gets the same five or more spawn tiles behind the
     midline: two survivors 6 or 8 wide, three 9 wide; four always need the large map. */
const SURV_STD_W={1:[5,6,7],2:[6,8],3:[9],4:[]};
const survStdOk=n=>(SURV_STD_W[n]||[]).length>0;
function survBoxes(k){const out=[];   // [column, row of boxes] for each survivor, and the box columns the field needs
  if(k<=4){for(let i=0;i<k;i++)out.push([i%2,Math.floor(i/2)]);return {cols:2,boxes:out.map(([c,r])=>[c,r])}}
  const extra=Math.ceil((k-4)/2),cols=2+Math.min(2,extra),left=cols>2?1:0;   // past four: a column on the left, then one on the right
  for(let i=0;i<Math.min(k,4);i++)out.push([left+i%2,Math.floor(i/2)]);
  const fresh=[0];if(cols>3)fresh.push(cols-1);let j=4;
  for(const r of [0,1])for(const c of fresh)if(j<k){out.push([c,r]);j++}
  return {cols,boxes:out}}
{const _mp=mapPlan;mapPlan=function(o){if(!(o&&o.mode==="survival"&&o.big==="long"))return _mp.apply(this,arguments);
  let theme=o.map||"none";if(theme==="random")theme=pick(["keep","sahel","forest","dungeon"]);if(theme==="river"||theme==="hill")theme="keep";
  const surv=o.players.map((p,i)=>i).filter(i=>o.players[i].cpu!=="horde"),hi=o.players.findIndex(p=>p.cpu==="horde"),k=surv.length;
  const B=survBoxes(Math.max(1,k)),cols=Math.max(6,B.cols*3),rows=10,V=Array.from({length:rows},()=>Array(cols).fill(false));
  const seats=[],teams=[];
  const box=(bc,br)=>{const back=[],zone=[];for(let d=0;d<2;d++)for(let a=0;a<3;a++){const r=rows-1-br*2-d,c=bc*3+a;zone.push([r,c]);if(!d)back.push([r,c])}return {side:"bottom",rot:0,fwd:[-1,0],back,zone}};
  o.players.forEach((p,i)=>{
    if(i===hi){const back=[],zone=[];for(let d=0;d<2;d++)for(let c=0;c<cols;c++){zone.push([d,c]);if(!d)back.push([d,c])}seats.push({side:"top",rot:2,fwd:[1,0],back,zone});teams.push(1);return}
    const n=surv.indexOf(i);
    if(k===1){const back=[];for(let c=0;c<cols;c++)back.push([rows-1,c]);seats.push({side:"bottom",rot:0,fwd:[-1,0],back,zone:[...back]})}
    else{const [bc,br]=B.boxes[n];seats.push(box(bc,br))}
    teams.push(0)});
  return {theme,cols,rows,mid:true,corners:false,bridge:"left",void:V,seed:(Math.random()*1e9)|0,layout:o.layout||(k>1?"coop":"duel"),seats,teams,big:"long",large:true}}}

if(window.__EC)Object.assign(window.__EC,{survBoxes:k=>survBoxes(k),survStdOk:n=>survStdOk(n)});
