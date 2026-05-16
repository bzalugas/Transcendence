import AdminPageClient from "./AdminPageClient";
import { getInitialAdminUsers } from "@/lib/server/api";

export default async function AdminPage() {
  const initialAdmin = await getInitialAdminUsers();

  return <AdminPageClient initialAdmin={initialAdmin} />;
}
