import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

const joinSchema = z.object({
  groupId: z.string().uuid("유효하지 않은 순 ID입니다"),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const result = joinSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();

  const { error } = await supabase
    .from("group_members")
    .insert({
      group_id: result.data.groupId,
      student_id: session.id,
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 가입된 순입니다" }, { status: 400 });
    }
    console.error("Group join error:", error);
    return NextResponse.json({ error: "순 가입 중 오류가 발생했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
