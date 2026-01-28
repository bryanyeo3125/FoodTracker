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

    const { data } = await supabase
        .from("meals")
        .select("total_protein,total_kcal")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString());

    const totals = (data ?? []).reduce(
        (acc, m) => {
            acc.protein += m.total_protein ?? 0;
            acc.kcal += m.total_kcal ?? 0;
            return acc;
        },
        { protein: 0, kcal: 0 }
    );

    return NextResponse.json(totals);
}
