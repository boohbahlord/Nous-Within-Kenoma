"""Build the whole Nous Within Kenoma site into site/ with one shared theme (theme/site.css + theme/site.js)."""
import json, html, os, re, shutil

OUT = 'site'
SITE_V = '72'   # cache tag for site.css and site.js: raise it whenever they change, so browsers fetch the new ones
if os.path.isdir(OUT): shutil.rmtree(OUT)   # v79j: a clean build (the files end up in folders at the end)
os.makedirs(OUT, exist_ok=True)
shutil.copy('theme/site.js', f'{OUT}/site.js')
shutil.copy('theme/ec-music.js', f'{OUT}/ec-music.js')
open(f'{OUT}/site.css', 'w').write(open('theme/site.css').read().replace('/*@@GAME@@*/\n', ''))
shutil.copy('theme/game.css', f'{OUT}/ethers-crossroads.css')
for f in os.listdir('assets'):
    shutil.copy('assets/' + f, f'{OUT}/{f}')
esc = lambda s: html.escape(str(s), quote=True)

# v43: the Ether's Crossroads pages wear the theme chosen in the game (by default the Ether's Crossroads theme), from the first paint
EC_THEME = '''<script>try{var P=JSON.parse(localStorage.getItem("ec-prefs2")||"{}"),t=P.theme==null||(!P.v43t&&P.theme==="")?"darkfantasy":P.theme,
M={darkfantasy:["th-darkfantasy"],etherten:["th-darkfantasy","th-eten"],etherkenoma:["th-darkfantasy","th-eken"],"":["th-rich"],dull:["th-dull","th-rich"],office:["th-office","th-rich"],officedark:["th-officedark","th-rich"],earth:["th-earth","th-rich"],jester:["th-black","th-jester","th-rich"],ten:["th-indigo","th-blue","th-rich"],satan:["th-crimson","th-rich"]};
(M[t]||[]).forEach(function(c){document.documentElement.classList.add(c)});document.documentElement.classList.add("ecpage")}catch(e){}
/* v71j: Data saving (1) and Poor connection (2) fetch nothing the page can do without: no fonts (the blackletter becomes the
   device's own serif). The music plays in every mode (v76b: the songs are made on the device from one small script of
   about 47 KB, cached; nothing more is ever downloaded for it). Otherwise the fonts are preloaded. */
try{var N=+(P&&P.net)||0,D=document.documentElement,H=document.head;
if(N>0){D.classList.add("lite");if(P.netBg)D.classList.add("litebg");if(N>1)D.classList.add("poor");var y=document.createElement("style");y.id="litefonts";
y.textContent='@font-face{font-family:"Grenze Gotisch";font-style:normal;font-weight:500;src:local("Old English Text MT"),local("Times New Roman"),local("Georgia"),local("Noto Serif"),local("DejaVu Serif"),local("Liberation Serif")}';H.appendChild(y)}
else{var F=function(u){var l=document.createElement("link");l.rel="preload";l.as="font";l.type="font/woff2";l.crossOrigin="anonymous";l.href=u;H.appendChild(l)};
if(!P.dys)F("cascadia-code-latin-200-normal.woff2");if(window.EC_BL)F("grenze-gotisch-latin-500-normal.woff2")}
var m=document.createElement("script");m.src="ec-music.js?v=@@SITE_V@@";H.appendChild(m)}catch(e){}/* v72b: Dyslexic mode: clear sans-serif letters in place of the blackletter and the thin monospace */
try{if(P&&P.dys){D.classList.add("dys");var z=document.createElement("style");z.id="dysfonts";z.textContent='@font-face{font-family:"Grenze Gotisch";font-style:normal;font-weight:500;src:local("Verdana"),local("Tahoma"),local("Segoe UI"),local("Arial"),local("DejaVu Sans"),local("Liberation Sans")}@font-face{font-family:"UnifrakturMaguntia";font-style:normal;font-weight:400;src:local("Verdana"),local("Tahoma"),local("Segoe UI"),local("Arial"),local("DejaVu Sans"),local("Liberation Sans")}';H.appendChild(z)}}catch(e){}
</script>'''.replace('@@SITE_V@@', SITE_V)
def head(title, extra='', static=1, fx='strings bars', theme='', ec=False):
    cls = f' class="{theme}"' if theme else ''
    return f'''<!doctype html>
<html lang="en"{cls}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<link rel="icon" type="image/png" href="favicon.png">
{'' if ec else '<link rel="preload" href="cascadia-code-latin-200-normal.woff2" as="font" type="font/woff2" crossorigin>' + chr(10)}<link rel="stylesheet" href="site.css?v={SITE_V}">{extra}{EC_THEME if ec else ''}
<script src="site.js?v={SITE_V}" defer></script>
</head>
<body data-static="{static}" data-fx="{fx}">
'''
TAIL = '</body>\n</html>\n'

