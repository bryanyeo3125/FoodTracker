import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    const body = await req.json();
    const { user_id, raw_text, confidence, assumptions, items } = body;

    if (!user_id || !items?.length) {
        return NextResponse.json(
            { error: "Missing user or items" },
            { status: 400 }
        );
    }

    // Create meal
    const { data: meal, error: mealErr } = await supabase
        .from("meals")
        .insert({
            user_id,
            raw_text,
            confidence,
            assumptions,
        })
        .select("id")
        .single();

    if (mealErr) {
        return NextResponse.json({ error: mealErr.message }, { status: 500 });
    }

    let totalProtein = 0;
    let totalKcal = 0;

    for (const it of items) {
        const { data: food } = await supabase
            .from("foods")
            .select("*")
            .eq("name", it.name)
            .single();

        if (!food) continue;

        const grams =
            it.unit === "g" ? it.amount : food.serving_g * it.amount;

        const protein = (food.protein_g / food.serving_g) * grams;
        const kcal = (food.kcal / food.serving_g) * grams;

        totalProtein += protein;
        totalKcal += kcal;

        await supabase.from("meal_items").insert({
            meal_id: meal.id,
            food_id: food.id,
            grams,
            protein_g: protein,
            kcal,
        });
    }

    // Update totals
    await supabase
        .from("meals")
        .update({
            total_protein: totalProtein,
            total_kcal: totalKcal,
        })
        .eq("id", meal.id);

    return NextResponse.json({
        ok: true,
        totals: {
            protein_g: totalProtein,
            kcal: totalKcal,
        },
    });
}