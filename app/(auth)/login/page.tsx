import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/ui/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">채플 출석</h1>
        <p className="text-base-content/60">학번과 이름으로 로그인하세요</p>
      </div>
      <LoginForm />
    </div>
  );
}