# ---------------------------------------------------------------- chapters
C = json.load(open('chapters_all.json'))
QUOTES = {23: [(6, 7)], 36: [(46, 48), (52, 58)]}
ART = {  # file -> (plate label, chapter it appears in or None)
    'art-01.jpg': ('Plate I', None), 'art-02.jpg': ('Plate II', 33), 'art-03.jpg': ('Plate III', 41),
    'art-04.jpg': ('Plate IV', None), 'art-05.jpg': ('Plate V', None), 'art-06.jpg': ('Plate VI', None),
    'art-07.jpg': ('Plate VII', None), 'art-08.jpg': ('Plate VIII', 8), 'art-09.jpg': ('Plate IX', None),
    'in-denial.jpg': ('In Denial', 23), 'forgetting-hell.png': ('Forgetting Hell', 24)}
CH_IMG = {41: (0, 'art-03.jpg'), 23: (13, 'in-denial.jpg'), 24: (0, 'forgetting-hell.png'),
          8: (5, 'art-08.jpg'), 33: (2, 'art-02.jpg')}
anchor = lambda f: 'art-' + re.sub(r'[^a-z0-9]+', '-', ART[f][0].lower()).strip('-')

def to_html(t):
    t = html.escape(t, quote=False)
    return re.sub(r'\*(.+?)\*', r'<em>\1</em>', t)

def fix_chapter(c):
    n = c['n']; items = [dict(it) for it in c['items']]
    if n >= 5 and os.path.exists(f'edits/e{n:02d}.py'):
        g = {}; exec(open(f'edits/e{n:02d}.py').read(), g)
        for i, t in g['E'].items():
            items[i]['html'] = to_html(t)
    if n in CH_IMG:
        i, f = CH_IMG[n]
        items.insert(i, {'k': 'img', 'f': f})
    for a, b in reversed(QUOTES.get(n, [])):
        txt = ' '.join(re.sub(r'</?em>', '', items[j]['html']).strip() for j in range(a, b + 1))
        items[a:b + 1] = [{'k': 'quote', 'html': '<em>' + txt + '</em>'}]
    if n >= 5:
        out = []
        for it in items:
            if it['k'] == 'blank' and out and out[-1]['k'] == 'blank':
                continue
            out.append(it)
        items = out
    c = dict(c); c['items'] = items; c['ind'] = 2.0   # one first-line indent for every chapter
    return c
C = [fix_chapter(c) for c in C]
TITLE = {c['n']: c['title'] for c in C}
fname = lambda n: f'chapter-{n:02d}.html'

def picker(cur=None, label='Jump to a chapter'):
    opts = ['<option value="">Choose a chapter…</option>'] if cur is None else []
    for c in C:
        sel = ' selected' if c['n'] == cur else ''
        opts.append(f'<option value="{fname(c["n"])}"{sel}>{c["n"]} · {esc(c["title"])}</option>')
    return (f'<div class="pick"><label for="chap">{label}</label>'
            f'<select id="chap" onchange="if(this.value)location.href=this.value">{"".join(opts)}</select></div>')

def render_items(items):
    out = []
    for it in items:
        k = it['k']
        if k == 'blank': out.append('<p class="blank"></p>')
        elif k == 'img':
            f = it['f']; lab = ART[f][0]
            out.append(f'<figure class="inline-art"><a href="art.html#{anchor(f)}" style="border:0"><img src="{f}" alt="{esc(lab)}, artwork" loading="lazy"></a><figcaption>{esc(lab)}</figcaption></figure>')
        elif k == 'para': out.append(f'<p class="para">{it["html"].rstrip()}</p>')
        elif k == 'quote': out.append(f'<p class="quote">{it["html"]}</p>')
        elif k == 'flush': out.append(f'<p class="left">{it["html"].rstrip()}</p>')
        else:
            al = it['al']
            if al == 'off': out.append(f'<p class="left" style="padding-left:{it["off"]}%">{it["html"].rstrip()}</p>')
            else: out.append(f'<p class="{al}">{it["html"].rstrip()}</p>')
    return '\n'.join(out)

