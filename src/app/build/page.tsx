import { Suspense } from "react";
import type { Metadata } from "next";
import Builder from "@/components/build/Builder";
import { getMeals } from "@/lib/db";

// Reads data/meals.json per request, so editing the file shows up immediately.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build your plan | RATIO",
  description: "Set your goal, calories and days, choose your meals, and see the price before you commit.",
};

export default async function BuildPage() {
  const meals = await getMeals();

  return (
    <Suspense fallback={<div className="shell py-32 text-mute">Loading the menu...</div>}>
      <Builder meals={meals} />
    </Suspense>
  );
}
