import math
from PIL import Image, ImageDraw

def create_ultra_clean_icon(output_path, size=512):
    s = 4
    canvas_size = size * s
    cx, cy = canvas_size / 2.0, canvas_size / 2.0
    u = canvas_size / 1000.0

    # 1. Premium Dark Background (#0F172A to #090D16)
    img = Image.new("RGB", (canvas_size, canvas_size), (15, 23, 42))
    bg_draw = ImageDraw.Draw(img)
    
    top_c = (15, 23, 42)
    bot_c = (9, 13, 22)
    for y in range(canvas_size):
        t = y / float(canvas_size)
        r = int(top_c[0] + (bot_c[0] - top_c[0]) * t)
        g = int(top_c[1] + (bot_c[1] - top_c[1]) * t)
        b = int(top_c[2] + (bot_c[2] - top_c[2]) * t)
        bg_draw.line([(0, y), (canvas_size, y)], fill=(r, g, b))

    img = img.convert("RGBA")

    # 2. Geometry definition
    # Loop Polygon (Roof / Hexagon Gable 'P' Loop)
    roof_poly = [
        (cx - 70*u, cy - 250*u),
        (cx + 90*u, cy - 365*u),   # High Roof Peak
        (cx + 290*u, cy - 185*u),  # Top Right
        (cx + 290*u, cy + 40*u),   # Mid Right
        (cx + 120*u, cy + 185*u),  # Bottom Right Corner
        (cx - 70*u, cy + 185*u),   # Bottom Left
        (cx - 70*u, cy + 65*u),    # Inner Bottom
        (cx + 80*u, cy + 65*u),    # Inner Bottom Right
        (cx + 175*u, cy - 25*u),   # Inner Right
        (cx + 175*u, cy - 130*u),  # Inner Right Top
        (cx + 80*u, cy - 215*u),   # Inner Roof Peak
        (cx - 70*u, cy - 135*u)
    ]
    
    # Stem Box
    stem_left = cx - 250 * u
    stem_right = cx - 90 * u
    stem_top = cy - 300 * u
    stem_bot = cy + 300 * u
    stem_r = int(80 * u)

    # 3. Draw Loop with Sunset Gold -> Orange Gradient
    loop_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    loop_mask = Image.new("L", (canvas_size, canvas_size), 0)
    ImageDraw.Draw(loop_mask).polygon(roof_poly, fill=255)
    
    loop_grad = ImageDraw.Draw(loop_img)
    y_min, y_max = int(cy - 370*u), int(cy + 190*u)
    for y in range(y_min, y_max + 1):
        t = (y - y_min) / float(y_max - y_min)
        # Gold #FFA000 -> Electric Coral #FF4500
        r = 255
        g = int(175 * (1 - t) + 65 * t)
        b = int(0 * (1 - t) + 10 * t)
        loop_grad.line([(0, y), (canvas_size, y)], fill=(r, g, b, 255))
        
    loop_img.putalpha(loop_mask)
    img.paste(loop_img, (0, 0), loop_img)

    # 4. Draw Stem with Cyan -> Electric Royal Blue Gradient
    stem_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    stem_mask = Image.new("L", (canvas_size, canvas_size), 0)
    ImageDraw.Draw(stem_mask).rounded_rectangle(
        [stem_left, stem_top, stem_right, stem_bot],
        radius=stem_r,
        fill=255
    )
    
    stem_grad = ImageDraw.Draw(stem_img)
    for y in range(int(stem_top), int(stem_bot) + 1):
        t = (y - stem_top) / float(stem_bot - stem_top)
        # #00E5FF -> #1A73E8
        r = int(0 * (1 - t) + 26 * t)
        g = int(229 * (1 - t) + 115 * t)
        b = int(255 * (1 - t) + 232 * t)
        stem_grad.line([(0, y), (canvas_size, y)], fill=(r, g, b, 255))
        
    stem_img.putalpha(stem_mask)
    img.paste(stem_img, (0, 0), stem_img)

    # 5. Central Precision Diamond Glyph (Pure crisp facets)
    sp_cx = cx + 52 * u
    sp_cy = cy - 35 * u
    sp_w = 38 * u
    sp_h = 65 * u
    spark_pts_left = [
        (sp_cx, sp_cy - sp_h),
        (sp_cx - sp_w, sp_cy),
        (sp_cx, sp_cy + sp_h)
    ]
    spark_pts_right = [
        (sp_cx, sp_cy - sp_h),
        (sp_cx + sp_w, sp_cy),
        (sp_cx, sp_cy + sp_h)
    ]
    
    spark_draw = ImageDraw.Draw(img)
    spark_draw.polygon(spark_pts_left, fill=(255, 255, 255, 255))
    spark_draw.polygon(spark_pts_right, fill=(205, 235, 255, 255))

    # 6. Downscale to exact size using LANCZOS filter
    final_icon = img.resize((size, size), Image.Resampling.LANCZOS)
    final_icon.save(output_path, "PNG")
    print(f"Clean icon generated at: {output_path} ({size}x{size})")

if __name__ == "__main__":
    logo_file = r"d:\Company Projects\Easy Labour Finder\mobile\public\logo.png"
    create_ultra_clean_icon(logo_file, 512)
    
    fav_file = r"d:\Company Projects\Easy Labour Finder\mobile\public\favicon.png"
    create_ultra_clean_icon(fav_file, 192)
