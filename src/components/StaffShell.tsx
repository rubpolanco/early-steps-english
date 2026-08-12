"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { logout } from "@/app/actions";
import type { Role } from "@/lib/auth";
import type { Dictionary, Locale } from "@/lib/i18n";

function navItems(t: Dictionary) {
  return [
    { href: "/dashboard", label: t.nav.dashboard, icon: "🏠", roles: ["admin", "teacher", "front_desk"], color: "bg-brand-blue" },
    { href: "/checkin", label: t.nav.checkin, icon: "✅", roles: ["admin", "teacher", "front_desk"], color: "bg-brand-green" },
    { href: "/students", label: t.nav.children, icon: "🧒", roles: ["admin", "teacher", "front_desk"], color: "bg-brand-pink" },
    { href: "/reports", label: t.nav.dailyReports, icon: "📝", roles: ["admin", "teacher", "front_desk"], color: "bg-brand-yellow" },
    { href: "/messages", label: t.nav.messages, icon: "💬", roles: ["admin", "teacher", "front_desk"], color: "bg-brand-blue" },
    { href: "/photos", label: t.nav.photos, icon: "📸", roles: ["admin", "teacher", "front_desk"], color: "bg-brand-green" },
    { href: "/classrooms", label: t.nav.classrooms, icon: "🏫", roles: ["admin"], color: "bg-brand-pink" },
    { href: "/staff", label: t.nav.staff, icon: "👩‍🏫", roles: ["admin"], color: "bg-brand-yellow" },
    { href: "/enrollment", label: t.nav.enrollment, icon: "📋", roles: ["admin"], color: "bg-brand-blue" },
    { href: "/billing", label: t.nav.billing, icon: "💳", roles: ["admin"], color: "bg-brand-green" },
  ];
}

export function StaffShell({
  role,
  name,
  schoolName,
  locale,
  t,
  children,
}: {
  role: Role;
  name: string;
  schoolName: string;
  locale: Locale;
  t: Dictionary;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItems(t).filter((n) => n.roles.includes(role));
  const roleLabel =
    role === "admin" ? t.nav.roleDirector : role === "teacher" ? t.nav.roleTeacher : t.nav.roleFrontDesk;

  return (
    <div className="flex-1 flex min-h-screen">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-brand-navy/10 flex items-center justify-between px-4 py-3">
        <Logo size={32} href="/dashboard" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />
          <button
            onClick={() => setOpen((o) => !o)}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            {open ? t.common.close : t.common.menu}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed md:sticky top-0 md:top-0 h-screen w-72 bg-white border-r border-brand-navy/10 flex flex-col z-20 transition-transform shadow-xl md:shadow-none",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          "pt-16 md:pt-0"
        )}
      >
        <div className="hidden md:flex items-center justify-between gap-2 p-5 border-b border-brand-navy/10">
          <Logo size={44} href="/dashboard" />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all",
                  active
                    ? "bg-brand-blue text-white shadow-md shadow-brand-blue/25"
                    : "text-brand-navy hover:bg-brand-sky-light hover:translate-x-0.5"
                )}
              >
                <span
                  className={clsx(
                    "icon-chip w-8 h-8 text-base",
                    active ? "bg-white/20" : `${item.color} text-white`
                  )}
                  aria-hidden
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block p-4 border-t border-brand-navy/10">
          <LanguageSwitcher locale={locale} />
        </div>

        <div className="p-4 border-t border-brand-navy/10">
          <p className="text-sm font-semibold text-brand-navy truncate">{name}</p>
          <p className="text-xs text-brand-navy/60 mb-3">{roleLabel} · {schoolName}</p>
          <form action={logout}>
            <button className="btn-secondary w-full py-2 text-sm">{t.common.signOut}</button>
          </form>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
