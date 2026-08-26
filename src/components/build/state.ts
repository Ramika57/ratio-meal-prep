import type { Goal, MealsPerDay, PlanSpec, PortionKey, SelectionLine } from "@/lib/types";

export type BuilderState = PlanSpec & {
  step: number;
  selection: SelectionLine[];
  /** Once the customer picks a portion themselves we stop auto recommending. */
  portionTouched: boolean;
};

export type BuilderAction =
  | { type: "step"; step: number }
  | { type: "goal"; goal: Goal; suggested: number }
  | { type: "kcal"; kcal: number }
  | { type: "days"; days: number }
  | { type: "mealsPerDay"; mealsPerDay: MealsPerDay }
  | { type: "portion"; portion: PortionKey; auto?: boolean }
  | { type: "add"; mealId: string }
  | { type: "remove"; mealId: string }
  | { type: "setSelection"; selection: SelectionLine[] }
  | { type: "clearSelection" };

export const STEPS = ["Goal", "Targets", "Meals", "Review"];

export function initialState(goal: Goal, kcal: number): BuilderState {
  return {
    step: 0,
    goal,
    dailyKcal: kcal,
    days: 5,
    mealsPerDay: 3,
    portion: "large",
    portionTouched: false,
    selection: [],
  };
}

/** Trims the basket when the plan shrinks, from the back of the list. */
function trim(selection: SelectionLine[], max: number): SelectionLine[] {
  let total = selection.reduce((s, l) => s + l.qty, 0);
  if (total <= max) return selection;
  const next = selection.map((l) => ({ ...l }));
  for (let i = next.length - 1; i >= 0 && total > max; i--) {
    const take = Math.min(next[i].qty, total - max);
    next[i].qty -= take;
    total -= take;
  }
  return next.filter((l) => l.qty > 0);
}

export function reducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "step":
      return { ...state, step: Math.max(0, Math.min(3, action.step)) };
    case "goal":
      return { ...state, goal: action.goal, dailyKcal: action.suggested };
    case "kcal":
      return { ...state, dailyKcal: action.kcal };
    case "days": {
      const days = action.days;
      return { ...state, days, selection: trim(state.selection, days * state.mealsPerDay) };
    }
    case "mealsPerDay": {
      const mealsPerDay = action.mealsPerDay;
      return { ...state, mealsPerDay, selection: trim(state.selection, state.days * mealsPerDay) };
    }
    case "portion":
      return { ...state, portion: action.portion, portionTouched: state.portionTouched || !action.auto };
    case "add": {
      const max = state.days * state.mealsPerDay;
      const total = state.selection.reduce((s, l) => s + l.qty, 0);
      if (total >= max) return state;
      const line = state.selection.find((l) => l.mealId === action.mealId);
      return {
        ...state,
        selection: line
          ? state.selection.map((l) => (l.mealId === action.mealId ? { ...l, qty: l.qty + 1 } : l))
          : [...state.selection, { mealId: action.mealId, qty: 1 }],
      };
    }
    case "remove":
      return {
        ...state,
        selection: state.selection
          .map((l) => (l.mealId === action.mealId ? { ...l, qty: l.qty - 1 } : l))
          .filter((l) => l.qty > 0),
      };
    case "setSelection":
      return { ...state, selection: trim(action.selection, state.days * state.mealsPerDay) };
    case "clearSelection":
      return { ...state, selection: [] };
    default:
      return state;
  }
}
