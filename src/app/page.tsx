import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (isStaffRole(session.role)) redirect("/dashboard");
  redirect("/parent");
}
