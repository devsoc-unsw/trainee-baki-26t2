import type { MealDBIngredient } from "@/types/mealdb";
import type { DietaryTag } from "@/types";

/**
 * Ingredients whose presence disqualifies a meal from being vegan.
 * Covers meat, seafood, dairy, eggs, and other animal-derived items.
 * Matched as whole words (case-insensitive), so "chicken breast"
 * matches "chicken" but "chickpea" and "eggplant" do not falsely
 * match "chicken" / "egg".
 */
export const NON_VEGAN_INGREDIENTS = [
  // meat
  "chicken", "beef", "pork", "lamb", "veal", "turkey", "duck", "goose",
  "bacon", "ham", "prosciutto", "salami", "pepperoni", "chorizo",
  "sausage", "steak", "mince", "meatball", "liver", "kidney",
  "tripe", "oxtail", "brisket", "venison", "rabbit", "meat",
  // seafood
  "fish", "salmon", "tuna", "cod", "haddock", "trout", "mackerel",
  "sardine", "anchovy", "prawn", "prawns", "shrimp", "lobster",
  "crab", "oyster", "mussel", "clam", "squid", "calamari",
  "octopus", "scallop", "seafood",
  // dairy
  "milk", "butter", "cream", "cheese", "yogurt", "yoghurt", "ghee",
  "curd", "whey", "casein", "mozzarella", "parmesan", "cheddar",
  "feta", "ricotta", "mascarpone", "brie", "camembert", "gouda",
  "buttermilk",
  // eggs
  "egg", "eggs",
  // other animal-derived
  "honey", "gelatin", "gelatine",
];

/**
 * Ingredients that disqualify a meal from being vegetarian.
 * Vegetarian permits dairy and eggs, so this is the non-vegan list
 * minus those groups. Gelatin remains — it is animal-derived.
 */
export const NON_VEGETARIAN_INGREDIENTS = [
  // meat
  "chicken", "beef", "pork", "lamb", "veal", "turkey", "duck", "goose",
  "bacon", "ham", "prosciutto", "salami", "pepperoni", "chorizo",
  "sausage", "steak", "mince", "meatball", "liver", "kidney",
  "tripe", "oxtail", "brisket", "venison", "rabbit", "meat",
  // seafood
  "fish", "salmon", "tuna", "cod", "haddock", "trout", "mackerel",
  "sardine", "anchovy", "prawn", "prawns", "shrimp", "lobster",
  "crab", "oyster", "mussel", "clam", "squid", "calamari",
  "octopus", "scallop", "seafood",
  // other animal-derived
  "gelatin", "gelatine",
];

/**
 * Ingredients whose presence disqualifies a meal from being halal.
 * Focus is on pork products, alcohol, and gelatin. Does not attempt
 * to distinguish certified-halal meat — all other meats are treated
 * as ambiguous and neither block nor grant the tag on their own.
 */
export const NON_HALAL_INGREDIENTS = [
  "pork", "bacon", "ham", "prosciutto", "salami", "pepperoni",
  "chorizo", "lard",
  "wine", "beer", "rum", "vodka", "whisky", "whiskey", "brandy",
  "cognac", "sherry", "vermouth", "sake", "champagne", "liqueur",
  "bourbon", "gin", "cider",
  "gelatin", "gelatine",
];

/**
 * Ingredients that trigger the "nut-allergy" tag. In this codebase
 * that tag means the meal CONTAINS nuts (dangerous for someone with
 * an allergy) — see how meal-prep/page.tsx filters unsuitable
 * restrictions. Presence of any listed nut is enough to add the tag.
 */
export const NUT_INGREDIENTS = [
  "almond", "almonds", "cashew", "cashews", "walnut", "walnuts",
  "hazelnut", "hazelnuts", "pecan", "pecans", "peanut", "peanuts",
  "pistachio", "pistachios", "macadamia", "chestnut", "chestnuts",
  "pine nut", "pine nuts", "brazil nut", "brazil nuts",
];

/**
 * Ingredients we positively recognise as safe / neutral. Used for the
 * "absence of evidence is not evidence" gate on the vegan, vegetarian,
 * and halal tags: those tags only get applied when every ingredient
 * in the meal is in this list AND none are in the corresponding
 * exclusion list. An unrecognised ingredient blocks the positive tag
 * so we never promise a diet is safe when we cannot confirm it.
 */
