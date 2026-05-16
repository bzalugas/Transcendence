import type { Metadata } from "next";
import AdminPageClient from "./AdminPageClient";
import { getInitialAdminUsers } from "@/lib/server/api";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage users, moderation, and platform administration.",
};

export default async function AdminPage() {
  const initialAdmin = await getInitialAdminUsers();

  return <AdminPageClient initialAdmin={initialAdmin} />;
}
