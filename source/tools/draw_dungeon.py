"""Draw the Dark Fantasy theme's background: an old dungeon room in pixel art, drawn at 320x180 and scaled up 4x (nearest
neighbour) so every pixel stays crisp. Stone walls, a cobbled floor, a torch, a bookshelf of spell books and tomes, a table with
candles, an open grimoire and a gold chalice, a painting of a jester, a stone statue, and dark blood on the walls and floor.
Run: python3 -I tools/draw_dungeon.py  ->  assets/dark-fantasy.png"""

import random, math
from PIL import Image, ImageDraw

W, H, S = 320, 180, 4
R = random.Random(38)
img = Image.new("RGB", (W, H), (12, 10, 14))
px = img.load()
d = ImageDraw.Draw(img)


def clamp(v):
    return max(0, min(255, int(v)))


def shade(c, f):
    return tuple(clamp(x * f) for x in c)


def mix(a, b, t):
    return tuple(clamp(a[i] * (1 - t) + b[i] * t) for i in range(3))


def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[x, y] = c


def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1):
        for x in range(x0, x1):
            put(x, y, c)


FLOOR = 138
# ---------- the stone wall: rows of rough blocks, each with its own tone and grain ----------
STONE = [(58, 56, 66), (64, 61, 70), (52, 50, 60), (70, 66, 74), (48, 47, 57)]
MORTAR = (22, 20, 26)
y, row = 0, 0
while y < FLOOR:
    h = R.choice([11, 12, 13])
    x = -R.randint(0, 18) if row % 2 else -R.randint(8, 26)
    while x < W:
        w = R.randint(18, 30)
        base = R.choice(STONE)
        for yy in range(y, min(y + h, FLOOR)):
            for xx in range(x, x + w):
                if not (0 <= xx < W):
                    continue
                edge = yy == y or xx == x
                if edge:
                    c = MORTAR
                else:
                    n = R.random()
                    c = shade(base, 0.86 + 0.24 * n)
                    if yy == y + 1 or xx == x + 1:
                        c = shade(c, 1.15)  # a lit top-left edge
                    if yy == y + h - 1 or xx == x + w - 1:
                        c = shade(c, 0.72)  # a shadowed bottom-right edge
                put(xx, yy, c)
        # cracks and chips
        if R.random() < 0.28:
            cx, cy = x + R.randint(3, max(4, w - 4)), y + R.randint(2, max(3, h - 3))
            for _ in range(R.randint(3, 7)):
                put(cx, cy, MORTAR)
                cx += R.choice([-1, 0, 1])
                cy += R.choice([0, 1])
        x += w
    y += h
    row += 1

# ---------- the floor: cobbles in rows that tighten toward the wall ----------
rect(0, FLOOR, W, H, (20, 18, 22))
fy = FLOOR + 1
for i in range(8):
    h = 3 + i
    x = -R.randint(0, 12)
    while x < W:
        w = R.randint(9, 16) + i * 2
        base = shade(R.choice(STONE), 0.8 + i * 0.04)
        for yy in range(fy, min(fy + h, H)):
            for xx in range(x + 1, x + w):
                t = (yy - fy) / max(1, h - 1)
                c = shade(base, 0.92 + 0.2 * R.random() - 0.2 * t)
                if yy == fy:
                    c = shade(c, 1.12)
                put(xx, yy, c)
        x += w
    fy += h + 1
    if fy >= H:
        break
# the wall's foot in shadow
for x in range(W):
    for k in range(4):
        put(x, FLOOR - 1 - k, shade(px[x, FLOOR - 1 - k], 0.55 + k * 0.1))