export const KNOWN_INGREDIENTS = [
  ...NON_VEGAN_INGREDIENTS,
  ...NUT_INGREDIENTS,
  // vegetables
  "onion", "onions", "garlic", "tomato", "tomatoes", "carrot", "carrots",
  "potato", "potatoes", "celery", "pepper", "peppers", "bell pepper",
  "capsicum", "cucumber", "lettuce", "spinach", "kale", "broccoli",
  "cauliflower", "mushroom", "mushrooms", "corn", "sweetcorn", "peas",
  "ginger", "chili", "chilli", "chile", "leek", "leeks", "cabbage",
  "eggplant", "aubergine", "zucchini", "courgette", "pumpkin", "squash",
  "avocado", "olive", "olives", "shallot", "shallots", "beetroot",
  "beet", "asparagus", "artichoke", "radish", "turnip", "parsnip",
  "sweet potato", "yam", "okra", "bean sprout", "watercress",
  "endive", "chicory", "fennel", "sorrel", "rocket", "arugula",
  // fruit
  "lemon", "lemons", "lime", "limes", "orange", "oranges", "apple",
  "apples", "banana", "bananas", "berry", "berries", "strawberry",
  "strawberries", "raspberry", "raspberries", "blueberry", "blueberries",
  "blackberry", "blackberries", "mango", "pineapple", "grape", "grapes",
  "cherry", "cherries", "peach", "peaches", "pear", "pears", "date",
  "dates", "raisin", "raisins", "sultana", "sultanas", "currant",
  "currants", "fig", "figs", "apricot", "apricots", "plum", "plums",
  "coconut", "watermelon", "melon", "papaya", "kiwi", "pomegranate",
  "cranberry", "cranberries", "passion fruit", "passionfruit",
  // grains and starches
  "rice", "flour", "pasta", "bread", "breadcrumbs", "oats", "oatmeal",
  "quinoa", "couscous", "semolina", "cornmeal", "polenta", "noodles",
  "noodle", "spaghetti", "penne", "linguine", "fusilli", "tagliatelle",
  "macaroni", "farfalle", "tortilla", "tortillas", "pita", "puff pastry",
  "filo", "phyllo", "wonton", "dumpling", "cornstarch", "corn flour",
  "cornflour", "arrowroot", "tapioca", "yeast", "bulgur", "barley",
  "rye", "millet", "buckwheat", "wheat",
  // legumes and plant proteins
  "chickpea", "chickpeas", "lentil", "lentils", "bean", "beans",
  "tofu", "tempeh", "soy", "soya", "edamame", "seitan", "hummus",
  "black bean", "black beans", "kidney bean", "kidney beans",
  "cannellini", "borlotti", "butter bean", "butter beans",
  "green bean", "green beans", "broad bean", "broad beans",
  // seeds
  "sesame", "sesame seed", "sesame seeds", "sunflower", "sunflower seed",
  "sunflower seeds", "pumpkin seed", "pumpkin seeds", "flax",
  "flaxseed", "chia", "chia seeds", "poppy", "poppy seed", "poppy seeds",
  // oils and fats
  "oil", "olive oil", "vegetable oil", "canola oil", "sunflower oil",
  "coconut oil", "sesame oil", "peanut oil", "rapeseed oil",
  "margarine", "shortening",
  // condiments, sauces, seasoning
  "salt", "pepper", "black pepper", "white pepper", "sugar",
  "brown sugar", "caster sugar", "icing sugar", "maple syrup", "syrup",
  "vinegar", "balsamic", "soy sauce", "tamari", "fish sauce",
  "worcestershire", "mustard", "dijon", "mayonnaise", "mayo",
  "ketchup", "tomato paste", "tomato sauce", "tomato puree",
  "tomato passata", "passata", "stock", "broth", "bouillon",
  "cornichons", "capers", "pickle", "pickles", "relish", "chutney",
  "sriracha", "tabasco", "harissa", "miso", "wasabi", "hoisin",
  // herbs and spices
  "basil", "oregano", "thyme", "rosemary", "sage", "parsley",
  "coriander", "cilantro", "mint", "dill", "chive", "chives",
  "bay leaf", "bay leaves", "cumin", "cinnamon", "nutmeg", "paprika",
  "smoked paprika", "turmeric", "cardamom", "clove", "cloves",
  "saffron", "vanilla", "vanilla extract", "cocoa", "chocolate",
  "dark chocolate", "cocoa powder", "baking powder", "baking soda",
  "bicarbonate of soda", "star anise", "fennel seed", "coriander seed",
  "mustard seed", "curry powder", "garam masala", "chinese five spice",
  "allspice", "mixed spice", "cayenne", "chilli powder", "chili powder",
  "seasoning", "spice", "spices", "herb", "herbs",
  // liquids and misc
  "water", "ice", "stock cube",
];

