import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { setSession } from "@/lib/auth";
import type { University } from "@/lib/supabase/types";

const loginSchema = z.object({
  studentId: z
    .string()
    .min(5, "중복 방지를 위해 학번 전체를 입력해주세요")
    .regex(/^\d+$/, "학번은 숫자만 입력해주세요"),
  name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .refine(
      (v) => /^[가-힣]{2,}$/.test(v) || /^[a-zA-Z]{4,}$/.test(v),
      "한글 2글자 이상 또는 영어 4글자 이상 입력해주세요",
    ),
  university: z.enum(["인제대학교", "가야대학교"], {
    error: "대학교를 선택해주세요",
  }),
  role: z.enum(["leader", "member"], {
    error: "역할을 선택해주세요",
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

    const { studentId, name, university, role } = result.data;
    const supabase = createSupabaseClient();

    // Check if student already exists
    const { data: existing } = await supabase
      .from("students")
      .select("id, student_id, name, university, role")
      .eq("student_id", studentId)
      .eq("university", university as University)
      .single();

    if (existing) {
      // Verify name matches
      if (existing.name !== name) {
        return NextResponse.json(
          { error: "학번과 이름이 일치하지 않습니다. 확인 후 다시 시도해주세요." },
          { status: 400 }
        );
      }

      // Verify role matches
      if (existing.role !== role) {
        const roleLabel = existing.role === "leader" ? "순장" : "순원";
        return NextResponse.json(
          { error: `이미 ${roleLabel}(으)로 등록되어 있습니다. 역할을 확인 후 다시 시도해주세요.` },
          { status: 400 }
        );
      }

      await setSession({
        id: existing.id,
        studentId: existing.student_id,
        name: existing.name,
        university: existing.university,
        role: existing.role,
      });

      return NextResponse.json({ success: true });
    }

    // New student — insert
    const { data: student, error } = await supabase
      .from("students")
      .insert({
        student_id: studentId,
        name,
        university: university as University,
        role,
      })
      .select("id, student_id, name, university, role")
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
      role: student.role,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }
}
