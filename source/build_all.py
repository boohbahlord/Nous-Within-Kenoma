"""Build the whole Nous Within Kenoma site into site/ with one shared theme (theme/site.css + theme/site.js)."""

import json, html, os, re, shutil

OUT = "site"
SITE_V = "90"  # cache tag for site.css and site.js: raise it whenever they change, so browsers fetch the new ones
ICON_V = "2"  # the same for the tab icon (2: the white circle with a line through it, in a black box)
if os.path.isdir(OUT):
    shutil.rmtree(OUT)  # v79j: a clean build (the files end up in folders at the end)
os.makedirs(OUT, exist_ok=True)
shutil.copy("theme/site.js", f"{OUT}/site.js")
shutil.copy("theme/ec-music.js", f"{OUT}/ec-music.js")
open(f"{OUT}/site.css", "w").write(
    open("theme/site.css").read().replace("/*@@GAME@@*/\n", "")
)
shutil.copy("theme/game.css", f"{OUT}/ethers-crossroads.css")
for f in os.listdir("assets"):
    shutil.copy("assets/" + f, f"{OUT}/{f}")
esc = lambda s: html.escape(str(s), quote=True)

# v43: the Ether's Crossroads pages wear the theme chosen in the game (by default the Ether's Crossroads theme), from the first paint
EC_THEME = """<script>try{var P=JSON.parse(localStorage.getItem("ec-prefs2")||"{}"),t=P.theme==null||(!P.v43t&&P.theme==="")?"darkfantasy":P.theme,
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
</script>""".replace(
    "@@SITE_V@@", SITE_V
)


def head(title, extra="", static=1, fx="strings bars", theme="", ec=False):
    theme = theme if ec else (theme + " crt").strip()  # v90: every book page is the old amber terminal
    cls = f' class="{theme}"' if theme else ""
    return f"""<!doctype html>
<html lang="en"{cls}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<link rel="icon" type="image/png" href="favicon.png?v={ICON_V}">
{'' if ec else '<link rel="preload" href="ibm-plex-mono-latin-300-normal.woff2" as="font" type="font/woff2" crossorigin>' + chr(10) + '<link rel="preload" href="vt323-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>' + chr(10)}<link rel="stylesheet" href="site.css?v={SITE_V}">{extra}{EC_THEME if ec else ''}
<script src="site.js?v={SITE_V}" defer></script>
</head>
<body data-static="{static}" data-fx="{fx}">
"""


TAIL = "</body>\n</html>\n"

# ---------------------------------------------------------------- parts
# The words of every part come from my manuscript, the .odt, through tools/odt_to_parts.py (parts_all.json): exactly as
# typed there, paragraph for paragraph and line for line. Nothing here changes a word.
C = json.load(open("parts_all.json", encoding="utf8"))
ART = {  # file -> (plate label, the part it appears in or None)
    "art-01.jpg": ("Plate I", None),
    "art-02.jpg": ("Plate II", None),
    "art-03.jpg": ("Plate III", 24),
    "art-04.jpg": ("Plate IV", 38),
    "art-05.jpg": ("Plate V", None),
    "art-06.jpg": ("Plate VI", None),
    "art-07.jpg": ("Plate VII", None),
    "art-08.jpg": ("Plate VIII", 8),
    "art-09.jpg": ("Plate IX", None),
    "in-denial.jpg": ("In Denial", 33),
    "forgetting-hell.png": ("Forgetting Hell", 16),
}
PART_IMG = {  # part -> (the paragraph the picture comes right before: its first words, or 0 for the top; the picture)
    24: (0, "art-03.jpg"),
    33: ("The pain, fed.", "in-denial.jpg"),
    16: (0, "forgetting-hell.png"),
    8: ("How does it think?", "art-08.jpg"),
    # right before the paragraph after the one about the map and schematic, that one wrapping around it
    38: ("When the world was seen in the cup", "art-04.jpg"),
}
LH = {2: 1.167}  # a part's line height where it isn't the usual one (No. 2's lines sit close, as in the manuscript)
anchor = lambda f: "art-" + re.sub(r"[^a-z0-9]+", "-", ART[f][0].lower()).strip("-")


