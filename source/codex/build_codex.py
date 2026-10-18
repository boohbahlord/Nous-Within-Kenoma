import json
T=open('codex/template.html').read()
def build(mod, out, title, sub, other, otherhref):
    g={}; exec(open(mod).read(), g)
    s=(T.replace('%%TITLE%%',title).replace('%%SUB%%',sub).replace('%%OTHER%%',other).replace('%%OTHERHREF%%',otherhref)
        .replace('%%CATS%%',json.dumps(g['CATS'],ensure_ascii=False)).replace('%%DATA%%',json.dumps(g['E'],ensure_ascii=False)))
    open(out,'w').write(s)
build('codex/beings.py','nwk/codex-beings.html','Codex of Beings',
      'Characters and kinds of beings, with the forms each one takes. Tap a form to switch between them. Names are kept exactly as each chapter gives them; lines marked Note come from the author.',
      'Codex of Locations','codex-locations.html')
build('codex/locations.py','nwk/codex-locations.html','Codex of Locations',
      'Realms, rooms and the places between, from the Fullness to the trailer hallway. Tap a form to switch between a place’s appearances. Lines marked Note come from the author.',
      'Codex of Beings','codex-beings.html')
print('ok')
