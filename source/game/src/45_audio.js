/* ---------------- v43: the sound switch at the top of the page, and the menu's audio sliders ----------------
   "Sound: On/Off" sits beside Menu, All Rules and New game. The menu has two sliders, sound effects and music, 0 to 150% in steps
   of 5%; with the sound off both read 0, a slider moved up turns the sound back on, and one moved to 0 turns that sound off. */
function paintSndTop(){const b=$("#sndtop");if(b){b.textContent="Sound: "+(SND.on?"On":"Off");b.setAttribute("aria-pressed",SND.on)}
  const a=$("#mSfx"),m=$("#mMus");
  if(a){a.value=SND.on?Math.round(sfxV()*100):0;$("#mSfxV").textContent=a.value+"%"}
  if(m){m.value=SND.on&&PREF.music!==false?Math.round((PREF.musicVol==null?1:+PREF.musicVol)*100):0;$("#mMusV").textContent=m.value+"%"}}
function wireAudioSliders(){const a=$("#mSfx"),m=$("#mMus");
  if(a)a.oninput=()=>{const v=+a.value/100;if(!v){if(SND.on)SND.toggle()}else{PREF.sfxVol=v;savePrefs();if(!SND.on)SND.toggle()}paintSndTop();if(typeof musicSync==="function")musicSync()};
  if(m)m.oninput=()=>{const v=+m.value/100;if(!v)PREF.music=false;else{PREF.music=true;PREF.musicVol=v;if(!SND.on)SND.toggle()}savePrefs();paintSndTop();if(typeof musicSync==="function")musicSync()};
  paintSndTop()}
document.addEventListener("DOMContentLoaded",()=>{const b=$("#sndtop");if(b)b.onclick=()=>{SND.toggle();paintSndTop();if(typeof musicSync==="function")musicSync()};paintSndTop()});
