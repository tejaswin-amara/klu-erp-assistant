"""
Generate Chrome Web Store icon set (16/48/128 px) + store-listing icon (128 px).

Design:
- Soft white rounded card
- Pink ('#EF476F') stylized "klu" text in SpicyRice (the actual captcha font)
  with the captcha-style per-character rotation
- Small green checkmark badge in bottom-right (signals "verified / auto-filled")
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

FONT = r"c:/Users/sahith/Desktop/CAPTCHA SOLVER/assets/SpicyRice.ttf"
PINK = (0xEF, 0x47, 0x6F, 255)
GREEN = (0x06, 0xD6, 0xA0, 255)
WHITE = (255, 255, 255, 255)
SHADOW = (0, 0, 0, 40)


def rounded_rect(size, radius, fill, ss=4):
    """Return RGBA image of a rounded rect, anti-aliased via super-sampling."""
    big = (size[0] * ss, size[1] * ss)
    img = Image.new("RGBA", big, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, big[0] - 1, big[1] - 1), radius=radius * ss, fill=fill)
    return img.resize(size, Image.LANCZOS)


def make_icon(out_size: int, out_path: Path):
    SS = 4
    W = H = out_size * SS
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Pink rounded background (like a captcha card)
    bg = rounded_rect((W, H), radius=int(out_size * 0.22), fill=PINK, ss=1)
    canvas.alpha_composite(bg)

    # White "klu" text in captcha style (using actual SpicyRice font)
    text = "klu"
    font_size = int(out_size * 0.50 * SS)
    font = ImageFont.truetype(FONT, font_size)

    # Render each char with slight rotation (captcha-style)
    char_canvases = []
    rotations = [-8, 5, -4]  # baked-in rotations per char
    total_w = 0
    for i, ch in enumerate(text):
        bbox = font.getbbox(ch)
        gw = bbox[2] - bbox[0]
        gh = bbox[3] - bbox[1]
        pad = max(gw, gh) // 2 + 8 * SS
        glyph = Image.new("RGBA", (gw + 2 * pad, gh + 2 * pad), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glyph)
        gd.text((pad - bbox[0], pad - bbox[1]), ch, font=font, fill=WHITE)
        glyph = glyph.rotate(rotations[i], resample=Image.BICUBIC, expand=True)
        b = glyph.getbbox()
        if b:
            glyph = glyph.crop(b)
        char_canvases.append(glyph)
        total_w += glyph.width

    overlap = -int(out_size * 0.05 * SS)
    total_w += overlap * (len(text) - 1)
    # Center horizontally; lift slightly above center vertically to leave room for badge
    x = (W - total_w) // 2
    y_baseline = int(H * 0.50)

    for i, glyph in enumerate(char_canvases):
        place_y = y_baseline - glyph.height // 2 + (-3 if i % 2 else 3) * SS
        canvas.alpha_composite(glyph, (x, place_y))
        x += glyph.width + overlap

    # Green check badge in bottom-right — tighter to corner, smaller
    badge_d = int(out_size * 0.36 * SS)
    badge_x = W - badge_d - int(out_size * 0.06 * SS)
    badge_y = H - badge_d - int(out_size * 0.06 * SS)
    # White outline circle for contrast
    outline_d = badge_d + 6 * SS
    outline = Image.new("RGBA", (outline_d, outline_d), (0, 0, 0, 0))
    od = ImageDraw.Draw(outline)
    od.ellipse((0, 0, outline_d - 1, outline_d - 1), fill=WHITE)
    canvas.alpha_composite(outline, (badge_x - 3 * SS, badge_y - 3 * SS))
    # Green circle
    badge = Image.new("RGBA", (badge_d, badge_d), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    bd.ellipse((0, 0, badge_d - 1, badge_d - 1), fill=GREEN)
    # Check mark (drawn as polyline)
    cx = badge_d // 2
    cy = badge_d // 2
    s = badge_d * 0.18
    points = [
        (cx - s * 1.1, cy + s * 0.05),
        (cx - s * 0.2, cy + s * 0.85),
        (cx + s * 1.15, cy - s * 0.7),
    ]
    bd.line(points, fill=WHITE, width=int(badge_d * 0.13), joint="curve")
    canvas.alpha_composite(badge, (badge_x, badge_y))

    # Downsample for crisp anti-aliasing
    final = canvas.resize((out_size, out_size), Image.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path)
    print(f"wrote {out_path} ({out_size}x{out_size})")


if __name__ == "__main__":
    here = Path(__file__).parent
    for size in [16, 48, 128]:
        make_icon(size, here / f"icon{size}.png")
    # Also write a "store icon" copy for the dev console upload
    make_icon(128, here.parent.parent / "store_icon_128.png")
    print("\ndone. extension icons + store_icon_128.png ready.")
