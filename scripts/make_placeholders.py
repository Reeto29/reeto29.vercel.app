"""Generate placeholder photos for the masthead carousel.

These are stand-ins so the layout can be judged before real photos land.
Run:  python3 scripts/make_placeholders.py
"""

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "photos"

# Square, and only a little larger than the 96px tile. The tiles are decorative
# texture, so rendering a 1600x900 frame into 96px was ~17x oversampled for
# nothing. Sizing to the tile keeps the grid light enough to be this wide.
SIZE = 208
COUNT = 44

# Roughly the palette of the reference sunset shot plus a few others, so the
# scrim can be checked against bright skies as well as dark ones.
PALETTES = [
    # dusk: deep violet sky into a warm orange horizon
    ((38, 28, 66), (196, 108, 92), (247, 176, 106), (24, 18, 34)),
    # coastal blue hour
    ((18, 34, 62), (86, 124, 160), (206, 168, 140), (14, 22, 40)),
    # green ridgeline, overcast
    ((120, 134, 142), (168, 178, 176), (86, 104, 82), (58, 68, 60)),
    # desert noon, very bright top
    ((96, 140, 190), (176, 200, 218), (214, 176, 132), (150, 122, 96)),
    # night city
    ((10, 12, 24), (34, 40, 66), (64, 78, 112), (8, 9, 16)),
    # forest, dark and green
    ((28, 44, 36), (72, 96, 72), (44, 62, 48), (18, 26, 22)),
]


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sky(seed: int, palette) -> Image.Image:
    top, mid, horizon, ground = palette
    img = Image.new("RGB", (SIZE, SIZE))
    draw = ImageDraw.Draw(img)
    horizon_y = int(SIZE * 0.62)

    for y in range(horizon_y):
        t = y / horizon_y
        if t < 0.6:
            color = lerp(top, mid, t / 0.6)
        else:
            color = lerp(mid, horizon, (t - 0.6) / 0.4)
        draw.line([(0, y), (SIZE, y)], fill=color)

    for y in range(horizon_y, SIZE):
        t = (y - horizon_y) / (SIZE - horizon_y)
        draw.line([(0, y), (SIZE, y)], fill=lerp(ground, horizon, 1 - t))

    # A soft glow just above the horizon, which is what makes dusk shots read as
    # photographs rather than as gradients.
    rng = random.Random(seed)
    glow = Image.new("RGB", (SIZE, SIZE), (0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    cx = rng.randint(SIZE // 4, SIZE * 3 // 4)
    radius = rng.randint(340, 560)
    for r in range(radius, 0, -8):
        k = 1 - r / radius
        gdraw.ellipse(
            [cx - r, horizon_y - r * 0.55, cx + r, horizon_y + r * 0.55],
            fill=lerp((0, 0, 0), horizon, k * 0.5),
        )
    img = Image.blend(img, glow, 0.32)

    # Layered ridgelines for depth, drawn dark so they read as land.
    draw = ImageDraw.Draw(img)
    for layer in range(3):
        base = horizon_y + layer * 26
        amp = rng.randint(70, 140) - layer * 16
        shade = lerp(ground, (0, 0, 0), 0.45 + layer * 0.18)
        points = [(0, SIZE)]
        for x in range(0, SIZE + 30, 30):
            y = base + math.sin(x / rng.uniform(150, 280) + layer * 1.7) * amp
            points.append((x, y))
        points.append((SIZE, SIZE))
        draw.polygon(points, fill=shade)

    return img.filter(ImageFilter.GaussianBlur(1.1))


def shift_hue(color: tuple[int, int, int], degrees: float) -> tuple[int, int, int]:
    """Rotates a colour around the hue wheel, keeping lightness roughly intact."""
    import colorsys

    r, g, b = (c / 255 for c in color)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h = (h + degrees / 360.0) % 1.0
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return (round(r * 255), round(g * 255), round(b * 255))


def variant(palette, seed: int) -> tuple:
    """Gives each output its own hue so no two placeholders are the same picture."""
    base = PALETTES[seed % len(PALETTES)]
    # 29 is coprime with 360, so consecutive seeds land far apart on the wheel
    # instead of clustering a few degrees apart.
    turn = (seed * 29) % 360

    return tuple(shift_hue(color, turn) for color in base)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    # One per grid tile, so nothing repeats. Real photos should replace these.
    for index in range(1, COUNT + 1):
        palette = variant(None, index - 1)
        random.seed(index * 7919)
        image = sky(index * 7919, palette)
        path = OUT / f"placeholder-{index}.jpg"
        image.save(path, "JPEG", quality=70, optimize=True, progressive=True)
        print(f"{path.name}  {path.stat().st_size / 1024:.0f} kB")


if __name__ == "__main__":
    main()