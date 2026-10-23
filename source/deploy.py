"""Copy the built site (source/site) to the repository root, which GitHub Pages serves.

Run after build_all.py, from source/:  python3 -I deploy.py
Changed files are copied; files in the site's folders (assets, book, art, game) that the build no longer makes are removed."""
import filecmp, os, shutil

SRC, DST, FOLDERS = 'site', '..', ('assets', 'book', 'art', 'game')
for root, _, files in os.walk(SRC):
    out = os.path.normpath(os.path.join(DST, os.path.relpath(root, SRC)))
    os.makedirs(out, exist_ok=True)
    for f in files:
        a, b = os.path.join(root, f), os.path.join(out, f)
        if not os.path.exists(b) or not filecmp.cmp(a, b, shallow=False):
            shutil.copy2(a, b); print('copied ', os.path.relpath(b, DST))
for d in FOLDERS:
    for root, _, files in os.walk(os.path.join(DST, d)):
        for f in files:
            b = os.path.join(root, f)
            if not os.path.exists(os.path.join(SRC, os.path.relpath(b, DST))):
                os.remove(b); print('removed', os.path.relpath(b, DST))
