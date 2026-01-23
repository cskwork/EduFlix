import os

def create_svg(path, content, bg_color="#f0f0f0", width=800, height=450):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="{bg_color}"/>
  {content}
</svg>'''
    with open(path, 'w') as f:
        f.write(svg)
    print(f"Created {path}")

def get_thumbnail_content(title, icon_char):
    return f'''
  <circle cx="400" cy="225" r="150" fill="rgba(255,255,255,0.2)"/>
  <text x="400" y="240" font-family="Arial, sans-serif" font-size="120" text-anchor="middle" fill="#333">{icon_char}</text>
  <text x="400" y="380" font-family="Arial, sans-serif" font-size="40" font-weight="bold" text-anchor="middle" fill="#333">{title}</text>
'''

def get_character_content(char_emoji):
    return f'''
  <circle cx="200" cy="200" r="180" fill="#fff" stroke="#333" stroke-width="10"/>
  <text x="200" y="260" font-size="200" text-anchor="middle">{char_emoji}</text>
'''

# Content Definitions
contents = [
    # Math
    {"path": "contents/math/elementary/fractions-pizza", "title": "Fractions Pizza", "icon": "🍕", "char": "👨‍🍳", "color": "#FFCC80"},
    {"path": "contents/math/elementary/shapes-explorer", "title": "Shapes Explorer", "icon": "🔺", "char": "📐", "color": "#80DEEA"},
    {"path": "contents/math/middle/equation-puzzle", "title": "Equation Puzzle", "icon": "⚖️", "char": "⚖️", "color": "#CE93D8"},
    
    # Science
    {"path": "contents/science/elementary/solar-system", "title": "Solar System", "icon": "🪐", "char": "🚀", "color": "#9FA8DA"},
    {"path": "contents/science/elementary/circuit-lab", "title": "Circuit Lab", "icon": "💡", "char": "🔋", "color": "#FFF59D"},
    {"path": "contents/science/middle/cell-explorer", "title": "Cell Explorer", "icon": "🔬", "char": "🦠", "color": "#A5D6A7"},
    {"path": "contents/science/high/chemical-reactor", "title": "Chemical Reactor", "icon": "⚗️", "char": "👨‍🔬", "color": "#EF9A9A"},

    # English
    {"path": "contents/english/elementary/word-safari", "title": "Word Safari", "icon": "🦁", "char": "🤠", "color": "#C5E1A5"},
    {"path": "contents/english/middle/grammar-quest", "title": "Grammar Quest", "icon": "📜", "char": "🧙‍♂️", "color": "#B39DDB"},
    {"path": "contents/english/high/debate-arena", "title": "Debate Arena", "icon": "🎙️", "char": "⚖️", "color": "#90CAF9"},
]

base_dir = "/Users/chaeseong-gug/Documents/PARA/Resource/EduFlix"

for item in contents:
    assets_dir = os.path.join(base_dir, item["path"], "assets")
    images_dir = os.path.join(base_dir, item["path"], "images") # Legacy
    
    # Use images dir if assets doesn't exist? No, we created assets.
    # But let's check if we should put SVGs in 'images' if it exists to keep it clean.
    # Actually, the user's "recycle" instruction implies using `images/`. 
    # Let's put everything in `images/` if it exists, otherwise `assets/`?
    # To keep it consistent, let's stick to the new plan of `assets/` BUT copy existing images there?
    # The simplest is to modify script.js to point to `assets/` and put all new stuff there.
    # Existing stuff in `word-safari/images` can be moved or referenced.
    # Let's target `assets/` for generated files.
    
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)
        
    # Generate Thumbnail
    create_svg(os.path.join(assets_dir, "thumbnail.svg"), get_thumbnail_content(item["title"], item["icon"]), item["color"], 800, 450)
    
    # Generate Character
    create_svg(os.path.join(assets_dir, "character.svg"), get_character_content(item["char"]), item["color"], 400, 400)

print("SVG Generation Complete.")