def fix_part(c):
    n = c["n"]
    items = [dict(it) for it in c["items"]]
    if n in PART_IMG:
        at, f = PART_IMG[n]
        i = (
            at
            if isinstance(at, int)
            else next(j for j, it in enumerate(items) if it.get("html", "").startswith(at))
        )
        items.insert(i, {"k": "img", "f": f})
    if n >= 5:
        out = []
        for it in items:
            if it["k"] == "blank" and out and out[-1]["k"] == "blank":
                continue
            out.append(it)
        items = out
    return dict(c, items=items, lh=LH.get(n, 1.745), ind=2.0)  # one first-line indent for every part


C = [fix_part(c) for c in C]
TITLE = {c["n"]: c["title"] for c in C}
fname = lambda n: f"part-{n:02d}.html"


def picker(cur=None, label="Jump to a part"):
    opts = ['<option value="">Choose a part…</option>'] if cur is None else []
    for c in C:
        sel = " selected" if c["n"] == cur else ""
        opts.append(
            f'<option value="{fname(c["n"])}"{sel}>No. {c["n"]}: {esc(c["title"])}</option>'
        )
    return (
        f'<div class="pick"><label for="chap">{label}</label>'
        f'<select id="chap" onchange="if (this.value) location.href = this.value;">{"".join(opts)}</select></div>'
    )


def render_items(items, pm=False):
    out = []
    for it in items:
        k = it["k"]
        if k == "blank":
            out.append('<p class="blank"></p>')
        elif k == "img":
            f = it["f"]
            lab = ART[f][0]
            out.append(
                f'<figure class="inline-art"><a href="art.html#{anchor(f)}" style="border:0"><img src="{f}" alt="{esc(lab)}, artwork" loading="lazy"></a><figcaption>{esc(lab)}</figcaption></figure>'
            )
        else:
            h = it["html"].rstrip()
            if pm and "  " in h:
                # I want the spaces I typed in a glitch paragraph kept as they are: the formatter squeezes every run of
                # spaces into one, so I tell it to leave this one alone, on one line (the page keeps its spaces, class keep)
                out.append(
                    f'<!-- prettier-ignore -->\n<p class="{it["cls"]} keep">{h}</p>'
                )
            else:
                out.append(f'<p class="{it["cls"]}">{h}</p>')
    return "\n".join(out)


# how much TV static each part's background has (0 none, 1 light, 2 medium; heavy static was brought down to medium on
# 2026-10-19 and medium has no rolling TV band)
STATIC2 = {5, 8, 10, 11, 14, 15, 16, 31, 32}
STATIC2 |= {3, 6, 9, 13, 17, 19, 21, 22, 24}  # (once heavy)
STATIC2 |= {25, 33}  # (once heaviest)
THEME = {
    1: "th-indigo th-blue",
    2: "th-indigo th-blue",
    3: "th-indigo th-blue",
    4: "th-indigo th-voices",
    18: "th-black",  # The Fool and Traveler: black and white
    23: "th-chalice",  # Chalice of Tears: its seven colors in turn
    29: "th-vhs",  # VHS Tape
    33: "th-crimson",  # The Outer Darkness: the red screen
    35: "th-bluegray",  # Blue to Grey: the sky going grey
    36: "th-night",  # The Night Never Ends: the dark page and the street lights
    # Angelic Language keeps No. 36's page (the dark ground and the street lights) with its breaking on top
    39: "th-night th-binary",
}
NIGHT_FROM = 36  # every part after The Night Never Ends has its page unless I give it a page of its own above


