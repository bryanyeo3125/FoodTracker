import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
    const { data, error } = await supabase
        .from("foods")
        .select("name")
        .limit(5);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}