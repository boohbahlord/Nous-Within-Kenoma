/* ---------------- v41: the Dark Fantasy theme's music ----------------
   An old-cartridge dungeon tune, made in the browser like every other sound here: a soft square-wave melody over a triangle
   bass arpeggio in D minor, slow (76 a minute), with a faint echo, about fifty seconds before it loops. Quiet, so it stays
   behind the game. It plays only with the Dark Fantasy theme, follows the sound switch, and has its own Music button. */

const MUS=(()=>{
  // the melody, two phrases of eight bars: [MIDI note or null for a rest, length in eighths]
  const MEL=[[69,2],[65,1],[62,1],[64,1],[65,1],[67,2], [69,3],[70,1],[69,2],[67,2], [65,2],[62,1],[65,1],[70,2],[69,2], [67,4],[null,4],
    [67,2],[70,1],[74,1],[72,2],[70,2], [69,3],[67,1],[65,2],[64,2], [64,2],[73,2],[76,2],[74,1],[73,1], [69,6],[null,2],
    [74,2],[72,1],[69,1],[65,2],[69,2], [67,2],[64,1],[72,1],[70,2],[67,2], [65,2],[70,2],[74,2],[77,2], [75,4],[74,2],[72,2],
    [70,2],[69,2],[67,2],[74,2], [73,3],[69,1],[64,2],[67,2], [65,2],[64,2],[62,4], [null,8]];
  // one chord a bar: root (MIDI) and its third
  const CH=[[50,3],[50,3],[46,4],[46,4],[43,3],[43,3],[45,4],[45,4],[50,3],[48,4],[46,4],[46,4],[43,3],[45,4],[50,3],[50,3]];
  const ARP=t=>[0,7,12,7,12+t,7,12,7];
  const E8=60/76/2;   // one eighth, in seconds
  let ac=null,out=null,timer=null,next=0,step=0,mi=0,mLeft=0,playing=false;
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function ctx(){if(ac)return ac;const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();
    out=ac.createGain();out.gain.value=0;const lp=ac.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1700;
    const dl=ac.createDelay(1);dl.delayTime.value=E8*3;const fb=ac.createGain();fb.gain.value=.24;const wet=ac.createGain();wet.gain.value=.3;
    out.connect(lp);lp.connect(ac.destination);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(ac.destination);return ac}
  function note(type,f,t,dur,peak){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.012);g.gain.setTargetAtTime(peak*.55,t+.04,.08);g.gain.setTargetAtTime(0,t+Math.max(.05,dur-.06),.04);
    o.connect(g).connect(out);o.start(t);o.stop(t+dur+.3)}
  function tick(){if(!playing||!ac)return;
    while(next<ac.currentTime+.35){
      const bar=Math.floor(step/8)%16,i=step%8,[root,third]=CH[bar];
      note("triangle",hz(root+ARP(third)[i]-12),next,E8*.9,.5);
      if(mLeft<=0){const [m,len]=MEL[mi];mi=(mi+1)%MEL.length;mLeft=len;if(m)note("square",hz(m),next,len*E8*.92,.16)}
      mLeft--;
      if(i===4){const b=ac.createBuffer(1,ac.sampleRate*.04,ac.sampleRate),dd=b.getChannelData(0);for(let k=0;k<dd.length;k++)dd[k]=(Math.random()*2-1)*(1-k/dd.length);
        const s=ac.createBufferSource(),g=ac.createGain();g.gain.value=.07;s.buffer=b;s.connect(g).connect(out);s.start(next)}
      next+=E8;step++}}
  function start(){if(playing)return;if(!ctx())return;if(ac.state==="suspended")ac.resume();playing=true;step=0;mi=0;mLeft=0;next=ac.currentTime+.1;
    out.gain.cancelScheduledValues(ac.currentTime);out.gain.setTargetAtTime(.32,ac.currentTime,.8);timer=setInterval(tick,90);tick()}
  function stop(){if(!playing)return;playing=false;clearInterval(timer);timer=null;if(ac){out.gain.cancelScheduledValues(ac.currentTime);out.gain.setTargetAtTime(0,ac.currentTime,.3)}}
  return {start,stop,get on(){return playing}};
})();
const musicWanted=()=>PREF.theme==="darkfantasy"&&PREF.music!==false&&SND.on&&!document.hidden;
function musicSync(){const b=$("#pMusic");if(b){b.hidden=PREF.theme!=="darkfantasy";b.textContent="Music: "+(PREF.music!==false?"On":"Off");b.setAttribute("aria-pressed",PREF.music!==false)}
  if(musicWanted())MUS.start();else MUS.stop()}
/* browsers start sound only after a click or a tap: the first one starts it */
document.addEventListener("pointerdown",()=>{if(musicWanted()&&!MUS.on)MUS.start()},true);
document.addEventListener("visibilitychange",musicSync);
{const _ap=applyPrefs;applyPrefs=function(){_ap.apply(this,arguments);musicSync()}}
{const _mb=mountBar;mountBar=function(){_mb.apply(this,arguments);const r=$("#pReset");if(!r)return;const b=document.createElement("button");b.type="button";b.id="pMusic";b.className="gtog";
  b.onclick=()=>{PREF.music=PREF.music===false;savePrefs();musicSync()};r.parentNode.insertBefore(b,r);musicSync()}}
{const _t=SND.toggle;SND.toggle=function(){const v=_t.apply(this,arguments);musicSync();return v}}
if(window.__EC)Object.assign(window.__EC,{MUS,musicSync});
