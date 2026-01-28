import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const telegramUser = body.telegramUser;
        if (!telegramUser?.id) {
            return NextResponse.json({ error: "Missing Telegram user" }, { status: 400 });
        }

        const telegramId = Number(telegramUser.id);

        // 1) Check if user exists
        const { data: existing, error: findErr } = await supabase
            .from("users")
            .select("id, protein_target, kcal_target")
            .eq("telegram_id", telegramId)
            .maybeSingle();

        if (findErr) {
            return NextResponse.json({ error: findErr.message }, { status: 500 });
        }

        if (existing) {
            return NextResponse.json({
                user_id: existing.id,
                protein_target: existing.protein_target,
                kcal_target: existing.kcal_target,
                is_new: false,
            });
        }

        // 2) Create user (you can omit targets if your DB has defaults; keeping explicit is fine)
        const { data: created, error: createErr } = await supabase
            .from("users")
            .insert({
                telegram_id: telegramId,
                first_name: telegramUser.first_name ?? null,
                last_name: telegramUser.last_name ?? null,
                username: telegramUser.username ?? null,
                protein_target: 130,
                kcal_target: 2000,
            })
            .select("id, protein_target, kcal_target")
            .single();

        if (createErr) {
            return NextResponse.json({ error: createErr.message }, { status: 500 });
        }

        return NextResponse.json({
            user_id: created.id,
            protein_target: created.protein_target,
            kcal_target: created.kcal_target,
            is_new: true,
        });
    } catch {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
}