"""Draw the Banker's portrait for the Bank window, in the same chunky pixel art as the Dark Fantasy background: the Banker in his
top hat (as on his card) behind an arched dungeon window, with shelves and heaps of gold behind him and a stone sill in front.
Drawn at 32x32 and scaled up 4x (nearest neighbour).
Run: python3 -I tools/draw_banker.py  ->  assets/banker.png"""
import random, math
from PIL import Image

N, S = 32, 4
R = random.Random(44)
MAP = [
 "################################",
 "################################",
 "##########OOOOOOOOOOOO##########",
 "#######OOODDDDLLLLDDDDOOO#######",
 "######OODDDDLLLLLLLLDDDDOO######",
 "#####ODDDDDLHHHHHHHHLDDDDDO#####",
 "#####ODDYDDLHhHHHHHHLDDYDDO#####",
 "####ODDGYGDLHhHHHHHHLDGYGDDO####",
 "####OgGGGGDLHhHHHHHHLDGGGGgO####",
 "####OPPPPPDLHhHHHHHHLDPPPPPO####",
 "####ODDDDDLLBBBBBBBBLLDDDDDO####",
 "####ODDYDDHHHHHHHHHHHHDDYDDO####",
 "####ODGYGDDLffffffffLDDGYGDO####",
 "####OGGGGGDLFFFFFFFFLDGGGGGO####",
 "####OgGGGgDLFFEFFEFFLDgGGGgO####",
 "####OPPPPPDLFFFfFFFFLDPPPPPO####",
 "####ODDDDDDLFmFFFFmFLDDDDDDO####",
 "####ODDDDYDDfFmmmmFfDDYDDDDO####",
 "####OGYDDGGDDfFFFFfDDGGDDYGO####",
 "####OGGYGGCCWWWRRWWWCCGGYGGO####",
 "####OGGGGCCCCWWRRWWCCCCGGGGO####",
 "####OgGGCCcCCCCRRCCCCcCCGGgO####",
 "####OGYCCcCCCCCRRCCCCCcCCYGO####",
 "####OGGCcCCCCCCBCCCCCCCcCGGO####",
 "####OGGCcCCCCCCBCCCCCCCcCGGO####",
 "###kKKKKKKKKKKKKKKKKKKKKKKKKk###",
 "###kkkkkkkkkkkkkkkkkkkkkkkkkk###",
 "################################",
 "################################",
 "################################",
 "################################",
 "################################",
]
PAL = {"D": (22, 16, 14), "G": (214, 168, 58), "g": (150, 108, 34), "Y": (255, 230, 136), "P": (84, 56, 34),
       "O": (92, 88, 102), "H": (18, 16, 22), "h": (92, 86, 104), "B": (206, 164, 62), "F": (224, 198, 166), "f": (172, 140, 112),
       "E": (20, 14, 12), "M": (122, 40, 40), "m": (112, 52, 44), "L": (74, 50, 28), "W": (230, 226, 214), "R": (146, 24, 32), "C": (46, 34, 54), "c": (74, 58, 86),
       "K": (104, 100, 112), "k": (44, 42, 50)}
STONE = [(58, 56, 66), (64, 61, 70), (52, 50, 60), (70, 66, 74), (48, 47, 57)]
MORTAR = (22, 20, 26)

def clamp(v): return max(0, min(255, int(v)))
def shade(c, f): return tuple(clamp(x * f) for x in c)

img = Image.new("RGB", (N, N))
px = img.load()
# the wall: staggered blocks five wide and four high
tone = {}
for y in range(N):
    for x in range(N):
        row = y // 4
        off = 2 if row % 2 else 0
        bx = (x + off) // 5
        if (row, bx) not in tone: tone[(row, bx)] = R.choice(STONE)
        mortar = y % 4 == 0 or (x + off) % 5 == 0
        px[x, y] = MORTAR if mortar else shade(tone[(row, bx)], 0.88 + 0.22 * R.random())
for y, line in enumerate(MAP):
    assert len(line) == N, (y, len(line))
    for x, ch in enumerate(line):
        if ch == "#": continue
        c = PAL[ch]
        if ch in "OK": c = shade(c, 0.85 + 0.3 * R.random())        # rough stone
        if ch == "O" and (x + y) % 3 == 0: c = MORTAR if R.random() < .35 else c
        if ch in "DL": c = shade(c, 0.8 + 0.4 * R.random())
        px[x, y] = c
# light: a warm glow from the gold behind him; the corners fall into the dark
for y in range(N):
    for x in range(N):
        r, g, b = px[x, y]
        dx, dy = (x - 15.5) / 16, (y - 14) / 16
        dist = math.sqrt(dx * dx + dy * dy)
        warm = max(0, 1 - dist * 1.3) * 0.25
        dark = 1 - max(0, dist - 0.55) * 0.9
        px[x, y] = (clamp((r + 40 * warm) * dark), clamp((g + 22 * warm) * dark), clamp(b * dark))
img.resize((N * S, N * S), Image.NEAREST).save("assets/banker.png", optimize=True)
print("assets/banker.png")
