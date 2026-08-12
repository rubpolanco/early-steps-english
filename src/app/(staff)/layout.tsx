import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth";
import { getSchool } from "@/lib/queries";
import { StaffShell } from "@/components/StaffShell";
import { getDict } from "@/lib/i18n";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !isStaffRole(session.role)) redirect("/login");
  const school = getSchool();
  const { locale, t } = await getDict();

  return (
    <StaffShell
      role={session.role}
      name={session.name}
      schoolName={school.name}
      locale={locale}
      t={t}
    >
      {children}
    </StaffShell>
  );
}
