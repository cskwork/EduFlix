#!/usr/bin/env python3
"""카탈로그(index.json)와 각 manifest.json에 영어 번역(translations.en)을 채운다.

원문(title/description)은 콘텐츠 본문 언어(대부분 한국어)를 그대로 유지하고,
UI 언어가 영어일 때 보여줄 제목·설명만 translations.en에 추가한다.
이미 translations.en이 있는 항목은 건드리지 않는다(재실행 안전).

사용법:  python3 scripts/add-catalog-translations.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "public", "contents", "index.json")

EN = {
    "fractions-pizza": (
        "Fraction Pizza",
        "Learn what fractions are with a delicious pizza! Slice it up and build your own fractions.",
    ),
    "shapes-explorer": (
        "Shape Explorer",
        "Explore flat and solid shapes and discover the properties that make each one special!",
    ),
    "equation-puzzle": (
        "Equation Puzzle",
        "Solve linear equations and systems of equations through playful puzzles!",
    ),
    "cell-explorer": (
        "Cell Explorer",
        "Look through the microscope and explore what each organelle inside a cell does!",
    ),
    "chemical-reactor": (
        "Chemical Reaction Simulator",
        "Simulate different chemical reactions and learn the equations and principles behind them!",
    ),
    "pythagoras-theorem": (
        "The Pythagorean Theorem",
        "What secret hides between the sides of a right triangle? Move the triangle yourself and discover the Pythagorean theorem.",
    ),
    "probability-coin": (
        "The World of Probability: Coin Toss",
        "What happens to the ratio of heads and tails as you toss more coins? Run the experiment and meet the law of large numbers.",
    ),
    "linear-slope": (
        "Linear Functions and Slope",
        "Just like a ski slope, how steep is a line? Let's put a number on it.",
    ),
    "negative-addition": (
        "Adding and Subtracting Integers",
        "Move along the number line and learn how adding and subtracting positive and negative numbers works.",
    ),
    "quadratic-graph": (
        "Quadratic Function Graphs",
        "See how the graph of y = ax² + bx + c changes as you adjust each coefficient.",
    ),
    "3d-shapes-discovery": (
        "3D Shape Expedition",
        "Spin a cube, sphere, cylinder and pyramid a full 360° to explore faces, edges and vertices!",
    ),
    "volume-explorer": (
        "Volume Explorer",
        "Fill a box with unit cubes and discover that volume = length x width x height!",
    ),
    "3d-coordinate-system": (
        "3D Coordinates: Drone Pilot",
        "Fly a drone and get comfortable with the 3D coordinate system (x, y, z)!",
    ),
    "space-diagonal": (
        "Space Diagonal",
        "Apply the Pythagorean theorem twice to find the length of a space diagonal!",
    ),
    "3d-vectors": (
        "3D Vectors: Combining Forces",
        "Add two vectors in 3D space and learn how vector addition works!",
    ),
    "pythagorean-squares": (
        "Pythagorean Theorem: The Secret of Squares",
        "Use the areas of squares to see a² + b² = c² for yourself, then apply it to real-life problems!",
    ),
    "box-volume": (
        "Volume of a Box: The Secret Inside",
        "Stack unit cubes to build an intuitive feel for the box volume formula (length x width x height).",
    ),
    "circle-area": (
        "Area of a Circle: The Pizza Secret",
        "Slice a circle into sectors, rearrange them into a rectangle, and discover the area formula yourself.",
    ),
    "decimal-multiplication": (
        "Multiplying Decimals",
        "Watch the decimal point move and understand exactly how decimal multiplication works.",
    ),
    "fraction-division": (
        "Dividing Fractions: Sharing Equally",
        "Split pizza slices to see why dividing fractions means multiplying by the reciprocal.",
    ),
    "ratio-proportion": (
        "Ratio and Proportion: The Recipe Secret",
        "Scale a tteokbokki recipe up and down to understand ratio and proportion in everyday life.",
    ),
    "20260127-topic-105b382d": (
        "The Magic of English Greetings",
        "An English lesson all about greetings.",
    ),
    "comparative-adjectives": (
        "Who is Taller? Comparing with Adjectives",
        "Interactive practice with comparative adjectives and how to compare two things.",
    ),
    "modal-can": (
        "I Can Do It! Talking About Abilities",
        "Interactive practice using the modal verb 'can' to talk about ability and possibility.",
    ),
    "present-tenses": (
        "I play vs I'm playing: What's the Difference?",
        "Interactive practice telling the present simple and present continuous apart and using each correctly.",
    ),
    "will-vs-going-to-library": (
        "A Trip to the Library: will vs going to",
        "Interactive practice with the difference between 'will' and 'be going to' while planning a library visit.",
    ),
    "will-vs-going-to-zoo": (
        "Travel Plans: will vs going to - Zoo Visit Adventure",
        "Interactive practice with the difference between 'will' and 'be going to' while planning a zoo visit.",
    ),
    "fraction-addition": (
        "Adding Fractions with Unlike Denominators",
        "See, step by step, how to add fractions that do not share a denominator.",
    ),
    "moon-phases": (
        "Phases of the Moon: Why the Moon Changes",
        "Discover why the Moon changes shape by exploring how the Sun, Earth and Moon line up.",
    ),
    "states-of-matter": (
        "States of Matter: The Secret Life of Molecules",
        "See how solids, liquids and gases relate to the motion of molecules.",
    ),
    "newtons-laws": (
        "Newton's Laws of Motion",
        "Understand Newton's three laws of motion through experiments and simulations.",
    ),
    "photosynthesis": (
        "Photosynthesis: A Plant's Secret Factory",
        "Explore how plants turn sunlight into food, step by step.",
    ),
    "plate-tectonics": (
        "Earthquakes and Plate Tectonics",
        "Find out how Earth's plates move and why earthquakes happen.",
    ),
    "countable-uncountable": (
        "Can You Count It? Countable vs Uncountable",
        "Interactive practice telling countable and uncountable nouns apart.",
    ),
    "magic-e": (
        "Magic E",
        "A phonics lesson on how a silent E at the end of a word changes the vowel sound.",
    ),
    "prepositions-place": (
        "Prepositions of Place - Where is it?",
        "Interactive practice with in, on, under, next to, between and more.",
    ),
    "present-perfect": (
        "Present Perfect - Have You Ever...?",
        "Interactive practice with the have/has + past participle structure.",
    ),
    "word-families": (
        "Word Families - Making Nouns",
        "Turn verbs into nouns with the -tion and -sion suffixes.",
    ),
    "prepositions-3d": (
        "3D Prepositions of Place - Where is it?",
        "Learn in, on, under, next to and between through a Three.js 3D scene.",
    ),
    "platonic-solids": (
        "Platonic Solids: Five Perfect Shapes",
        "Find out why there are exactly five Platonic solids, and explore faces, edges, vertices and Euler's formula.",
    ),
    "volume-solids": (
        "Volume of Solids: Cylinder, Cone and Sphere",
        "Discover the volume formulas for cylinders, cones and spheres, and see why a cylinder equals three cones.",
    ),
    "3d-coordinates": (
        "Space Coordinates: Exploring Three Dimensions",
        "Understand 3D coordinates (x, y, z) and work out the distance between two points in space.",
    ),
    "angles-rocket": (
        "Launch the Rocket! Understanding Angles",
        "Learn what angles are and how to measure them by launching rockets.",
    ),
    "3d-geometry-explorer-donga": (
        "3D Geometry Explorer",
        "Explore the world of 3D shapes! Learn about faces, edges and vertices, then test yourself with a quiz.",
    ),
    "fraction-factory-3d": (
        "Fraction Factory 3D",
        "Add, subtract, multiply and divide fractions with 3D visualisations!",
    ),
    "multiplication-mountain-3d": (
        "Times Table Mountain 3D",
        "Climb a 3D mountain and master your times tables through playful gamification.",
    ),
    "measurement-lab-3d": (
        "Measurement Lab 3D",
        "Measure length, weight and volume in a 3D lab.",
    ),
    "pattern-planet-3d": (
        "Pattern Planet 3D",
        "Travel through space and discover number and shape patterns!",
    ),
    "3d-algebra-city": (
        "3D Algebra City",
        "Learn equations and algebra while exploring a 3D city!",
    ),
    "geometry-world-3d": (
        "Geometry World 3D",
        "Explore geometry in 3D space and learn about area, perimeter and volume.",
    ),
    "data-visualization-hub": (
        "Data Visualisation Hub",
        "Learn statistics and data analysis through interactive charts!",
    ),
    "function-explorer-3d": (
        "Function Explorer 3D",
        "Explore function graphs in 3D space and get to know linear functions.",
    ),
    "problem-solving-arena": (
        "Problem Solving Arena",
        "Test your skills against a range of maths problems!",
    ),
    "3d-vocabulary-adventure": (
        "3D Vocabulary Adventure",
        "Explore English vocabulary in 3D space and pick up new words along the way!",
    ),
    "story-word-builder": (
        "Story Word Builder",
        "Build a story while learning how English words and sentences fit together.",
    ),
    "phonics-3d-playground": (
        "Phonics 3D Playground",
        "Learn phonics in a 3D playground and build a solid pronunciation foundation.",
    ),
    "grammar-galaxy": (
        "Grammar Galaxy",
        "Explore the galaxy while learning the basics of English grammar.",
    ),
    "spelling-bee-arena": (
        "Spelling Bee Arena",
        "Enter the spelling bee and put your English spelling to the test!",
    ),
    "literature-3d-theater": (
        "Literature 3D Theater",
        "Experience works of English literature in a 3D theatre and build your reading skills.",
    ),
    "word-detective-3d": (
        "Word Detective 3D",
        "Become a detective, track down word meanings and origins, and grow your vocabulary!",
    ),
    "grammar-builder-3d": (
        "Grammar Builder 3D",
        "Assemble sentences with 3D blocks and see English grammar structure for yourself.",
    ),
    "reading-comprehension-quest": (
        "Reading Comprehension Quest",
        "Read a range of passages, complete quests and sharpen your comprehension.",
    ),
    "vocabulary-mountain": (
        "Vocabulary Mountain",
        "Climb the mountain and master essential middle-school English vocabulary!",
    ),
    "action-verbs-game": (
        "Action Verb Sorting Game",
        "A Phaser drag-and-drop game that sorts action verbs (run, walk, jump and more) into movement, making and feeling categories.",
    ),
    "multiplication-balloon": (
        "Times Table Balloon Pop",
        "A Phaser game where you pop the balloon showing the right answer to score points.",
    ),
    "multiplication-racing": (
        "Times Table Racing",
        "A Phaser game where you solve falling times-table questions fast for points. Chain correct answers for a combo bonus!",
    ),
    "coordinate-explorer": (
        "Coordinate Expedition",
        "A Phaser treasure hunt on the coordinate plane. Read the (x, y) coordinates and click the exact spot!",
    ),
    "pythagorean-3d": (
        "Pythagorean Theorem - 3D Cube Proof",
        "Use 3D cube visualisations to grasp the geometric meaning of a² + b² = c².",
    ),
    "rotation-solid": (
        "Solids of Revolution - From 2D to 3D",
        "Rotate flat shapes in 3D to see how cylinders, cones and spheres are formed.",
    ),
    "space-numbers": (
        "The Size of Space and Big Numbers",
        "Explore large numbers and place value through the scale of the universe.",
    ),
    "pythagorean-isometric": (
        "Pythagoras Expedition 3D - Isometric",
        "A Phaser isometric block game where you check the Pythagorean theorem visually and take on quizzes.",
    ),
    "8bit-math-quest": (
        "8-Bit Math Quest: Arithmetic Cave Raid",
        "An 8-bit retro RPG where you clear arithmetic problems to push deeper into the cave.",
    ),
    "fraction-precision-alpha": (
        "Fraction Precision: Alpha",
        "An interactive fraction game about comparing and matching fraction sizes precisely (alpha build).",
    ),
    "fraction-precision-beta": (
        "Fraction Precision: Beta",
        "An interactive fraction game about comparing and matching fraction sizes precisely (beta build).",
    ),
    "fraction-precision-gamma": (
        "Fraction Precision: Gamma",
        "An interactive fraction game about comparing and matching fraction sizes precisely (gamma build).",
    ),
    "fraction-precision-delta": (
        "Fraction Precision: Delta",
        "An interactive fraction game about comparing and matching fraction sizes precisely (delta build).",
    ),
    "fraction-precision-epsilon": (
        "The Magic of Epsilon: Building Game Hitboxes",
        "An interactive fraction game that teaches the idea of an error margin (epsilon) by building game hitboxes.",
    ),
    "mario-country-quiz": (
        "Super Mario Country Name Quiz",
        "A Mario-style platformer quiz game for learning the names of countries around the world.",
    ),
    "world-quiz-battle": (
        "WORLD QUIZ BATTLE",
        "A fighting-game-style battle where you take on quiz questions about the world.",
    ),
    "line-point-symmetry": (
        "Dory and the Symmetry Museum Restoration",
        "A hands-on lesson that restores matching points through line symmetry (folding) and point symmetry (half turns).",
    ),
    "animal-adaptation-game": (
        "Secrets of Animal Village: The Adaptation Mission",
        "Meet animal friends in a game world and learn, through card matching and quizzes, how their bodies and behaviour adapted to their habitats.",
    ),
    "cylinder-volume": (
        "Volume of a Cylinder: Measuring Space",
        "Rotate and handle 3D solids to discover and calculate that a cylinder's volume is base area x height.",
    ),
    "irp-future-wealth-simulator": (
        "Time Travel Wealth Simulator: What's in My Wallet in 30 Years?",
        "A discovery lesson where you operate a 3D time-travel simulation of the three IRP effects: mandatory transfer, tax credits and tax deferral.",
    ),
    "python-list-comprehension-factory": (
        "The Python Cloning Machine: A List Comprehension Factory",
        "Python list comprehensions visualised as factory machines you can operate to discover what the code produces.",
    ),
}


def apply(entry):
    """entry에 translations.en을 붙인다. 이미 있으면 유지."""
    en = EN.get(entry.get("id"))
    if not en:
        return False

    translations = entry.setdefault("translations", {})
    if translations.get("en", {}).get("title"):
        return False

    translations["en"] = {"title": en[0], "description": en[1]}
    return True


def main():
    with open(CATALOG, encoding="utf-8") as f:
        catalog = json.load(f)

    changed = 0
    missing = []

    for entry in catalog.get("contents", []):
        if entry.get("id") not in EN:
            missing.append(entry.get("id"))
            continue
        if apply(entry):
            changed += 1

        # 콘텐츠 폴더의 manifest.json도 같은 번역을 갖도록 맞춘다
        manifest_path = os.path.join(
            ROOT,
            "public",
            "contents",
            entry["subject"],
            entry["gradeLevel"],
            entry["id"],
            "manifest.json",
        )
        if os.path.exists(manifest_path):
            with open(manifest_path, encoding="utf-8") as f:
                manifest = json.load(f)
            if apply(manifest):
                with open(manifest_path, "w", encoding="utf-8") as f:
                    json.dump(manifest, f, ensure_ascii=False, indent=2)
                    f.write("\n")

    with open(CATALOG, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"catalog entries translated: {changed}")
    if missing:
        print("no english translation for:", ", ".join(missing), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
