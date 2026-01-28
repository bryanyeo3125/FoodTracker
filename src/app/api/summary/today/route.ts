import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "Missing user" }, { status: 400 });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // Meals totals
    const { data: meals, error: mealsError } = await supabase
        .from("meals")
        .select("total_protein,total_kcal")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString());

    if (mealsError) {
        return NextResponse.json({ error: mealsError.message }, { status: 500 });
    }

    const totals = (meals ?? []).reduce(
        (acc, m) => {
            acc.protein += m.total_protein ?? 0;
            acc.kcal += m.total_kcal ?? 0;
            return acc;
        },
        { protein: 0, kcal: 0, water_ml: 0 }
    );

    // Water totals
    const { data: waters, error: waterError } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString());

    if (waterError) {
        return NextResponse.json({ error: waterError.message }, { status: 500 });
    }

    totals.water_ml = (waters ?? []).reduce((acc, w) => acc + (w.amount_ml ?? 0), 0);

    return NextResponse.json(totals);
}