# ---------- the bookshelf (left): spell books and tomes ----------
BX, BY, BW, BH = 14, 44, 64, 94
WOOD, WOOD_D, WOOD_L = (66, 40, 24), (40, 24, 14), (92, 58, 34)
rect(BX - 2, BY - 4, BX + BW + 2, BY + BH, WOOD_D)
rect(BX, BY - 2, BX + BW, BY + BH, (28, 18, 12))
SPINES = [
    (120, 22, 30),
    (34, 58, 40),
    (34, 40, 78),
    (92, 62, 30),
    (70, 24, 70),
    (140, 120, 70),
    (40, 34, 30),
    (96, 30, 36),
]
for s in range(4):
    sy = BY + s * 23
    rect(BX - 2, sy + 20, BX + BW + 2, sy + 23, WOOD)
    for x in range(BX - 2, BX + BW + 2):
        put(x, sy + 20, WOOD_L)
    x = BX + 1
    while x < BX + BW - 3:
        bw = R.randint(3, 6)
        bh = R.randint(12, 19)
        if R.random() < 0.12:  # a tome lying on its side
            tw = R.randint(10, 14)
            c = R.choice(SPINES)
            rect(x, sy + 20 - 4, x + tw, sy + 20, c)
            rect(x, sy + 20 - 4, x + tw, sy + 20 - 3, shade(c, 1.3))
            x += tw + 1
            continue
        c = R.choice(SPINES)
        rect(x, sy + 20 - bh, x + bw, sy + 20, c)
        for yy in range(sy + 20 - bh, sy + 20):
            put(x, yy, shade(c, 1.35))
            put(x + bw - 1, yy, shade(c, 0.6))
        if bh > 13:
            put(x + bw // 2, sy + 20 - bh + 3, (200, 170, 90))
            put(x + bw // 2, sy + 20 - 4, (200, 170, 90))  # gilt bands
        x += bw + R.choice([0, 0, 1])
# a skull on the top shelf
sx, sy = BX + BW - 14, BY - 9
d.ellipse([sx, sy, sx + 9, sy + 8], fill=(214, 206, 186))
rect(sx + 2, sy + 7, sx + 8, sy + 10, (196, 188, 168))
put(sx + 3, sy + 4, (20, 16, 18))
put(sx + 6, sy + 4, (20, 16, 18))
put(sx + 3, sy + 5, (20, 16, 18))
put(sx + 6, sy + 5, (20, 16, 18))

# ---------- the painting of a jester (center-left, gold frame) ----------
PX, PY, PW, PH = 104, 22, 46, 58
GOLD, GOLD_D, GOLD_L = (176, 136, 52), (110, 78, 26), (232, 196, 104)
rect(PX - 4, PY - 4, PX + PW + 4, PY + PH + 4, GOLD_D)
rect(PX - 3, PY - 3, PX + PW + 3, PY + PH + 3, GOLD)
for x in range(PX - 3, PX + PW + 3):
    put(x, PY - 3, GOLD_L)
for yy in range(PY - 3, PY + PH + 3):
    put(PX - 3, yy, GOLD_L)
for k in range(0, PW + 6, 5):
    put(PX - 3 + k, PY + PH + 2, GOLD_L)
# the canvas: a dark green ground, the jester in red and black
for yy in range(PY, PY + PH):
    for xx in range(PX, PX + PW):
        put(xx, yy, mix((22, 34, 28), (10, 14, 12), (yy - PY) / PH + 0.15 * R.random()))
cx = PX + PW // 2
# collar and body, quartered red and black
for yy in range(PY + 34, PY + PH):
    half = 7 + (yy - (PY + 34)) // 2
    for xx in range(cx - half, cx + half):
        put(xx, yy, (130, 20, 28) if (xx < cx) ^ (yy > PY + 46) else (58, 52, 70))
for k in range(-9, 10, 3):
    rect(cx + k - 1, PY + 32, cx + k + 2, PY + 36, (212, 196, 150))  # the ruff
# the two-pointed hat with bells
for t in range(14):
    for side in (-1, 1):
        x0 = cx + side * (2 + t)
        yy = PY + 17 - t // 2 - (t * t) // 40
        col = (130, 20, 28) if side < 0 else (58, 52, 70)
        rect(
            min(x0, cx + side * 2),
            yy,
            max(x0, cx + side * 2) + 1,
            yy + 2 + (14 - t) // 3,
            col,
        )
for side in (-1, 1):
    bx, by = cx + side * 16, PY + 7
    d.ellipse([bx - 2, by - 2, bx + 2, by + 2], fill=GOLD_L)

# the face: chalk white and narrow, black diamond eyes with crimson tears, a thin wide grin
d.ellipse([cx - 6, PY + 18, cx + 6, PY + 35], fill=(232, 228, 222))
for ex in (cx - 3, cx + 3):
    for ox, oy in (
        (0, -2),
        (-1, -1),
        (0, -1),
        (1, -1),
        (-1, 0),
        (0, 0),
        (1, 0),
        (0, 1),
    ):
        put(ex + ox, PY + 24 + oy, (12, 8, 10))
    put(ex, PY + 27, (150, 16, 26))
    put(ex, PY + 28, (150, 16, 26))
    put(ex, PY + 29, (110, 10, 18))
for k in range(-5, 6):
    yy = PY + 31 - (1 if abs(k) >= 4 else 0) - (1 if abs(k) == 5 else 0)
    put(cx + k, yy, (140, 14, 24))
    if abs(k) < 4:
        put(cx + k, yy + 1, (60, 8, 12))
for k in (-2, 0, 2):
    put(cx + k, PY + 31, (220, 214, 200))  # teeth in the grin
# ---------- the torch (center), with its glow ----------
TX, TY = 178, 52
rect(TX - 1, TY, TX + 2, TY + 18, (60, 44, 30))
rect(TX - 4, TY + 12, TX + 5, TY + 14, (50, 48, 54))  # handle and iron bracket
rect(TX - 3, TY - 3, TX + 4, TY + 1, (40, 30, 22))
FL = [(255, 236, 160), (255, 196, 70), (240, 120, 30), (180, 50, 20)]
for i, c in enumerate(reversed(FL)):
    r = 7 - i * 1.6
    for yy in range(int(TY - 14), TY):
        for xx in range(TX - 6, TX + 7):
            dx, dy = (xx - TX) / max(0.6, r * 0.6), (yy - (TY - 4)) / max(0.6, r * 1.4)
            if dx * dx + dy * dy < 1 and R.random() < 0.92:
                put(xx, yy, c)

# ---------- the table (right of center): candles, a grimoire, a chalice ----------
TBX, TBY, TBW = 196, 112, 72
rect(TBX, TBY, TBX + TBW, TBY + 5, WOOD)
rect(TBX, TBY, TBX + TBW, TBY + 1, WOOD_L)
rect(TBX + 4, TBY + 5, TBX + 8, FLOOR + 6, WOOD_D)
rect(TBX + TBW - 8, TBY + 5, TBX + TBW - 4, FLOOR + 6, WOOD_D)
# the open grimoire with glyphs
rect(TBX + 20, TBY - 4, TBX + 44, TBY, (210, 196, 160))
put(TBX + 32, TBY - 4, (120, 100, 70))
for k in range(5):
    for side in (0, 13):
        rect(
            TBX + 22 + side,
            TBY - 3 + (k % 3),
            TBX + 22 + side + R.randint(4, 9),
            TBY - 2 + (k % 3),
            (110, 30, 36) if k == 2 else (60, 50, 40),
        )
rect(TBX + 19, TBY - 1, TBX + 45, TBY, (90, 24, 30))
# the gold chalice with wine
CX = TBX + 54
rect(CX - 4, TBY - 10, CX + 5, TBY - 9, GOLD_L)
rect(CX - 3, TBY - 9, CX + 4, TBY - 6, GOLD)
rect(CX - 3, TBY - 10, CX + 4, TBY - 9, (110, 10, 24))
rect(CX - 1, TBY - 6, CX + 2, TBY - 2, GOLD_D)
rect(CX - 3, TBY - 2, CX + 4, TBY, GOLD)
# candles: wax, drips, flames
for cxx, hh in ((TBX + 8, 14), (TBX + 13, 9), (TBX + 64, 12)):
    rect(cxx, TBY - hh, cxx + 3, TBY, (226, 216, 196))
    put(cxx - 1, TBY - hh + 3, (226, 216, 196))
    put(cxx + 3, TBY - hh + 5, (226, 216, 196))
    put(cxx + 1, TBY - hh - 1, (60, 40, 30))
    for k, c in enumerate(FL[:3]):
        put(cxx + 1, TBY - hh - 2 - k, c)
    put(cxx, TBY - hh - 3, FL[1])
    put(cxx + 2, TBY - hh - 3, FL[2])

# ---------- the statue (right): a hooded figure on a plinth ----------
SX, SB = 290, FLOOR + 2
ST, STD, STL = (104, 102, 110), (64, 62, 72), (140, 138, 146)
rect(SX - 12, SB - 10, SX + 13, SB, STD)
rect(SX - 12, SB - 10, SX + 13, SB - 9, STL)
for yy in range(SB - 74, SB - 10):
    t = (yy - (SB - 74)) / 64
    half = int(4 + t * 9)
    for xx in range(SX - half, SX + half + 1):
        c = ST if xx < SX + half // 3 else STD
        if xx == SX - half:
            c = STL
        put(xx, yy, shade(c, 0.9 + 0.2 * R.random()))
d.ellipse([SX - 7, SB - 86, SX + 7, SB - 70], fill=ST)  # the hood
d.ellipse(
    [SX - 4, SB - 80, SX + 4, SB - 72], fill=(18, 16, 20)
)  # the dark face under it
for yy in range(SB - 60, SB - 40):
    put(SX - 6 + (yy % 2), yy, STD)
    put(SX + 6 - (yy % 2), yy, STD)  # folds of the robe
rect(SX - 3, SB - 56, SX + 4, SB - 50, STL)  # hands folded on a stone book


# ---------- a chain with a shackle, and cobwebs in the corners ----------
CHX = 162
for k in range(0, 46, 3):
    c = (70, 68, 76) if (k // 3) % 2 else (96, 94, 102)
    rect(CHX, 8 + k, CHX + 2, 8 + k + 3, c)
    put(CHX - 1 if (k // 3) % 2 else CHX + 2, 9 + k, shade(c, 0.6))
d.ellipse([CHX - 4, 54, CHX + 6, 64], outline=(96, 94, 102))
d.ellipse([CHX - 3, 55, CHX + 5, 63], outline=(60, 58, 66))
for ox, oy, sx, sy in ((0, 0, 1, 1), (W - 1, 0, -1, 1)):
    for a in range(0, 90, 15):
        t = math.radians(a)
        for rr in range(0, 26):
            put(
                ox + sx * int(rr * math.cos(t)),
                oy + sy * int(rr * math.sin(t) * 0.8),
                (150, 150, 158) if rr % 2 else (110, 110, 118),
            )
    for rr in (8, 15, 22):
        for a in range(0, 91, 3):
            t = math.radians(a)
            put(
                ox + sx * int(rr * math.cos(t)),
                oy + sy * int(rr * math.sin(t) * 0.8),
                (120, 120, 128),
            )

# ---------- blood: drips down the wall, a pool and spatters on the floor ----------
BLOOD, BLOOD_D, BLOOD_L = (92, 8, 14), (52, 4, 8), (130, 16, 22)
for bx in (88, 92, 160, 236, 252):
    top = R.randint(60, 110)
    ln = R.randint(10, 30)
    for k in range(ln):
        put(bx, top + k, BLOOD if k < ln - 2 else BLOOD_D)
        if k < 4:
            put(bx + 1, top + k, BLOOD_D)
    put(bx, top + ln, BLOOD_L)
for bx, by, rx, ry in (
    (120, 160, 22, 7),
    (154, 170, 12, 4),
    (60, 150, 8, 3),
    (230, 176, 14, 4),
):
    for yy in range(by - ry, by + ry + 1):
        for xx in range(bx - rx, bx + rx + 1):
            if ((xx - bx) / rx) ** 2 + ((yy - by) / ry) ** 2 + 0.25 * R.random() < 1:
                put(xx, yy, mix(BLOOD_D, BLOOD, R.random() * 0.6))
for _ in range(60):
    a = R.random() * 6.28
    rr = R.uniform(24, 60)
    put(int(120 + math.cos(a) * rr), int(160 + math.sin(a) * rr * 0.3), BLOOD)

# ---------- light: the torch and the candles warm what is near them; the edges fall into the dark ----------
lights = [
    (TX, TY - 6, 120, 1.0),
    (TBX + 10, TBY - 16, 50, 0.6),
    (TBX + 66, TBY - 14, 40, 0.5),
]
out = img.copy()
po = out.load()
for yy in range(H):
    for xx in range(W):
        c = px[xx, yy]
        warm = 0
        for lx, ly, rad, k in lights:
            dd = math.hypot(xx - lx, (yy - ly) * 1.1)
            if dd < rad:
                warm = max(warm, k * (1 - dd / rad) ** 1.6)
        vig = 1 - 0.55 * (
            math.hypot((xx - W / 2) / (W / 2), (yy - H * 0.45) / (H * 0.6)) ** 2
        )
        f = max(0.18, vig) * (0.62 + 0.75 * warm)
        r, g, b = (
            c[0] * f + 60 * warm,
            c[1] * f + 26 * warm,
            c[2] * f * (1 - 0.3 * warm),
        )
        po[xx, yy] = (clamp(r), clamp(g), clamp(b))
# a few pixels of dither on the darkest walls, for the old-cartridge feel
for _ in range(1600):
    xx, yy = R.randrange(W), R.randrange(H)
    po[xx, yy] = shade(po[xx, yy], 0.8)

big = out.resize((W * S, H * S), Image.NEAREST)
big = big.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
big.save("assets/dark-fantasy.png", optimize=True)
print("assets/dark-fantasy.png", big.size)
