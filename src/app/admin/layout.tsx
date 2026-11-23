import type { ReactNode } from "react";
import AdminPanel from "@/app/admin/admin-panel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Natal PWK 2026",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminPanel>{children}</AdminPanel>;
}