def part_fx(n):
    lvl = 2 if n in STATIC2 else 1
    if n == 20:
        lvl = 0  # Store: no static
    if n == 29:
        lvl = 2  # I want the grey TV static on VHS Tape, very faint, so the text stays easy to read
    if n == 35:
        lvl = 2  # Blue to Grey: the static starts at nothing and comes in with the grey (site.js)
    fx = "" if n in (1, 2, 3, 4, 18, 20) else "strings bars"
    theme = THEME.get(n, "th-night" if n > NIGHT_FROM else "")
    return dict(static=lvl, fx=fx, theme=theme)


BAFFLE = '\n<script src="baffle.min.js?v=1" defer></script>'
for i, c in enumerate(C):
    n = c["n"]
    prev = C[i - 1] if i else None
    nxt = C[i + 1] if i + 1 < len(C) else None
    fxs = part_fx(n)
    body = head(
        f'No. {n}: {c["title"]} · Nous Within Kenoma',
        # Angelic Language breaks its words into binary with baffle (Cam Wiegert, MIT), before site.js uses it
        BAFFLE if "th-binary" in fxs["theme"] else "",
        **fxs,
    )
    body += '<main class="wrap">\n'
    body += f'<nav class="crumbs"><a href="parts.html">← Nous Within Kenoma</a>{picker(n)}</nav>\n'
    body += (
        f'<header><span class="num">No. {n}</span><h1>{esc(c["title"])}</h1></header>\n'
    )
    # every part flows: kept as typed, the formatter's line breaks and indents showed on a phone as pushed-in first lines
    # and empty gaps
    body += f'<article class="part flow" style="--lh:{c["lh"]};--ind:{c["ind"]}em">\n{render_items(c["items"], n >= 5)}\n</article>\n'
    if n == 4:
        # the ending of No. 4, from "Our home was broken backward" to "laid.", in indigo
        at = body.index('<p class="para">Our home was broken backward')
        end = body[at:].replace('<p class="para">', '<p class="para indigo">')
        body = body[:at] + end.replace(
            '<p class="center">', '<p class="center indigo">'
        )
    body += '<nav class="pager">'
    body += (
        f'<a href="{fname(prev["n"])}">← No. {prev["n"]}: {esc(prev["title"])}</a>'
        if prev
        else '<a href="parts.html">← All parts</a>'
    )
    body += (
        f'<a href="{fname(nxt["n"])}">No. {nxt["n"]}: {esc(nxt["title"])} →</a>'
        if nxt
        else '<a href="index.html">Home →</a>'
    )
    body += "</nav>\n</main>\n" + TAIL
    open(f"{OUT}/{fname(n)}", "w").write(body)

toc = "\n".join(
    f'<li><a href="{fname(c["n"])}"><span class="n">{c["n"]}</span><span>{esc(c["title"])}</span></a></li>'
    for c in C
)
land = head("Nous Within Kenoma") + f"""<main class="wrap">
<nav class="crumbs"><a href="index.html">← Homepage</a></nav>
<header><h1>Nous Within Kenoma</h1></header>
<section class="notice" aria-label="About these parts">
<p>This book is unfinished. These stories may still change before the book is complete. The writing is in a very much rough state and will be revised once all the parts are finished soon.</p>
<p><i>Nous Within Kenoma</i> is a collection of short stories that all take place within the same cosmology. The stories are interconnected to differing extents.</p>
</section>
{picker(None, 'Select a part for preview reading')}
<ol class="toc">
{toc}
</ol>
</main>
""" + TAIL
open(f"{OUT}/parts.html", "w").write(land)

# ---------------------------------------------------------------- front page
idx = head("Nous Within Kenoma") + f"""<main class="wide" style="max-width:1060px">
<div class="front">
<div>
  <h1 style="font-size:clamp(30px,5vw,44px);line-height:1.1;margin:0 0 10px">Nous Within Kenoma</h1>
  <p style="color:var(--dim);margin:0 0 34px;font-size:15px">Gnostic-inspired syncretic short stories</p>
  <h2 class="label">Sample Parts</h2>
  <nav class="cards"><a class="card" href="parts.html">Read the Book<span>In progress: {len(C)} parts</span></a></nav>
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
""" + TAIL
open(f"{OUT}/index.html", "w").write(idx)

