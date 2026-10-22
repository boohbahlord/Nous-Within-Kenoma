/* v74e: the All Rules page reads like the game's Rule book when asked to. A search bar finds a rule by its code (5.C) or by
   any words in it (Joker). "Show" keeps everything on one page (the default), or one section at a time (a number), or one
   part at a time (a letter within its number), with the previous and next a click away above and below. The choice is kept
   on this device. */
(function(){"use strict";
var main=document.querySelector("main.rules"),idx=document.getElementById("index");if(!main||!idx)return;
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
var txt=function(el){return (el.textContent||"").replace(/\s+/g," ").trim()};
var title=function(el){var c=el.cloneNode(true);[].forEach.call(c.querySelectorAll(".rcode"),function(x){x.remove()});if(/^H[2-4]$/.test(el.tagName))return txt(c);
  var b=c.querySelector("b"),t=b&&c.firstElementChild===b?txt(b):txt(c);return t.length>80?t.slice(0,78)+"…":t};
/* the sections and their parts, from the page itself */
var secs=[],cur=null,part=null;
[].slice.call(main.children).forEach(function(el){
  if(el.matches("a.totop,script,.rtools,.rpager"))return;
  if(el.tagName==="H2"&&el.dataset.rcode){cur={code:el.dataset.rcode,title:title(el),h:el,intro:[el],parts:[]};secs.push(cur);part=null;el._rs=cur;return}
  if(!cur)return;
  if(el.tagName==="H3"&&el.dataset.rcode){part={code:el.dataset.rcode,title:title(el),els:[el]};cur.parts.push(part);el._rs=cur;el._rp=part;return}
  el._rs=cur;if(part){part.els.push(el);el._rp=part}else cur.intro.push(el)});
if(!secs.length)return;
var all=[];secs.forEach(function(s){all.push.apply(all,s.intro);s.parts.forEach(function(p){all.push.apply(all,p.els)})});
/* the pieces each way of reading shows */
function chunks(mode){var out=[];secs.forEach(function(s){
  if(mode==="sec"||!s.parts.length){out.push({s:s,code:s.code,title:s.title,els:s.intro.concat.apply(s.intro,s.parts.map(function(p){return p.els}))});return}
  if(s.intro.length>1)out.push({s:s,code:s.code,title:s.title+" (its opening)",els:s.intro});
  s.parts.forEach(function(p){out.push({s:s,code:p.code,title:p.title,els:[s.h].concat(p.els),p:p})})});return out}
/* the tools under the index */
var tools=document.createElement("div");tools.className="rtools";tools.id="rtools";
tools.innerHTML='<label class="rfind"><span>Find a rule</span><input type="search" id="rq" placeholder="A code (5.C) or any words (Joker)" aria-label="Find a rule by its code or its words" autocomplete="off"></label>'+
  '<div class="rhits" id="rhits" hidden></div>'+
  '<div class="rview" role="radiogroup" aria-label="How to read the rules"><span>Show</span>'+
  [["all","Everything on one page"],["sec","One section at a time"],["part","One part at a time"]].map(function(o){return '<label><input type="radio" name="rview" value="'+o[0]+'"> '+o[1]+'</label>'}).join("")+'</div>';
idx.after(tools);
var top=document.createElement("div"),bot=document.createElement("div");top.className=bot.className="rpager";top.hidden=bot.hidden=true;
tools.after(top);var last=all[all.length-1];last.after(bot);
var mode="all";try{mode=localStorage.getItem("ec-rview")||"all"}catch(e){}
if(["all","sec","part"].indexOf(mode)<0)mode="all";
var list=[],at=0;
function pagerHTML(){var c=list[at],p=list[at-1],n=list[at+1];
  return '<button type="button" class="rpbtn" data-rp="-1"'+(p?'':' disabled')+'>'+(p?'‹ <b>'+esc(p.code)+'</b> '+esc(p.title):'‹')+'</button>'+
    '<span class="rpat">'+(mode==="sec"?'Section ':'')+'<b>'+esc(c.code)+'</b> · '+(at+1)+' of '+list.length+'</span>'+
    '<button type="button" class="rpbtn" data-rp="1"'+(n?'':' disabled')+'>'+(n?'<b>'+esc(n.code)+'</b> '+esc(n.title)+' ›':'›')+'</button>'}
function show(i,scroll){if(mode==="all"){all.forEach(function(el){el.classList.remove("roff")});top.hidden=bot.hidden=true;return}
  at=Math.max(0,Math.min(list.length-1,i));var on=new Set(list[at].els);all.forEach(function(el){el.classList.toggle("roff",!on.has(el))});
  top.innerHTML=bot.innerHTML=pagerHTML();top.hidden=bot.hidden=false;
  if(scroll)top.scrollIntoView({block:"start"})}
function chunkOf(el){while(el&&el.parentElement!==main)el=el.parentElement;if(!el)return -1;
  for(var i=0;i<list.length;i++)if(list[i].els.indexOf(el)>=0&&(el.tagName!=="H2"||list[i].els[0]===el||list[i].els.length===1||!list[i].p))return i;
  for(i=0;i<list.length;i++)if(list[i].els.indexOf(el)>=0)return i;return -1}
function setMode(m){mode=m;try{localStorage.setItem("ec-rview",m)}catch(e){}
  [].forEach.call(tools.querySelectorAll("input[name=rview]"),function(r){r.checked=r.value===m});
  list=mode==="all"?[]:chunks(mode);var h=location.hash.slice(1),el=h&&document.getElementById(h),i=el?chunkOf(el):0;show(i<0?0:i,false)}
function goTo(id){var el=document.getElementById(id);if(!el)return;if(mode!=="all"){var i=chunkOf(el);if(i>=0)show(i,false)}
  el.scrollIntoView({block:"start"})}
tools.addEventListener("change",function(e){if(e.target.name==="rview"){setMode(e.target.value);if(mode!=="all")top.scrollIntoView({block:"start"})}});
[top,bot].forEach(function(b){b.addEventListener("click",function(e){var t=e.target.closest("[data-rp]");if(!t||t.disabled)return;show(at+(+t.dataset.rp),true);
  var c=list[at];if(c){var id=(c.p?c.p.els[0]:c.s.h).id;if(id)history.replaceState(null,"","#"+id)}})});
/* every link to a place on this page finds it, even in a piece not shown */
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey)return;var id=a.getAttribute("href").slice(1);
  if(!id||id==="index"||!document.getElementById(id))return;e.preventDefault();history.pushState(null,"","#"+id);goTo(id)});