BLACK = {26}
BL_FONT = '\n<link rel="preload" href="grenze-gotisch-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>'
L4 = {23, 42}; L3 = {3, 6, 9, 14, 25, 28, 30, 34, 37, 38, 41}
L2 = {5, 8, 10, 11, 15, 17, 18, 19, 20, 21, 22, 24, 27, 29, 36}
def ch_fx(n):
    lvl = 0 if n == 35 else 4 if n in L4 else 3 if n in L3 else 2 if n in L2 else 1
    lvl = min(lvl, 2)   # 2026-10-19: heavy static (3, 4) brought down to medium; medium has no rolling TV band
    fx = '' if n in (1, 2, 3, 4, 26, 35) else 'strings bars'
    theme = 'th-indigo th-blue' if n in (1, 2, 3) else 'th-indigo' if n == 4 else 'th-crimson' if n == 23 else 'th-black' if n == 26 else ''
    return dict(static=lvl, fx=fx, theme=theme)
for f in os.listdir(OUT):
    if f.startswith('chapter-') and f.endswith('.html'): os.remove(f'{OUT}/{f}')
for i, c in enumerate(C):
    n = c['n']; prev = C[i-1] if i else None; nxt = C[i+1] if i + 1 < len(C) else None
    bl = n in BLACK
    body = head(f'{n} · {c["title"]} · Nous Within Kenoma', BL_FONT if bl else '', **ch_fx(n))
    body += f'<main class="wrap{" blackletter" if bl else ""}">\n'
    body += f'<nav class="crumbs"><a href="chapters.html">← Nous Within Kenoma</a>{picker(n)}</nav>\n'
    body += f'<header><span class="num">Chapter {n}</span><h1>{esc(c["title"])}</h1></header>\n'
    body += f'<article class="chapter{" blackletter" if bl else ""}" style="--lh:{c["lh"]};--ind:{c["ind"]}em">\n{render_items(c["items"])}\n</article>\n'
    body += '<nav class="pager">'
    body += (f'<a href="{fname(prev["n"])}">← {prev["n"]} · {esc(prev["title"])}</a>' if prev else '<a href="chapters.html">← All chapters</a>')
    body += (f'<a href="{fname(nxt["n"])}">{nxt["n"]} · {esc(nxt["title"])} →</a>' if nxt else '<a href="index.html">Home →</a>')
    body += '</nav>\n</main>\n' + TAIL
    open(f'{OUT}/{fname(n)}', 'w').write(body)

toc = '\n'.join(f'<li><a href="{fname(c["n"])}"><span class="n">{c["n"]}</span><span>{esc(c["title"])}</span></a></li>' for c in C)
land = head('Read · Nous Within Kenoma') + f'''<main class="wrap">
<nav class="crumbs"><a href="index.html">← Nous Within Kenoma</a></nav>
<header><span class="num">Nous Within Kenoma</span><h1>Read Nous Within Kenoma</h1></header>
<section class="notice" aria-label="About these chapters">
<p>This book is unfinished. These chapters may still change before the book is complete.</p>
<p><i>Nous Within Kenoma</i> is a collection of Gnostic-inspired, syncretic short stories that all take place within the same cosmology. The stories are interconnected to differing extents, and some chapters are best read within their larger context.</p>
</section>
{picker(None, 'Select a chapter for preview reading')}
<ol class="toc">
{toc}
</ol>
</main>
''' + TAIL
open(f'{OUT}/chapters.html', 'w').write(land)

