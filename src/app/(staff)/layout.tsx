import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth";
import { getSchool } from "@/lib/queries";
import { StaffShell } from "@/components/StaffShell";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) redirect("/login");
  const school = getSchool();

  return (
    <StaffShell
      role={session.role}
      name={session.name}
      schoolName={school.name}
    >
      {children}
    </StaffShell>
  );
}
