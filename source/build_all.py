"""Build the whole Nous Within Kenoma site into site/ with one shared theme (theme/site.css + theme/site.js)."""
import json, html, os, re, shutil

OUT = 'site'
SITE_V = '70'   # cache tag for site.css and site.js: raise it whenever they change, so browsers fetch the new ones
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
            out.append(f'<figure class="inline-art"><a href="art.html#{anchor(f)}" style="border:0"><img src="{f}" alt="{esc(lab)}, artwork by Bryce Staton" loading="lazy"></a><figcaption>{esc(lab)}</figcaption></figure>')
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
  <p style="color:var(--dim);margin:0 0 34px;font-size:15px">Gnostic-inspired syncretic short stories by Bryce Staton</p>
  <h2 class="label">Sample Chapters</h2>
  <nav class="cards"><a class="card" href="chapters.html">Read Nous Within Kenoma<span>Book in progress: {len(C)} chapters</span></a></nav>
  <h2 class="label">Maps</h2>
  <nav class="cards">
    <a class="card" href="kenoma-character-web.html">Character Web<span>Every named figure and how they connect</span></a>
    <a class="card" href="kenoma-cosmos-map.html">The Cosmos<span>From the Earth to the outer darkness</span></a>
  </nav>
  <h2 class="label">Codex</h2>
  <nav class="cards">
    <a class="card" href="codex-beings.html">Codex of Beings<span>Kinds of beings and every named figure</span></a>
    <a class="card" href="codex-locations.html">Codex of Locations<span>Realms, rooms and the places between</span></a>
  </nav>
  <h2 class="label">Game</h2>
  <nav class="cards">
    <a class="card" href="ethers-crossroads.html">Ether's Crossroads<span>A strategy card game, loosely based on the book</span></a>
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
    return (f'<figure id="{anchor(f)}"><a href="{f}"><img src="{f}" alt="{esc(lab)}, artwork by Bryce Staton" loading="lazy"></a>'
            f'<figcaption>{esc(lab)}{sub}</figcaption></figure>')