# ---------------------------------------------------------------- front page
NW = {41: 'forty-one'}
idx = head('Nous Within Kenoma') + f'''<main class="wide" style="max-width:1060px">
<div class="front">
<div>
  <h1 style="font-size:clamp(30px,5vw,44px);line-height:1.1;margin:0 0 10px">Nous Within Kenoma</h1>
  <p style="color:var(--dim);margin:0 0 34px;font-size:15px">Gnostic-inspired syncretic short stories</p>
  <h2 class="label">Sample Chapters</h2>
  <nav class="cards"><a class="card" href="chapters.html">Read Nous Within Kenoma<span>Book in progress: {len(C)} chapters</span></a></nav>
  <h2 class="label">Games</h2>
  <nav class="cards">
    <a class="card" href="ethers-crossroads.html">Ether's Crossroads<span>A strategy card game, loosely based on the book</span></a>
    <a class="card" href="https://boohbahlord.github.io/DuckFriends/">Duck Friends<span>A party game for friends</span></a>
  </nav>
</div>
<div>
  <figure style="margin:0"><img src="kenoma-art.jpg" alt="Ink drawing of a face in dense, flowing hatch lines" width="999" height="1500" style="display:block;width:100%;height:auto;border:1px solid var(--rule)"></figure>
  <p style="text-align:right;margin:12px 0 0"><a class="more-art" href="art.html">View Additional Art →</a></p>
</div>
</div>
</main>
<style>
.front{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.95fr);gap:46px;align-items:start}}
.front h2.label{{margin:26px 0 8px;font-weight:200}}
@media (max-width:820px){{.front{{grid-template-columns:minmax(0,1fr)}}}}
</style>
''' + TAIL
open(f'{OUT}/index.html', 'w').write(idx)

# ---------------------------------------------------------------- art page
DRAW = [f for f in ART if f.startswith('art-')]
DIG = ['in-denial.jpg', 'forgetting-hell.png']
def fig(f):
    lab, ch = ART[f]
    sub = f'<span><a href="{fname(ch)}">Chapter {ch} · {esc(TITLE[ch])}</a></span>' if ch else ('<span>Front page</span>' if f == 'art-01.jpg' else '')
    return (f'<figure id="{anchor(f)}"><a href="{f}"><img src="{f}" alt="{esc(lab)}, artwork" loading="lazy"></a>'
            f'<figcaption>{esc(lab)}{sub}</figcaption></figure>')
sep = '<span class="sep">·</span> '   # the space lets a long row wrap after a dot instead of running out of its box
art = head('Additional Art · Nous Within Kenoma') + f'''<main class="wide">
<nav class="crumbs"><a href="index.html">← Nous Within Kenoma</a></nav>
<header><span class="num">Nous Within Kenoma</span><h1>Additional Art</h1></header>
<p class="intro">Drawings and digital pieces. Hatched faces, grids, strings, towers and smeared light: they help carry the atmosphere of the stories and the cosmos. Pieces that also appear inside a chapter name that chapter beneath them.</p>
<section class="ix" aria-label="Index of art"><h2>Index of Art</h2><table>
<tr><th><a href="#drawings">Drawings</a></th><td>{sep.join(f'<a href="#{anchor(f)}">{esc(ART[f][0])}</a>' for f in DRAW)}</td></tr>
<tr><th><a href="#digital">Digital</a></th><td>{sep.join(f'<a href="#{anchor(f)}">{esc(ART[f][0])}</a>' for f in DIG)}</td></tr>
</table></section>
<section class="art-sec" id="drawings"><h2>Drawings</h2><div class="gallery">
{"".join(fig(f) for f in DRAW)}
</div></section>
<section class="art-sec" id="digital"><h2>Digital</h2><div class="gallery">
{"".join(fig(f) for f in DIG)}
</div></section>
</main>
''' + TAIL
open(f'{OUT}/art.html', 'w').write(art)

# ---------------------------------------------------------------- the codex and the maps are gone (v79h): their old pages leave the site
for f in os.listdir(OUT):
    if f.endswith('.html') and (f.startswith(('being-', 'place-', 'codex-')) or f in ('beings.html', 'locations.html', 'kenoma-character-web.html', 'kenoma-cosmos-map.html')):
        os.remove(f'{OUT}/{f}')

exec(open('game_pages.py').read())

for old in ('reader.css',):
    if os.path.exists(f'{OUT}/{old}'): os.remove(f'{OUT}/{old}')
# v77c: the game's script must parse (a name declared twice, a stray bracket) or nothing is built for the site
import shutil, subprocess, sys
if shutil.which('node'):
    chk = subprocess.run(['node', '-e', "new Function(require('fs').readFileSync(process.argv[1],'utf8'))", f'{OUT}/ethers-crossroads.js'], capture_output=True, text=True)
    if chk.returncode:
        sys.stderr.write('ethers-crossroads.js does not parse:\n' + (chk.stderr or chk.stdout)[-1500:] + '\n'); sys.exit(1)
