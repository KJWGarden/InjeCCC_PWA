import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase/server";
import { appendAttendanceRow } from "@/lib/google-sheets";

const checkInSchema = z.object({
  token: z.string().min(1, "유효하지 않은 QR 코드입니다"),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "로그인이 필요합니다" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const result = checkInSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token } = result.data;
    const supabase = createSupabaseClient();

    // Find the chapel session by token
    const { data: chapelSession, error: sessionError } = await supabase
      .from("chapel_sessions")
      .select("*")
      .eq("token", token)
      .single();

    if (sessionError || !chapelSession) {
      return NextResponse.json(
        { error: "유효하지 않은 QR 코드입니다" },
        { status: 400 }
      );
    }

    // Check if session is active
    if (!chapelSession.is_active) {
      return NextResponse.json(
        { error: "이 채플 세션은 종료되었습니다" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(chapelSession.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "QR 코드가 만료되었습니다" },
        { status: 400 }
      );
    }

    // Check for duplicate attendance
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("student_id", session.id)
      .eq("session_id", chapelSession.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 출석 처리되었습니다" },
        { status: 409 }
      );
    }

    // Record attendance
    const { error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        student_id: session.id,
        session_id: chapelSession.id,
      });

    if (insertError) {
      console.error("Check-in error:", insertError);
      return NextResponse.json(
        { error: "출석 처리 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // Fire-and-forget: append to Google Sheets
    if (chapelSession.sheet_title) {
      appendAttendanceRow(chapelSession.sheet_title, {
        name: session.name,
        studentId: session.studentId,
        university: session.university,
        role: session.role,
      }).catch((e) => console.error("Google Sheets 행 추가 실패:", e));
    }

    return NextResponse.json({
      success: true,
      message: "출석이 완료되었습니다",
      session: {
        title: chapelSession.title,
        date: chapelSession.session_date,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }
}