sep = '<span class="sep">·</span> '   # the space lets a long row wrap after a dot instead of running out of its box
art = head('Additional Art · Nous Within Kenoma') + f'''<main class="wide">
<nav class="crumbs"><a href="index.html">← Nous Within Kenoma</a></nav>
<header><span class="num">Nous Within Kenoma</span><h1>Additional Art</h1></header>
<p class="intro">Drawings and digital pieces by Bryce Staton. Hatched faces, grids, strings, towers and smeared light: they help carry the atmosphere of the stories and the cosmos. Pieces that also appear inside a chapter name that chapter beneath them.</p>
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

# ---------------------------------------------------------------- codex
def load(p):
    g = {}; exec(open(p).read(), g); return g
B = load('codex/beings.py'); T = load('codex/btypes.py')['T']; LOC = load('codex/locations.py')
MOVED = {'truea', 'falsea', 'wired', 'demons', 'puppets', 'toys', 'shadows', 'clowns', 'archons', 'titans', 'binah', 'tiph', 'opi'}
chars = [e for e in B['E'] if e['id'] not in MOVED]
red = dict(id='redemption', name='Redemption', cat='Powers and fates', ch='36', lead='A star breathed out in the demiurge\'s heaven to heal his angels.',
           forms=[dict(t='The star', ch='36', x='Back in his heaven after the moats, Yaldabaoth “breathes out a new Star. He names them “Redemption,” who he wills to heal any one of his three hundred and sixty-one angels who are willing to forgive themselves for shaking from wounds blessed unto them by God\'s will.” Three hundred and sixty are granted its healing. It undoes the stitches at their eyes and mouths, strengthens their bones, sutures their wings back onto them, and blesses the wings into flesh “with certainty in the name of the Demiurge, Yaldabaoth.”'),
                  dict(t='The one it does not heal', ch='36', x='One angel denies the aid of Redemption. He is left wingless and broken, cast out of Heaven, and named Curse. See Curse and False Angels.')],
           notes=[])
chars.insert([i for i, e in enumerate(chars) if e['id'] == 'crab'][0] + 1, red)
slug = lambda t: re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')
CHAR_CATS = B['CATS']
chars.sort(key=lambda e: CHAR_CATS.index(e['cat']))
TYPE_GROUPS = ['Angels', 'Demons and serpents', 'Puppets and shadows', 'Powers', 'Peoples']
T.sort(key=lambda t: TYPE_GROUPS.index(t['group']))
TYPE_CHARS = {'true-angels': ['antony'], 'false-angels': ['curse', 'redemption', 'yalda'], 'wired-angels': [],
              'demons': ['satan', 'lucifer', 'leviathan', 'goatbull', 'bull', 'anti'], 'serpents': ['yalda', 'leviathan', 'ouroboros'],
              'puppets': ['golden', 'rosy', 'anti'], 'clowns': ['lucifer', 'ouroboros'], 'shadows': ['chin', 'wisdom', 'crab'],
              'archons': [], 'titans': [], 'euclids': ['kether', 'samson']}
STRONG = {'leviathan': 3, 'yalda': 3}

BE = []   # being entries in index order
for t in T:
    BE.append(dict(id=t['id'], name=t['name'], kind='Type of being · ' + t['group'], ch=t['ch'], aka=t['aka'], lead=t['lead'],
                   secs=t['secs'], notes=t['notes'], members=TYPE_CHARS.get(t['id'], []), is_type=True))
for e in chars:
    BE.append(dict(id=e['id'], name=e['name'], kind=e['cat'], ch=e['ch'], aka='', lead=e['lead'],
                   secs=[dict(id=slug(f['t']), t=f['t'], ch=f['ch'], x=f['x']) for f in e['forms']], notes=e['notes'], members=[], is_type=False))
LE = [dict(id=e['id'], name=e['name'], kind=e['cat'], ch=e['ch'], aka='', lead=e['lead'],
           secs=[dict(id=slug(f['t']), t=f['t'], ch=f['ch'], x=f['x']) for f in e['forms']], notes=e['notes'], members=[], is_type=False)
      for e in LOC['E']]
bpage = lambda i: f'being-{i}.html'
lpage = lambda i: f'place-{i}.html'
BY = {e['id']: e for e in BE}
KINDS_OF = {}
for t, ms in TYPE_CHARS.items():
    for m in ms: KINDS_OF.setdefault(m, []).append(t)

def linker(entries, page):
    names = {}
    for e in entries:
        names[e['name'].lower()] = e['id']
        if e['name'].lower().startswith('the '): names[e['name'][4:].lower()] = e['id']
    def see(m):
        parts = re.split(r',\s*|\s+and\s+', m.group(2))
        out = [f'<a href="{page(names[p.strip().lower()])}">{esc(p.strip())}</a>' if p.strip().lower() in names else esc(p) for p in parts]
        return m.group(1) + ' ' + (', '.join(out[:-1]) + ' and ' + out[-1] if len(out) > 1 else out[0]) + '.'
    return lambda text: re.sub(r'([Ss]ee) ([^.]+)\.', see, esc(text).replace('&#x27;', "'"))
lkb = linker(BE, bpage); lkl = linker(LE, lpage)

for f in os.listdir(OUT):
    if (f.startswith('being-') or f.startswith('place-')) and f.endswith('.html'): os.remove(f'{OUT}/{f}')

def entry_page(e, entries, page, index_page, index_name, link, section_label):
    i = entries.index(e); prev = entries[i-1] if i else None; nxt = entries[i+1] if i + 1 < len(entries) else None
    rows = [('Kind', esc(e['kind'])), ('Chapters', esc(e['ch']))]
    if e['aka']: rows.append(('Also called', esc(e['aka'])))
    if e['id'] in KINDS_OF and page is bpage:
        rows.append(('Kind of being', ', '.join(f'<a href="{bpage(t)}">{esc(BY[t]["name"])}</a>' for t in KINDS_OF[e['id']])))
    if len(e['secs']) > 1: rows.append(('Sections', str(len(e['secs']))))
    rows = ''.join(f'<tr><th>{k}</th><td>{v}</td></tr>' for k, v in rows)
    arrows = (f'<span class="arrows">' + (f'<a href="{page(prev["id"])}" title="{esc(prev["name"])}">‹ prev</a>' if prev else '') +
              (' · ' if prev and nxt else '') + (f'<a href="{page(nxt["id"])}" title="{esc(nxt["name"])}">next ›</a>' if nxt else '') + '</span>')
    body = [f'<main class="wrap entry-page" style="max-width:88ch">',
            f'<nav class="crumbs"><a href="{index_page}">← {index_name}</a>{arrows}</nav>',
            f'<header><span class="num">{section_label}</span><h1>{esc(e["name"])}</h1></header>',
            f'<article class="entry" id="{e["id"]}">',
            f'<aside class="infobox"><div class="ib-h">{esc(e["name"])}</div><table>{rows}</table></aside>',
            f'<p class="lead">{link(e["lead"])}</p>']
    for s in e['secs']:
        body.append(f'<h3 id="{e["id"]}-{s["id"]}">{esc(s["t"])}<span class="ch">ch. {esc(s["ch"])}</span></h3><p>{link(s["x"])}</p>')
    for n in e['notes']:
        body.append(f'<p class="note">{link(n)}</p>')
    body.append('</article>')
    if e['members']:
        body.append('<section class="kinds"><h2>Characters</h2><ul>' + ''.join(
            f'<li><a href="{bpage(m)}">{esc(BY[m]["name"])}</a></li>' for m in e['members']) + '</ul></section>')
    body.append('<nav class="pager">' +
                (f'<a href="{page(prev["id"])}">← {esc(prev["name"])}</a>' if prev else f'<a href="{index_page}">← {index_name}</a>') +
                (f'<a href="{page(nxt["id"])}">{esc(nxt["name"])} →</a>' if nxt else f'<a href="{index_page}">{index_name} →</a>') + '</nav></main>\n')
    lvl = STRONG.get(e['id'], 1) if page is bpage else 1
    open(f'{OUT}/{page(e["id"])}', 'w').write(head(f'{e["name"]} · {index_name} · Nous Within Kenoma', static=lvl) + '\n'.join(body) + TAIL)

for e in BE: entry_page(e, BE, bpage, 'codex-beings.html', 'Codex of Beings', lkb, 'Codex of Beings · ' + ('Type of being' if e['is_type'] else e['kind']))
for e in LE: entry_page(e, LE, lpage, 'codex-locations.html', 'Codex of Locations', lkl, 'Codex of Locations · ' + e['kind'])

def links_td(items, page):
    return sep.join(f'<a href="{page(i)}">{esc(n)}</a>' for i, n in items)
type_rows = ''.join(f'<tr><th>{g}</th><td>{links_td([(t["id"], t["name"]) for t in T if t["group"] == g], bpage)}</td></tr>' for g in TYPE_GROUPS)
def char_box(cat):
    items = [(bpage(e['id']), e['name']) for e in chars if e['cat'] == cat]
    if cat == 'Puppets, dolls and shadows':
        items.insert(2, (bpage('puppets') + '#puppets-opi', 'Opi and Noidy'))
    return f'<section class="ix"><h2>{esc(cat)}</h2><ul>' + ''.join(f'<li><a href="{h}">{esc(n)}</a></li>' for h, n in items) + '</ul></section>' if items else ''
bix = head('Codex of Beings · Nous Within Kenoma') + f'''<main class="wide">
<nav class="crumbs"><a href="index.html">← Nous Within Kenoma</a><a href="codex-locations.html">Codex of Locations →</a></nav>
<header><span class="num">Codex</span><h1>Codex of Beings</h1></header>
<p class="intro" style="margin:6px 0 24px">Kinds of beings first, then every named figure. Names are kept as each chapter gives them; lines marked Note come from the author.</p>
<section class="ix" aria-label="Types of beings"><h2>Types of Beings</h2><table>{type_rows}</table></section>
<h2 class="label" style="margin:32px 0 12px;text-align:center">Characters</h2>
<div class="boxes">{"".join(char_box(c) for c in CHAR_CATS)}</div>
</main>
''' + TAIL
open(f'{OUT}/codex-beings.html', 'w').write(bix)
lrows = ''.join(f'<tr><th>{esc(c)}</th><td>{links_td([(e["id"], e["name"]) for e in LE if e["kind"] == c], lpage)}</td></tr>' for c in LOC['CATS'])
lix = head('Codex of Locations · Nous Within Kenoma') + f'''<main class="wide">
<nav class="crumbs"><a href="index.html">← Nous Within Kenoma</a><a href="codex-beings.html">Codex of Beings →</a></nav>
<header><span class="num">Codex</span><h1>Codex of Locations</h1></header>
<p class="intro" style="margin:6px 0 24px">Realms, rooms and the places between, from the Fullness to the trailer hallway. Lines marked Note come from the author.</p>
<section class="ix" aria-label="Locations"><h2>Index of Locations</h2><table>{lrows}</table></section>
</main>
''' + TAIL
open(f'{OUT}/codex-locations.html', 'w').write(lix)
for old, to in (('beings.html', 'codex-beings.html'), ('locations.html', 'codex-locations.html')):
    open(f'{OUT}/{old}', 'w').write(f'<!doctype html><meta charset="utf-8"><title>Moved</title><meta http-equiv="refresh" content="0; url={to}"><link rel="canonical" href="{to}"><a href="{to}">Moved to {to}</a>\n')

exec(open('game_pages.py').read())

# ---------------------------------------------------------------- maps
BACK = '<p style="margin:0 0 6px;flex-basis:100%"><a class="back" href="index.html">← Nous Within Kenoma</a></p>'
D3 = open('node_modules/d3/dist/d3.min.js').read()
def build_map(src, out, title):
    s = open(src).read()
    s = re.sub(r'<script src="https://cdnjs[^"]*d3[^"]*"></script>', lambda m: '<script>' + D3 + '</script>', s)
    s = re.sub(r'^<title>.*?</title>\n', '', s)
    s = s.replace('<!--BACK-->', BACK) if '<!--BACK-->' in s else s.replace('<header>\n', '<header>\n  ' + BACK + '\n', 1)
    open(f'{OUT}/{out}', 'w').write(head(title) + s + '\n' + TAIL)
build_map('nwk/kenoma-web.html', 'kenoma-character-web.html', 'Character Web · Nous Within Kenoma')
build_map('nwk/kenoma-cosmos.html', 'kenoma-cosmos-map.html', 'The Cosmos · Nous Within Kenoma')
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
print('built', len(os.listdir(OUT)), 'files')
