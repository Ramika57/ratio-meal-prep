// Generates data/meals.json. Calories are derived from macros (4/4/9) so the
// menu can never drift out of sync with itself. Run: node scripts/seed-meals.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "..", "data", "meals.json");

// c = component swatch used by the isometric tray render on each meal card.
const c = (name, role, color) => ({ name, role, color });

const raw = [
  {
    id: "chargrilled-chicken-broccolini",
    name: "Chargrilled Chicken, Broccolini & Almond",
    blurb: "Free range breast over charred broccolini, toasted almond, lemon oil.",
    protein: 48, carbs: 12, fat: 18,
    category: "chicken", heat: 0, goals: ["cut", "maintain", "build"],
    components: [c("Chicken breast", "protein", "#DBA96B"), c("Broccolini", "veg", "#4E7C4A"), c("Almond & lemon", "fat", "#E7D8B6")],
  },
  {
    id: "peri-peri-chicken-cauli-rice",
    name: "Peri Peri Chicken Thigh & Cauliflower Rice",
    blurb: "Thigh fillet in house peri peri, cauliflower rice, charred capsicum.",
    protein: 44, carbs: 11, fat: 22,
    category: "chicken", heat: 2, goals: ["cut", "maintain"],
    components: [c("Chicken thigh", "protein", "#C8834A"), c("Cauliflower rice", "carb", "#EDE7DA"), c("Capsicum", "veg", "#C1462F")],
  },
  {
    id: "scotch-fillet-chimichurri",
    name: "Scotch Fillet, Chimichurri & Green Beans",
    blurb: "Grass fed scotch, parsley and oregano chimichurri, blistered beans.",
    protein: 46, carbs: 9, fat: 24,
    category: "beef", heat: 0, goals: ["cut", "maintain", "build"],
    components: [c("Scotch fillet", "protein", "#8B4A3A"), c("Green beans", "veg", "#5B8A4C"), c("Chimichurri", "fat", "#3F6B33")],
  },
  {
    id: "slow-beef-ragu-zucchini",
    name: "Slow Beef Ragu & Zucchini Ribbons",
    blurb: "Six hour chuck ragu, San Marzano, ribboned zucchini instead of pasta.",
    protein: 45, carbs: 14, fat: 19,
    category: "beef", heat: 0, goals: ["cut", "maintain", "build"],
    components: [c("Beef chuck", "protein", "#8B4A3A"), c("Zucchini", "veg", "#6F9B5A"), c("Napoli", "carb", "#B4402C")],
  },
  {
    id: "atlantic-salmon-asparagus",
    name: "Atlantic Salmon, Asparagus & Dill",
    blurb: "Skin on salmon, asparagus spears, dill and creme fraiche.",
    protein: 40, carbs: 7, fat: 26,
    category: "seafood", heat: 0, goals: ["cut", "maintain"],
    components: [c("Salmon", "protein", "#E8896B"), c("Asparagus", "veg", "#6E9455"), c("Dill cream", "fat", "#EFE9DA")],
  },
  {
    id: "barramundi-charred-greens",
    name: "Barramundi, Charred Greens & Caper",
    blurb: "Murray barramundi, charred bok choy, caper and brown butter.",
    protein: 44, carbs: 9, fat: 16,
    category: "seafood", heat: 0, goals: ["cut", "maintain"],
    components: [c("Barramundi", "protein", "#EFE3D2"), c("Bok choy", "veg", "#4E7C4A"), c("Caper butter", "fat", "#D9C88E")],
  },
  {
    id: "lemon-herb-chicken-sweet-potato",
    name: "Lemon Herb Chicken & Roast Sweet Potato",
    blurb: "Breast marinated overnight, roast sweet potato, wilted spinach.",
    protein: 46, carbs: 34, fat: 12,
    category: "chicken", heat: 0, goals: ["maintain", "build"],
    components: [c("Chicken breast", "protein", "#DBA96B"), c("Sweet potato", "carb", "#E08D48"), c("Spinach", "veg", "#3F6B33")],
  },
  {
    id: "korean-beef-kimchi",
    name: "Korean Beef, Kimchi & Cauliflower Rice",
    blurb: "Gochujang beef, house kimchi, sesame cauliflower rice.",
    protein: 45, carbs: 15, fat: 18,
    category: "beef", heat: 2, goals: ["cut", "maintain", "build"],
    components: [c("Beef", "protein", "#8B4A3A"), c("Kimchi", "veg", "#C1462F"), c("Cauliflower rice", "carb", "#EDE7DA")],
  },
  {
    id: "turkey-meatballs-napoli",
    name: "Turkey Meatballs, Napoli & Zucchini",
    blurb: "Hand rolled turkey and herb meatballs, slow Napoli, zucchini noodles.",
    protein: 43, carbs: 13, fat: 16,
    category: "chicken", heat: 0, goals: ["cut", "maintain"],
    components: [c("Turkey", "protein", "#D8B98C"), c("Napoli", "carb", "#B4402C"), c("Zucchini", "veg", "#6F9B5A")],
  },
  {
    id: "butter-chicken-cauli-pilaf",
    name: "Butter Chicken & Cauliflower Pilaf",
    blurb: "Yoghurt marinated thigh, tomato and cashew masala, cauliflower pilaf.",
    protein: 42, carbs: 14, fat: 23,
    category: "chicken", heat: 1, goals: ["maintain", "build"],
    components: [c("Chicken thigh", "protein", "#C8834A"), c("Masala", "fat", "#D2652E"), c("Cauliflower pilaf", "carb", "#EDE7DA")],
  },
  {
    id: "harissa-lamb-capsicum",
    name: "Harissa Lamb, Roast Capsicum & Yoghurt",
    blurb: "Lamb shoulder in rose harissa, roast capsicum, garlic yoghurt.",
    protein: 41, carbs: 11, fat: 26,
    category: "lamb", heat: 2, goals: ["maintain", "build"],
    components: [c("Lamb shoulder", "protein", "#7C4032"), c("Capsicum", "veg", "#C1462F"), c("Yoghurt", "fat", "#F1EDE2")],
  },
  {
    id: "teriyaki-chicken-jasmine",
    name: "Teriyaki Chicken, Jasmine Rice & Edamame",
    blurb: "Glazed breast, jasmine rice, edamame and toasted sesame.",
    protein: 45, carbs: 42, fat: 10,
    category: "chicken", heat: 0, goals: ["build"],
    components: [c("Chicken breast", "protein", "#C9903F"), c("Jasmine rice", "carb", "#F2EDE3"), c("Edamame", "veg", "#7FA34E")],
  },
  {
    id: "pulled-pork-fennel-slaw",
    name: "Smoky Pulled Pork & Fennel Slaw",
    blurb: "Twelve hour pork shoulder, apple cider slaw, fennel and dill.",
    protein: 44, carbs: 12, fat: 20,
    category: "pork", heat: 1, goals: ["cut", "maintain", "build"],
    components: [c("Pork shoulder", "protein", "#A9603F"), c("Fennel slaw", "veg", "#C7D6A8"), c("Cider glaze", "carb", "#B8763A")],
  },
  {
    id: "tofu-edamame-sesame-greens",
    name: "Tofu, Edamame & Sesame Greens",
    blurb: "Pressed and crisped tofu, edamame, gai lan, sesame ginger dressing.",
    protein: 34, carbs: 19, fat: 20,
    category: "plant", heat: 0, goals: ["cut", "maintain"],
    components: [c("Tofu", "protein", "#EFE0BE"), c("Edamame", "veg", "#7FA34E"), c("Gai lan", "veg", "#41703C")],
  },
  {
    id: "chipotle-chicken-black-bean",
    name: "Chipotle Chicken, Black Bean & Lime",
    blurb: "Chipotle rubbed breast, black beans, charred corn, lime crema.",
    protein: 44, carbs: 27, fat: 14,
    category: "chicken", heat: 2, goals: ["maintain", "build"],
    components: [c("Chicken breast", "protein", "#C07A44"), c("Black bean", "carb", "#4A3B32"), c("Lime crema", "fat", "#F1EDE2")],
  },
  {
    id: "garlic-prawn-chorizo",
    name: "Garlic Prawn, Chorizo & Broccoli",
    blurb: "Tiger prawns, lean chorizo, broccoli florets, smoked paprika oil.",
    protein: 40, carbs: 8, fat: 21,
    category: "seafood", heat: 1, goals: ["cut", "maintain"],
    components: [c("Tiger prawn", "protein", "#E9A08A"), c("Chorizo", "fat", "#A83A2B"), c("Broccoli", "veg", "#4E7C4A")],
  },
  {
    id: "moroccan-chicken-cauli-cous-cous",
    name: "Moroccan Chicken & Cauliflower Cous Cous",
    blurb: "Ras el hanout chicken, cauliflower cous cous, preserved lemon, mint.",
    protein: 43, carbs: 13, fat: 17,
    category: "chicken", heat: 1, goals: ["cut", "maintain"],
    components: [c("Chicken", "protein", "#CE9550"), c("Cauliflower cous cous", "carb", "#EDE7DA"), c("Mint & lemon", "veg", "#6E9455")],
  },
  {
    id: "braised-beef-cauli-mash",
    name: "Braised Beef, Mushroom & Cauliflower Mash",
    blurb: "Red wine braised beef, field mushroom, whipped cauliflower mash.",
    protein: 47, carbs: 13, fat: 19,
    category: "beef", heat: 0, goals: ["cut", "maintain", "build"],
    components: [c("Braised beef", "protein", "#7A3F31"), c("Mushroom", "veg", "#7A6252"), c("Cauliflower mash", "carb", "#EFE9DA")],
  },
  {
    id: "chicken-caesar-no-crouton",
    name: "Chicken Caesar, Bacon & Cos",
    blurb: "Grilled breast, shortcut bacon, baby cos, anchovy dressing, no crouton.",
    protein: 49, carbs: 6, fat: 21,
    category: "chicken", heat: 0, goals: ["cut", "maintain"],
    components: [c("Chicken breast", "protein", "#DBA96B"), c("Baby cos", "veg", "#6F9B5A"), c("Caesar & bacon", "fat", "#E3D6B4")],
  },
  {
    id: "miso-salmon-brown-rice",
    name: "Miso Salmon, Broccoli & Brown Rice",
    blurb: "White miso glazed salmon, steamed broccoli, brown rice, pickled ginger.",
    protein: 39, carbs: 36, fat: 16,
    category: "seafood", heat: 0, goals: ["build"],
    components: [c("Salmon", "protein", "#E8896B"), c("Brown rice", "carb", "#C8A97E"), c("Broccoli", "veg", "#4E7C4A")],
  },
];

const meals = raw.map((m) => {
  const kcal = m.protein * 4 + m.carbs * 4 + m.fat * 9;
  return { ...m, kcal };
});

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(meals, null, 2) + "\n");

const avg = (k) => meals.reduce((s, m) => s + m[k], 0) / meals.length;
console.log(`wrote ${meals.length} meals to data/meals.json`);
console.log(`avg kcal ${avg("kcal").toFixed(1)} | protein ${avg("protein").toFixed(1)}g | carbs ${avg("carbs").toFixed(1)}g | fat ${avg("fat").toFixed(1)}g`);
console.log(`kcal range ${Math.min(...meals.map((m) => m.kcal))} to ${Math.max(...meals.map((m) => m.kcal))}`);
console.log(`protein per 100 kcal: ${(avg("protein") / avg("kcal") * 100).toFixed(1)}g`);
