"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Logo } from "@/components/Logo";
import { logout } from "@/app/actions";
import type { Role } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", roles: ["admin", "teacher", "front_desk"] },
  { href: "/checkin", label: "Check-In / Out", icon: "✅", roles: ["admin", "teacher", "front_desk"] },
  { href: "/students", label: "Children", icon: "🧒", roles: ["admin", "teacher", "front_desk"] },
  { href: "/reports", label: "Daily Reports", icon: "📝", roles: ["admin", "teacher", "front_desk"] },
  { href: "/messages", label: "Messages", icon: "💬", roles: ["admin", "teacher", "front_desk"] },
  { href: "/photos", label: "Photos & Videos", icon: "📸", roles: ["admin", "teacher", "front_desk"] },
  { href: "/classrooms", label: "Classrooms", icon: "🏫", roles: ["admin"] },
  { href: "/staff", label: "Staff", icon: "👩‍🏫", roles: ["admin"] },
  { href: "/enrollment", label: "Enrollment", icon: "📋", roles: ["admin"] },
  { href: "/billing", label: "Billing", icon: "💳", roles: ["admin"] },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Director",
  teacher: "Teacher",
  front_desk: "Front Desk",
};

export function StaffShell({
  role,
  name,
  schoolName,
  children,
}: {
  role: Role;
  name: string;
  schoolName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <div className="flex-1 flex min-h-screen">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-brand-navy/10 flex items-center justify-between px-4 py-3">
        <Logo size={32} href="/dashboard" />
        <button
          onClick={() => setOpen((o) => !o)}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed md:sticky top-0 md:top-0 h-screen w-72 bg-white border-r border-brand-navy/10 flex flex-col z-20 transition-transform",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          "pt-16 md:pt-0"
        )}
      >
        <div className="hidden md:block p-5 border-b border-brand-navy/10">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                  active
                    ? "bg-brand-blue text-white"
                    : "text-brand-navy hover:bg-brand-sky-light"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-navy/10">
          <p className="text-sm font-semibold text-brand-navy truncate">{name}</p>
          <p className="text-xs text-brand-navy/60 mb-3">{ROLE_LABEL[role]} · {schoolName}</p>
          <form action={logout}>
            <button className="btn-secondary w-full py-2 text-sm">Sign out</button>
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
