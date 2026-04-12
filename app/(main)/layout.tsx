import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthProvider from "@/components/providers/AuthProvider";
import BottomNav from "@/components/ui/BottomNav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AuthProvider session={session}>
      <div className="flex flex-col flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
