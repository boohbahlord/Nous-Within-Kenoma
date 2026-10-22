/* ---------------- v64: automation and the computers take the Hill ----------------
   - King of the Hill: computers and Field Automation go for the Hill in one of three ways (the AI in 05_ai.js): gather an
     army first, straight there, or in small groups. Computers follow the setup's choice (each its own way by default);
     Field Automation has "Capture the Hill" (on by default) and the way, in every mode.
   - Field Automation: Attack groups (Normal, Big, Small), and Formation can shape them (Wide small, Tall big). */
{const _fc=faCtx;faCtx=function(pl){const ctx=_fc.apply(this,arguments),c=faCfgOf(pl);
  ctx.hill=kothOn()&&c.hill?c.hillHow:null;
  ctx.grp=c.grp!=="normal"?c.grp:c.fLink?({wide:"small",deep:"big"}[c.formation]||"normal"):"normal";
  return ctx}}
if(window.__EC)Object.assign(window.__EC,{faCtxW:(...a)=>faCtx(...a),faRunW:(...a)=>faRun(...a)});
