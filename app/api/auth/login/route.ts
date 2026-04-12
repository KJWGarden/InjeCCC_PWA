import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { setSession } from "@/lib/auth";
import type { University } from "@/lib/supabase/types";

const loginSchema = z.object({
  studentId: z.string().min(1, "학번을 입력해주세요"),
  name: z.string().min(1, "이름을 입력해주세요"),
  university: z.enum(["인제대학교", "가야대학교"], {
    error: "대학교를 선택해주세요",
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { studentId, name, university } = result.data;
    const supabase = createSupabaseClient();

    // Upsert student: create if not exists, return existing if already exists
    const { data: student, error } = await supabase
      .from("students")
      .upsert(
        {
          student_id: studentId,
          name,
          university: university as University,
        },
        { onConflict: "student_id,university" }
      )
      .select("id, student_id, name, university")
      .single();

    if (error) {
      console.error("Login error:", error);
      return NextResponse.json(
        { error: "로그인 처리 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    await setSession({
      id: student.id,
      studentId: student.student_id,
      name: student.name,
      university: student.university,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }
}