# v78j: a version note ("// v78j: …") is the end of its line: code after it would be commented out without a sound
import glob, re
_code = re.compile(r'if\(|\)return\b|return;|\)\{|\};|(?:const|let) \w+\s*=|=>')
_cut = [f'{os.path.basename(f)}:{i}' for f in sorted(glob.glob('game/src/*.js'))
        for i, l in enumerate(open(f, encoding='utf8'), 1)
        for m in re.finditer(r'//\s*v\d+[a-z]?\b', l) if _code.search(l[m.end():])]
if _cut:
    sys.stderr.write('code after a // note (commented out): ' + ', '.join(_cut) + '\n'); sys.exit(1)

# ---------------------------------------------------------------- v79j: the site in folders
# Everything above is built flat; here each file goes to its folder and every reference between files (href, src, url(),
# the strings in the scripts) is rewritten to the new place. index.html stays at the root, where GitHub Pages starts.
#   book/  the chapters and their list · art/  the art page and the pictures · game/  Ether's Crossroads
#   assets/  what every page shares: site.css, site.js, the fonts, the icon, the dark fantasy backdrop
def _folder(f):
    if f.startswith('chapter') and f.endswith('.html'): return 'book'
    if f in ('art.html', 'kenoma-art.jpg', 'in-denial.jpg', 'forgetting-hell.png') or re.match(r'art-\d+\.jpg$', f): return 'art'
    if f.startswith('ethers-crossroads') or f in ('ec-music.js', 'banker.png'): return 'game'
    return 'assets'
FOLDER = {f: _folder(f) for f in os.listdir(OUT) if f != 'index.html'}
where = lambda f: f'{FOLDER[f]}/{f}' if f in FOLDER else f
_names = sorted([*FOLDER, 'index.html'], key=len, reverse=True)
_ref = re.compile(r'(?<![\w./-])(' + '|'.join(map(re.escape, _names)) + r')(?=[?#"\'`)\s,;]|$)')
def _fix(text, home):
    return _ref.sub(lambda m: os.path.relpath(where(m.group(1)), home or '.').replace(os.sep, '/'), text)
for d in set(FOLDER.values()): os.makedirs(f'{OUT}/{d}', exist_ok=True)
for f in [*FOLDER, 'index.html']:
    src, dst = f'{OUT}/{f}', f'{OUT}/{where(f)}'
    if f.endswith(('.html', '.css', '.js')):
        t = _fix(open(src, encoding='utf8').read(), FOLDER.get(f, ''))
        if dst != src: os.remove(src)
        open(dst, 'w', encoding='utf8').write(t)
    elif dst != src: shutil.move(src, dst)
# the old addresses (before the folders, and the pages that are gone) land where they belong now, or on the front page
_moved = json.dumps({f: where(f) for f in FOLDER if f.endswith('.html')})
open(f'{OUT}/404.html', 'w').write('''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nous Within Kenoma</title>
<script>(function(){var M=''' + _moved + ''',p=location.pathname,i=p.lastIndexOf("/"),d=p.slice(0,i+1).replace(/(book|art|game|assets)[/]$/,""),f=p.slice(i+1),to=M[f];
location.replace(d+(to||"index.html")+(to?location.search+location.hash:""))})()</script>
<p style="font-family:monospace;padding:24px">This page has moved. <a href="/Nous-Within-Kenoma/">Nous Within Kenoma</a></p>
''')
# every reference must point at a file that is there
_bad = []
for root, _, files in os.walk(OUT):
    for f in files:
        if not f.endswith(('.html', '.css')): continue
        t = open(f'{root}/{f}', encoding='utf8').read()
        for m in re.finditer(r'(?:href|src)="(?![a-z]+:)([^"#?:]+)|url\(["\']?([^"\')?#:]+)', t):
            u = m.group(1) or m.group(2)
            if u and not u.startswith(('/', 'data', 'javascript', '%')) and not os.path.exists(os.path.normpath(f'{root}/{u}')): _bad.append(f'{os.path.relpath(root, OUT)}/{f} → {u}')
if _bad:
    sys.stderr.write('broken references:\n  ' + '\n  '.join(sorted(set(_bad))[:40]) + '\n'); sys.exit(1)
print('built', sum(len(fs) for _, _, fs in os.walk(OUT)), 'files in', ', '.join(sorted({*FOLDER.values()})) + ' and the root')