# ---------------------------------------------------------------- art page
DRAW = [f for f in ART if f.startswith("art-")]
DIG = ["in-denial.jpg", "forgetting-hell.png"]


def fig(f):
    lab, ch = ART[f]
    sub = (
        f'<span><a href="{fname(ch)}">No. {ch}: {esc(TITLE[ch])}</a></span>'
        if ch
        else ("<span>Front page</span>" if f == "art-01.jpg" else "")
    )
    return (
        f'<figure id="{anchor(f)}"><a href="{f}"><img src="{f}" alt="{esc(lab)}, artwork" loading="lazy"></a>'
        f"<figcaption>{esc(lab)}{sub}</figcaption></figure>"
    )


sep = '<span class="sep">·</span> '  # the space lets a long row wrap after a dot instead of running out of its box
art = head("Additional Art · Nous Within Kenoma") + f"""<main class="wide">
<nav class="crumbs"><a href="index.html">← Nous Within Kenoma</a></nav>
<header><span class="num">Nous Within Kenoma</span><h1>Additional Art</h1></header>
<p class="intro">Drawings and digital pieces. They help carry the atmosphere of the stories.</p>
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
""" + TAIL
open(f"{OUT}/art.html", "w").write(art)

# ---------------------------------------------------------------- the codex and the maps are gone (v79h): their old pages leave the site
for f in os.listdir(OUT):
    if f.endswith(".html") and (
        f.startswith(("being-", "place-", "codex-"))
        or f
        in (
            "beings.html",
            "locations.html",
            "kenoma-character-web.html",
            "kenoma-cosmos-map.html",
        )
    ):
        os.remove(f"{OUT}/{f}")

exec(open("game_pages.py").read())

for old in ("reader.css",):
    if os.path.exists(f"{OUT}/{old}"):
        os.remove(f"{OUT}/{old}")
# v77c: the game's script must parse (a name declared twice, a stray bracket) or nothing is built for the site
import shutil, subprocess, sys

if shutil.which("node"):
    chk = subprocess.run(
        [
            "node",
            "-e",
            "new Function(require('fs').readFileSync(process.argv[1],'utf8'))",
            f"{OUT}/ethers-crossroads.js",
        ],
        capture_output=True,
        text=True,
    )
    if chk.returncode:
        sys.stderr.write(
            "ethers-crossroads.js does not parse:\n"
            + (chk.stderr or chk.stdout)[-1500:]
            + "\n"
        )
        sys.exit(1)
# v78j: a version note ("// v78j: …") is the end of its line: code after it would be commented out without a sound
import glob, re

_code = re.compile(r"if\(|\)return\b|return;|\)\{|\};|(?:const|let) \w+\s*=|=>")
_cut = [
    f"{os.path.basename(f)}:{i}"
    for f in sorted(glob.glob("game/src/*.js"))
    for i, l in enumerate(open(f, encoding="utf8"), 1)
    for m in re.finditer(r"//\s*v\d+[a-z]?\b", l)
    if _code.search(l[m.end() :])
]
if _cut:
    sys.stderr.write("code after a // note (commented out): " + ", ".join(_cut) + "\n")
    sys.exit(1)


# ---------------------------------------------------------------- v79j: the site in folders
# Everything above is built flat; here each file goes to its folder and every reference between files (href, src, url(),
# the strings in the scripts) is rewritten to the new place. index.html stays at the root, where GitHub Pages starts.
#   book/  the parts and their list · art/  the art page and the pictures · game/  Ether's Crossroads
#   assets/  what every page shares: site.css, site.js, the fonts, the icon, the dark fantasy backdrop
def _folder(f):
    if (f.startswith("part-") and f.endswith(".html")) or f == "parts.html":
        return "book"
    if f in (
        "art.html",
        "kenoma-art.jpg",
        "in-denial.jpg",
        "forgetting-hell.png",
    ) or re.match(r"art-\d+\.jpg$", f):
        return "art"
    if f.startswith("ethers-crossroads") or f in ("ec-music.js", "banker.png"):
        return "game"
    return "assets"


