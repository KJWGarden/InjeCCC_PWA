import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSemesterFromDate } from "@/lib/utils";
import {
  createSessionSheet,
  renameSessionSheet,
  deleteSessionSheet,
} from "@/lib/google-sheets";

const createSessionSchema = z.object({
  session_date: z.string().min(1, "날짜를 입력해주세요"),
  title: z.string().optional(),
  qr_duration_minutes: z.number().min(1).max(120).default(15),
});

const updateSessionSchema = z.object({
  id: z.string().uuid(),
  session_date: z.string().min(1, "날짜를 입력해주세요"),
  title: z.string().optional(),
  qr_duration_minutes: z.number().min(1).max(120),
});

const deleteSessionSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { session_date, title, qr_duration_minutes } = result.data;
    const semester = getSemesterFromDate(session_date);
    const token = crypto.randomUUID();

    const expiresAt = new Date(
      new Date(`${session_date}T23:59:59`).getTime() +
        qr_duration_minutes * 60 * 1000
    ).toISOString();

    // Create Google Sheets tab (non-blocking on failure)
    let sheetTitle: string | null = null;
    try {
      const sheetName = title || `채플 ${session_date}`;
      sheetTitle = await createSessionSheet(sheetName);
    } catch (e) {
      console.error("Google Sheets 탭 생성 실패:", e);
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("chapel_sessions")
      .insert({
        session_date,
        semester,
        title: title || null,
        token,
        token_expires_at: expiresAt,
        is_active: true,
        sheet_title: sheetTitle,
      })
      .select()
      .single();

    if (error) {
      console.error("Session creation error:", error);
      return NextResponse.json(
        { error: "채플 세션 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, session: data });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = updateSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id, session_date, title, qr_duration_minutes } = result.data;
    const semester = getSemesterFromDate(session_date);

    const expiresAt = new Date(
      new Date(`${session_date}T23:59:59`).getTime() +
        qr_duration_minutes * 60 * 1000
    ).toISOString();

    const supabase = createSupabaseClient();

    // Fetch current session to get existing sheet_title
    const { data: current } = await supabase
      .from("chapel_sessions")
      .select("sheet_title, title")
      .eq("id", id)
      .single();

    // Rename sheet tab if title changed and sheet exists
    let newSheetTitle = current?.sheet_title ?? null;
    const newTitle = title || `채플 ${session_date}`;
    if (current?.sheet_title && newTitle !== current.title) {
      try {
        const renamed = await renameSessionSheet(current.sheet_title, newTitle);
        if (renamed) newSheetTitle = renamed;
      } catch (e) {
        console.error("Google Sheets 탭 이름 변경 실패:", e);
      }
    }

    const { data, error } = await supabase
      .from("chapel_sessions")
      .update({
        session_date,
        semester,
        title: title || null,
        token_expires_at: expiresAt,
        sheet_title: newSheetTitle,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Session update error:", error);
      return NextResponse.json(
        { error: "채플 세션 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, session: data });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = deleteSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = result.data;
    const supabase = createSupabaseClient();

    // Delete Google Sheets tab if exists
    const { data: session } = await supabase
      .from("chapel_sessions")
      .select("sheet_title")
      .eq("id", id)
      .single();

    if (session?.sheet_title) {
      try {
        await deleteSessionSheet(session.sheet_title);
      } catch (e) {
        console.error("Google Sheets 탭 삭제 실패:", e);
      }
    }

    const { error: attendanceError } = await supabase
      .from("attendance_records")
      .delete()
      .eq("session_id", id);

    if (attendanceError) {
      console.error("Attendance deletion error:", attendanceError);
      return NextResponse.json(
        { error: "출석 기록 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    const { error: sessionError } = await supabase
      .from("chapel_sessions")
      .delete()
      .eq("id", id);

    if (sessionError) {
      console.error("Session deletion error:", sessionError);
      return NextResponse.json(
        { error: "채플 세션 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }
}