addEventListener("hashchange",function(){var id=location.hash.slice(1);if(id&&id!=="index")goTo(id)});
/* the search */
var q=document.getElementById("rq"),hits=document.getElementById("rhits"),rules=[].slice.call(main.querySelectorAll("[data-rcode]"));
function find(v){v=v.trim().toLowerCase();if(!v)return [];
  var byCode=rules.filter(function(el){var c=el.dataset.rcode.toLowerCase();return c===v||c.indexOf(v+".")===0});
  if(byCode.length)return byCode.slice(0,40).map(function(el){return {el:el,snip:""}});
  var words=v.split(/\s+/).filter(function(w){return w.length>1});if(!words.length)return [];
  var out=[];rules.forEach(function(el,i){var tt=title(el),t=tt.toLowerCase(),x=el._t;if(x==null){var c=el.cloneNode(true);[].forEach.call(c.querySelectorAll(".rcode"),function(y){y.remove()});x=el._t=txt(c)}var lx=x.toLowerCase();
    if(!words.every(function(w){return t.indexOf(w)>=0||lx.indexOf(w)>=0}))return;
    var k=lx.indexOf(words[0]),a=Math.max(0,k-48);
    out.push({el:el,i:i,snip:k<0||x.length<=tt.length+3?"":(a?"…":"")+x.slice(a,k+90)+(k+90<x.length?"…":""),score:words.filter(function(w){return t.indexOf(w)>=0}).length*3+(/^H/.test(el.tagName)?0:1)})});
  return out.sort(function(a,b){return b.score-a.score||a.i-b.i}).slice(0,40)}
function mark(s,v){var h=esc(s);v.trim().toLowerCase().split(/\s+/).filter(function(w){return w.length>1}).sort(function(a,b){return b.length-a.length}).forEach(function(w){
  h=h.replace(new RegExp("("+esc(w).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi"),"<mark>$1</mark>")});return h}
q.addEventListener("input",function(){var v=q.value,r=find(v);if(!v.trim()){hits.hidden=true;hits.innerHTML="";return}
  hits.innerHTML=r.length?'<ul>'+r.map(function(h){return '<li><a href="#'+esc(h.el.id)+'"><b>'+esc(h.el.dataset.rcode)+'</b> '+esc(title(h.el))+'</a>'+(h.snip?'<small>'+mark(h.snip,v)+'</small>':'')+'</li>'}).join("")+'</ul>':'<p class="dim">No rule matches. Try fewer words, or a code like 5.C.</p>';
  hits.hidden=false});
q.addEventListener("keydown",function(e){if(e.key==="Enter"){var a=hits.querySelector("a");if(a){e.preventDefault();a.click()}}if(e.key==="Escape"){q.value="";hits.hidden=true}});
setMode(mode);
if(location.hash.length>1&&location.hash!=="#index")requestAnimationFrame(function(){goTo(location.hash.slice(1))});
})();