FOLDER = {f: _folder(f) for f in os.listdir(OUT) if f != "index.html"}
where = lambda f: f"{FOLDER[f]}/{f}" if f in FOLDER else f
_names = sorted([*FOLDER, "index.html"], key=len, reverse=True)
_ref = re.compile(
    r"(?<![\w./-])(" + "|".join(map(re.escape, _names)) + r')(?=[?#"\'`)\s,;]|$)'
)


def _fix(text, home):
    return _ref.sub(
        lambda m: os.path.relpath(where(m.group(1)), home or ".").replace(os.sep, "/"),
        text,
    )


for d in set(FOLDER.values()):
    os.makedirs(f"{OUT}/{d}", exist_ok=True)
for f in [*FOLDER, "index.html"]:
    src, dst = f"{OUT}/{f}", f"{OUT}/{where(f)}"
    if f.endswith((".html", ".css", ".js")):
        t = _fix(open(src, encoding="utf8").read(), FOLDER.get(f, ""))
        if dst != src:
            os.remove(src)
        open(dst, "w", encoding="utf8").write(t)
    elif dst != src:
        shutil.move(src, dst)
# the old addresses (before the folders, and the pages that are gone) land where they belong now, or on the front page
# the chapters became parts on 2026-11-15 (40 of them, numbered anew): each old chapter's address lands on its part, and a
# chapter that is no longer in the book lands on the list of parts
OLD = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 11, 13: 12, 14: 13, 17: 14, 18: 15, 19: 31, 22: 32}
OLD |= {23: 33, 24: 16, 25: 17, 26: 18, 28: 19, 35: 20, 36: 10, 37: 21, 38: 22, 39: 23, 40: 24, 41: 25, 42: 26}
OLD |= {46: 27, 47: 28, 50: 29, 53: 30, 54: 34, 55: 35, 56: 36, 57: 37, 58: 38, 59: 39, 60: 40}
_gone = {f"chapter-{o:02d}.html": where(fname(OLD[o]) if o in OLD else "parts.html") for o in range(1, 61)}
_moved = json.dumps(
    {f: where(f) for f in FOLDER if f.endswith(".html")}
    | _gone
    | {"chapters.html": where("parts.html")}
)
open(f"{OUT}/404.html", "w").write(
    """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nous Within Kenoma</title>
<script>(function(){var M="""
    + _moved
    + """,p=location.pathname,i=p.lastIndexOf("/"),d=p.slice(0,i+1).replace(/(book|art|game|assets)[/]$/,""),f=p.slice(i+1),to=M[f];
location.replace(d+(to||"index.html")+(to?location.search+location.hash:""))})()</script>
<p style="font-family:monospace;padding:24px">This page has moved. <a href="/Nous-Within-Kenoma/">Nous Within Kenoma</a></p>
"""
)
# every reference must point at a file that is there
_bad = []
for root, _, files in os.walk(OUT):
    for f in files:
        if not f.endswith((".html", ".css")):
            continue
        t = open(f"{root}/{f}", encoding="utf8").read()
        for m in re.finditer(
            r'(?:href|src)="(?![a-z]+:)([^"#?:]+)|url\(["\']?([^"\')?#:]+)', t
        ):
            u = m.group(1) or m.group(2)
            if (
                u
                and not u.startswith(("/", "data", "javascript", "%"))
                and not os.path.exists(os.path.normpath(f"{root}/{u}"))
            ):
                _bad.append(f"{os.path.relpath(root, OUT)}/{f} → {u}")
if _bad:
    sys.stderr.write(
        "broken references:\n  " + "\n  ".join(sorted(set(_bad))[:40]) + "\n"
    )
    sys.exit(1)
print(
    "built",
    sum(len(fs) for _, _, fs in os.walk(OUT)),
    "files in",
    ", ".join(sorted({*FOLDER.values()})) + " and the root",
)
