import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sync snapshot único por usuário.
 *
 * Tabela (Supabase): public.fin_sys_user_snapshot
 * - user_id (uuid PK)
 * - updated_at (timestamptz)
 * - snapshot (jsonb)
 */

type DbRow = {
  user_id: string;
  updated_at: string;
  snapshot: unknown;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from("fin_sys_user_snapshot")
      .select("user_id, updated_at, snapshot")
      .eq("user_id", userId)
      .maybeSingle<DbRow>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      updated_at: data.updated_at,
      snapshot: data.snapshot,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const userId = userData.user.id;
    const body = (await request.json()) as { snapshot?: unknown; updated_at?: string };
    if (!body || typeof body !== "object" || body.snapshot == null) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }

    const updatedAt = typeof body.updated_at === "string" ? body.updated_at : new Date().toISOString();

    const { error } = await supabase.from("fin_sys_user_snapshot").upsert(
      {
        user_id: userId,
        updated_at: updatedAt,
        snapshot: body.snapshot,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, updated_at: updatedAt });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
