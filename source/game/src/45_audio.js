/* ---------------- v43: the sound switch at the top of the page, and the menu's audio sliders ----------------
   "Sound: On/Off" sits beside Menu, All Rules and New game. The sliders run 0 to 150% in steps of 5%. With the sound off,
   All sound, Sound effects and Music read 0; moving one of them up turns the sound back on, and moving one to 0 turns that
   sound off (All sound: every sound). v78c: All sound scales everything together; each source has its own slider. */
const sndVol=()=>{SND.vol();AUD.vol();if(typeof musicSync==="function")musicSync()};
function paintSndTop(){const b=$("#sndtop");if(b){b.textContent="Sound: "+(SND.on?"On":"Off");b.setAttribute("aria-pressed",SND.on)}
  const show=(id,v)=>{const s=$("#"+id);if(!s)return;s.value=v;const o=$("#"+id+"V");if(o)o.textContent=v+"%"};
  show("mAll",SND.on?Math.round(allV()*100):0);
  show("mSfx",SND.on?Math.round(sfxV()*100):0);
  show("mMus",SND.on&&PREF.music!==false?Math.round((PREF.musicVol==null?1:+PREF.musicVol)*100):0);
  for(const [k] of SND_SRC)show("mSrc_"+k,Math.round(srcV(k)*100))}
function wireAudioSliders(){const all=$("#mAll"),a=$("#mSfx"),m=$("#mMus");
  if(all)all.oninput=()=>{const v=+all.value/100;if(!v){if(SND.on)SND.toggle()}else{PREF.allVol=v;savePrefs();if(!SND.on)SND.toggle()}paintSndTop();sndVol()};
  if(a)a.oninput=()=>{const v=+a.value/100;PREF.sfxVol=v;savePrefs();if(v&&!SND.on)SND.toggle();paintSndTop();sndVol()};   // v78j: 0 is the effects alone
  if(m)m.oninput=()=>{const v=+m.value/100;if(!v)PREF.music=false;else{PREF.music=true;PREF.musicVol=v;if(!SND.on)SND.toggle()}savePrefs();paintSndTop();sndVol()};
  for(const [k] of SND_SRC){const s=$("#mSrc_"+k);if(s)s.oninput=()=>{PREF.srcVol=Object.assign({},PREF.srcVol,{[k]:+s.value/100});savePrefs();paintSndTop();sndVol()}}
  paintSndTop()}
document.addEventListener("DOMContentLoaded",()=>{const b=$("#sndtop");if(b)b.onclick=()=>{SND.toggle();paintSndTop();if(typeof musicSync==="function")musicSync()};paintSndTop()});
