import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const user_id = String(body.user_id ?? "");
        const protein_target = Number(body.protein_target);
        const kcal_target = Number(body.kcal_target);

        if (!user_id) {
            return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
        }

        if (!Number.isFinite(protein_target) || protein_target <= 0 || protein_target > 400) {
            return NextResponse.json({ error: "Invalid protein_target" }, { status: 400 });
        }

        if (!Number.isFinite(kcal_target) || kcal_target < 800 || kcal_target > 6000) {
            return NextResponse.json({ error: "Invalid kcal_target" }, { status: 400 });
        }

        const { error } = await supabase
            .from("users")
            .update({ protein_target, kcal_target })
            .eq("id", user_id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
}