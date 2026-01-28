import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TelegramUser = {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const tgUser = body?.telegramUser as TelegramUser | undefined;

        if (!tgUser?.id) {
            return NextResponse.json(
                { error: "Missing telegramUser.id" },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("users")
            .upsert(
                {
                    telegram_id: tgUser.id,
                    first_name: tgUser.first_name ?? null,
                    last_name: tgUser.last_name ?? null,
                    username: tgUser.username ?? null,
                    protein_target: 130,
                    kcal_target: 2000,
                },
                { onConflict: "telegram_id" }
            )
            .select("id, protein_target, kcal_target")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            user_id: data.id,
            protein_target: data.protein_target,
            kcal_target: data.kcal_target,
        });
    } catch (e: unknown) {
        const message =
            e instanceof Error ? e.message : "Unknown error in /api/user/init";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}