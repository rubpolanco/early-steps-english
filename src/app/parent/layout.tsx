import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSchool } from "@/lib/queries";
import { ParentShell } from "@/components/ParentShell";
import { getDict } from "@/lib/i18n";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/login");
  const school = getSchool();
  const { locale, t } = await getDict();

  return (
    <ParentShell name={session.name} schoolName={school.name} locale={locale} t={t}>
      {children}
    </ParentShell>
  );
}
