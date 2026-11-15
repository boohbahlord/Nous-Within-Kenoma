"""Turn my manuscript (the .odt from LibreOffice) into parts_all.json, the words of every part as the site builds them.

usage: python3 -I tools/odt_to_parts.py "Nous Within Kenoma.odt"   (from source/)

Every heading (Heading 1) after "Contents" starts a part; every paragraph under it is one paragraph, or one line of a
poem, exactly as typed: the words, the spaces, the empty paragraphs between them. Nothing is reworded or fixed. What the
page needs from the manuscript's formatting comes along: the alignment (centered, right, left), the indent (none, or the
indented block of a quotation), italic, bold, the small and the big letters, and the white letters (No. 4's faint line).
"""

import html, json, re, sys, zipfile
import xml.etree.ElementTree as ET

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
}
TX = "{%s}" % NS["text"]
ST = "{%s}" % NS["style"]

odt = zipfile.ZipFile(sys.argv[1])
content = ET.fromstring(odt.read("content.xml"))
styles = {}
for root in (ET.fromstring(odt.read("styles.xml")), content):
    for s in root.iter(ST + "style"):
        props = {}
        for p in s:
            for k, v in p.attrib.items():
                props[k.split("}")[1]] = v
        styles[s.get(ST + "name")] = (s.get(ST + "parent-style-name"), props)


def prop(name, key):
    """a style's setting, looked up through the styles it is based on"""
    for _ in range(12):
        if not name:
            return None
        parent, props = styles.get(name, (None, {}))
        if key in props:
            return props[key]
        name = parent
    return None


def look(name):
    """the letters' look a style gives: italic, bold, white, small, big"""
    f = {}
    if prop(name, "font-style") == "italic":
        f["i"] = 1
    if prop(name, "font-weight") == "bold":
        f["b"] = 1
    if prop(name, "color") == "#ffffff":
        f["w"] = 1
    size = prop(name, "font-size")
    if size and size.endswith("pt"):
        pt = float(size[:-2])
        if pt < 10:
            f["sm"] = 1
        elif pt > 14:
            f["bg"] = 1
    return f


def runs(e, out, f):
    """the text of a paragraph, piece by piece, each with its look"""
    if e.text:
        out.append((e.text, f))
    for c in e:
        if c.tag == TX + "s":
            out.append((" " * int(c.get(TX + "c", "1")), f))
        elif c.tag == TX + "tab":
            out.append(("\t", f))
        elif c.tag == TX + "line-break":
            out.append(("\n", f))
        elif c.tag == TX + "span":
            runs(c, out, {**f, **look(c.get(TX + "style-name"))})
        elif c.tag not in (TX + "soft-page-break", TX + "bookmark-start", TX + "bookmark-end", TX + "bookmark"):
            runs(c, out, f)
        if c.tail:
            out.append((c.tail, f))


TAGS = (("i", "em"), ("b", "strong"), ("sm", "small"))


def to_html(pieces, whole):
    """the paragraph's words as HTML: what the whole paragraph has goes on its class, the rest on its pieces"""
    out = []
    for t, f in pieces:
        t = html.escape(t, quote=False)
        for k, tag in TAGS:
            if f.get(k) and not whole.get(k):
                t = f"<{tag}>{t}</{tag}>"
        if f.get("w") and not whole.get("w"):
            t = f'<span class="faint">{t}</span>'
        out.append(t)
    h = "".join(out)
    for k, tag in TAGS:  # (one tag around the whole paragraph, not one per piece)
        if whole.get(k):
            h = f"<{tag}>{h}</{tag}>"
    return re.sub(r"</(em|strong|small)><\1>", "", h)


body = content.find("office:body/office:text", NS)
parts, cur = [], None
for e in body:
    if e.tag == TX + "h":
        pieces = []
        runs(e, pieces, {})
        title = "".join(t for t, _ in pieces).strip()
        cur = None if title == "Contents" else {"title": title, "items": []}
        if cur:
            parts.append(cur)
        continue
    if e.tag != TX + "p" or cur is None:
        continue
    name = e.get(TX + "style-name")
    pieces = []
    runs(e, pieces, look(name))
    text = "".join(t for t, _ in pieces)
    if not text.strip():
        cur["items"].append({"k": "blank"})
        continue
    seen = [f for t, f in pieces if t.strip()]
    whole = {k: 1 for k in ("i", "b", "w", "sm", "bg") if all(f.get(k) for f in seen)}
    al = prop(name, "text-align") or "justify"
    indent = (prop(name, "text-indent") or "0in") not in ("0in", "0cm", "0")
    inset = (prop(name, "margin-left") or "0in") not in ("0in", "0cm", "0")
    if al == "center":
        cls = ["center"]
    elif al == "end":
        cls = ["right"]
    elif al == "start":
        cls = ["left"]
    else:
        cls = ["para"] + ([] if indent else ["flush"])
    if inset:
        cls.append("quote")
    if whole.get("bg"):
        cls.append("big")
    if whole.get("w"):
        cls.append("faint")
    cur["items"].append({"k": "p", "cls": " ".join(cls), "html": to_html(pieces, whole)})

for p in parts:  # no empty paragraphs before a part's first words or after its last
    while p["items"] and p["items"][0]["k"] == "blank":
        p["items"].pop(0)
    while p["items"] and p["items"][-1]["k"] == "blank":
        p["items"].pop()
out = [{"n": i, "title": p["title"], "items": p["items"]} for i, p in enumerate(parts, 1)]
json.dump(out, open("parts_all.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(len(out), "parts:", ", ".join(f'{p["n"]} {p["title"]}' for p in out))
