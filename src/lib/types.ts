export type Goal = "cut" | "maintain" | "build";
export type PortionKey = "regular" | "large" | "xl" | "xxl";
export type MealsPerDay = 2 | 3;
export type ComponentRole = "protein" | "carb" | "veg" | "fat";

export type MealComponent = {
  name: string;
  role: ComponentRole;
  color: string;
};

export type Meal = {
  id: string;
  name: string;
  blurb: string;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
  category: "chicken" | "beef" | "seafood" | "lamb" | "pork" | "plant";
  heat: 0 | 1 | 2;
  goals: Goal[];
  components: MealComponent[];
};

export type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** A line in the basket: one meal, chosen n times across the plan. */
export type SelectionLine = {
  mealId: string;
  qty: number;
};

export type PlanSpec = {
  goal: Goal;
  dailyKcal: number;
  days: number;
  mealsPerDay: MealsPerDay;
  portion: PortionKey;
};

export type OrderInput = {
  plan: PlanSpec;
  selection: SelectionLine[];
  customer: {
    name: string;
    email: string;
    postcode: string;
  };
  notes?: string;
};

export type Order = OrderInput & {
  code: string;
  createdAt: string;
  totals: {
    meals: number;
    subtotal: number;
    discount: number;
    delivery: number;
    total: number;
    perMealKcal: number;
    perMealProtein: number;
  };
};