/**
 * Ingredients considered meaningful protein sources. Presence of any
 * one flags the meal as high-protein — a proxy since TheMealDB does
 * not expose macronutrients.
 */
export const HIGH_PROTEIN_INGREDIENTS = [
  // animal
  "chicken", "beef", "pork", "lamb", "veal", "turkey", "duck",
  "bacon", "ham", "sausage", "steak", "mince", "meat",
  "fish", "salmon", "tuna", "cod", "haddock", "trout", "prawn",
  "prawns", "shrimp", "seafood", "egg", "eggs",
  // plant
  "tofu", "tempeh", "seitan", "edamame", "chickpea", "chickpeas",
  "lentil", "lentils", "bean", "beans", "black bean", "kidney bean",
  // dairy
  "cheese", "yogurt", "yoghurt", "cottage cheese", "milk",
];

// Maximum ingredient count for a meal to be considered "quick".
// TheMealDB has no cook-time or prep-time field, so we approximate:
// recipes with few ingredients typically require less preparation.
// Adjust if the tag ends up too generous or too strict in practice.
const QUICK_MEAL_MAX_INGREDIENTS = 5;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchesAsWord = (name: string, term: string): boolean =>
  new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(name);

const anyTermMatches = (name: string, list: string[]): boolean =>
  list.some((term) => matchesAsWord(name, term));

/**
 * Derives dietary tags and prep-effort flags for a TheMealDB meal
 * whose original API provides none of them.
 *
 * @param ingredients - Extracted ingredient list from extractIngredients.
 * @param category - TheMealDB strCategory (unused by the current
 *   rules; accepted so future rules can consult it without a signature
 *   change).
 * @param instructions - TheMealDB strInstructions (unused for the same
 *   reason).
 * @returns dietaryTags, isQuickMeal, isHighProtein for the meal.
 *
 * The vegan / vegetarian / halal tags require BOTH no exclusion match
 * AND every ingredient being in KNOWN_INGREDIENTS — an unrecognised
 * ingredient blocks the positive tag rather than being assumed safe.
 * The nut-allergy tag is additive: any known nut ingredient adds it,
 * unrecognised ingredients do not.
 *
 * Word-boundary matching means bare "milk" is treated as dairy even
 * when it appears in "coconut milk". This is a conservative false
 * negative on the vegan tag rather than a false positive.
 */
export function deriveMealTags(
  ingredients: MealDBIngredient[],
  category?: string,
  instructions?: string,
): {
  dietaryTags: DietaryTag[];
  isQuickMeal: boolean;
  isHighProtein: boolean;
} {
  void category;
  void instructions;

  const names = ingredients.map((ingredient) =>
    ingredient.name.toLowerCase().trim(),
  );

  const anyNonVegan = names.some((name) =>
    anyTermMatches(name, NON_VEGAN_INGREDIENTS),
  );
  const anyNonVegetarian = names.some((name) =>
    anyTermMatches(name, NON_VEGETARIAN_INGREDIENTS),
  );
  const anyNonHalal = names.some((name) =>
    anyTermMatches(name, NON_HALAL_INGREDIENTS),
  );
  const anyNut = names.some((name) =>
    anyTermMatches(name, NUT_INGREDIENTS),
  );
  const allRecognised =
    names.length > 0 &&
    names.every((name) => anyTermMatches(name, KNOWN_INGREDIENTS));

  const dietaryTags: DietaryTag[] = [];
  if (allRecognised && !anyNonVegan) dietaryTags.push("vegan");
  if (allRecognised && !anyNonVegetarian) dietaryTags.push("vegetarian");
  if (allRecognised && !anyNonHalal) dietaryTags.push("halal");
  if (anyNut) dietaryTags.push("nut-allergy");

  return {
    dietaryTags,
    isQuickMeal:
      ingredients.length > 0 &&
      ingredients.length <= QUICK_MEAL_MAX_INGREDIENTS,
    isHighProtein: names.some((name) =>
      anyTermMatches(name, HIGH_PROTEIN_INGREDIENTS),
    ),
  };
}
