import AdminPanel from "@/app/admin/admin-panel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Natal PWK 2026", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminPanel />;
}
