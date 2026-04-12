import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

const createGroupSchema = z.object({
  name: z.string().min(1, "순 이름을 입력해주세요"),
});

const deleteGroupSchema = z.object({
  groupId: z.string().uuid("유효하지 않은 순 ID입니다"),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  if (session.role !== "leader") {
    return NextResponse.json({ error: "순장만 순을 생성할 수 있습니다" }, { status: 403 });
  }

  const body = await request.json();
  const result = createGroupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name: result.data.name,
      leader_id: session.id,
      university: session.university,
    })
    .select()
    .single();

  if (error) {
    console.error("Group creation error:", error);
    return NextResponse.json({ error: "순 생성 중 오류가 발생했습니다" }, { status: 500 });
  }

  return NextResponse.json({ group });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const result = deleteGroupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();

  // Verify the user is the leader of this group
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("id", result.data.groupId)
    .eq("leader_id", session.id)
    .single();

  if (!group) {
    return NextResponse.json({ error: "순을 찾을 수 없거나 권한이 없습니다" }, { status: 403 });
  }

  // CASCADE will delete group_members automatically
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", result.data.groupId);

  if (error) {
    console.error("Group delete error:", error);
    return NextResponse.json({ error: "순 삭제 중 오류가 발생했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const university = request.nextUrl.searchParams.get("university") || session.university;
  const supabase = createSupabaseClient();

  const { data: groups, error } = await supabase
    .from("groups")
    .select("*, students!groups_leader_id_fkey(name)")
    .eq("university", university);

  if (error) {
    console.error("Group list error:", error);
    return NextResponse.json({ error: "순 목록 조회 중 오류가 발생했습니다" }, { status: 500 });
  }

  return NextResponse.json({ groups });
}
