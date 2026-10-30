import os, zipfile, shutil

S = "site"
OUT = "parts"
shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)
files = sorted(os.listdir(S))
codex = [f for f in files if f.startswith(("being-", "place-"))]
main = [f for f in files if f not in codex]
upd = [
    "ethers-crossroads.css",
    "ethers-crossroads.html",
    "ethers-crossroads-rules.html",
    "ethers-crossroads-play.html",
    "ethers-crossroads.js",
]


def z(name, folder, lst):
    with zipfile.ZipFile(f"{OUT}/{name}.zip", "w", zipfile.ZIP_DEFLATED) as Z:
        for f in lst:
            Z.write(f"{S}/{f}", f"{folder}/{f}")
    print(name, len(lst))


z("nwk-site-part-1-of-2", "nwk-part-1", main)
z("nwk-site-part-2-of-2", "nwk-part-2", codex)
z("ethers-crossroads-v37-update", "ec-update", upd)
