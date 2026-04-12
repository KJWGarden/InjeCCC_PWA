import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { setAdminSession } from "@/lib/admin-auth";
import { verifyPassword } from "@/lib/password";
import type { Admin } from "@/lib/supabase/types";

const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
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

    const { username, password } = result.data;
    const supabase = createSupabaseClient();

    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다" },
        { status: 401 }
      );
    }

    const typedAdmin = admin as Admin;
    const valid = await verifyPassword(password, typedAdmin.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다" },
        { status: 401 }
      );
    }

    await setAdminSession({
      id: typedAdmin.id,
      username: typedAdmin.username,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }
}
