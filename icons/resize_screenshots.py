"""Convert raw Windows screenshots to Chrome Web Store-compliant 1280x800 24-bit PNG (no alpha)."""
from PIL import Image
from pathlib import Path

TARGET_W, TARGET_H = 1280, 800
PAD_COLOR = (255, 255, 255)  # white letterbox if aspect doesn't match exactly

inputs = [
    Path(r"c:/Users/sahith/Desktop/CAPTCHA SOLVER/Screenshot 2026-04-29 005527.png"),
    Path(r"c:/Users/sahith/Desktop/CAPTCHA SOLVER/Screenshot 2026-04-29 005622.png"),
]
out_dir = Path(r"c:/Users/sahith/Desktop/CAPTCHA SOLVER/store_screenshots")
out_dir.mkdir(exist_ok=True)

for i, p in enumerate(inputs, 1):
    if not p.exists():
        print(f"MISSING: {p}")
        continue
    im = Image.open(p).convert("RGB")  # drop alpha → 24-bit
    src_w, src_h = im.size

    # Fit-with-padding (preserve aspect, no cropping, white letterbox)
    src_aspect = src_w / src_h
    tgt_aspect = TARGET_W / TARGET_H
    if src_aspect > tgt_aspect:
        # source is wider — fit to target width, pad top/bottom
        new_w = TARGET_W
        new_h = int(TARGET_W / src_aspect)
    else:
        # source is taller (likely for the cropped login card screenshot)
        new_h = TARGET_H
        new_w = int(TARGET_H * src_aspect)

    resized = im.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (TARGET_W, TARGET_H), PAD_COLOR)
    canvas.paste(resized, ((TARGET_W - new_w) // 2, (TARGET_H - new_h) // 2))

    out = out_dir / f"screenshot_{i:02d}.png"
    canvas.save(out, format="PNG", optimize=True)
    print(f"  in:  {p.name}  ({src_w}x{src_h})")
    print(f"  out: {out}  ({TARGET_W}x{TARGET_H}, fitted {new_w}x{new_h})")
    print(f"  size: {out.stat().st_size / 1024:.1f} KB\n")

print("done. drop these into Chrome dev console 'Screenshots'.")
