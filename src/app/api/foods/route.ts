import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
    const { data, error } = await supabase
        .from("foods")
        .select("id,name,basis,serving_g,kcal,protein_g,carbs_g,fat_g")
        .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}