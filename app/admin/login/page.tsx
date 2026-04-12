import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 min-h-dvh">
      <div className="w-full max-w-sm text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">관리자 로그인</h1>
        <p className="text-base-content/60">채플 관리 시스템</p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
