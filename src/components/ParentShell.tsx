"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Logo } from "@/components/Logo";
import { logout } from "@/app/actions";

const NAV = [
  { href: "/parent", label: "Home", icon: "🏠" },
  { href: "/parent/reports", label: "Daily Reports", icon: "📝" },
  { href: "/parent/photos", label: "Photos & Videos", icon: "📸" },
  { href: "/parent/messages", label: "Messages", icon: "💬" },
  { href: "/parent/billing", label: "Billing", icon: "💳" },
  { href: "/parent/pickup-people", label: "Pickup People", icon: "🚸" },
];

export function ParentShell({
  name,
  schoolName,
  children,
}: {
  name: string;
  schoolName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex-1 flex min-h-screen">
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-brand-navy/10 flex items-center justify-between px-4 py-3">
        <Logo size={32} href="/parent" />
        <button onClick={() => setOpen((o) => !o)} className="btn-secondary px-3 py-1.5 text-sm">
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        className={clsx(
          "fixed md:sticky top-0 h-screen w-72 bg-white border-r border-brand-navy/10 flex flex-col z-20 transition-transform",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          "pt-16 md:pt-0"
        )}
      >
        <div className="hidden md:block p-5 border-b border-brand-navy/10">
          <Logo size={44} href="/parent" />
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors",
                  active ? "bg-brand-blue text-white" : "text-brand-navy hover:bg-brand-sky-light"
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
          <p className="text-xs text-brand-navy/60 mb-3">Parent · {schoolName}</p>
          <form action={logout}>
            <button className="btn-secondary w-full py-2 text-sm">Sign out</button>
          </form>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/30 z-10 md:hidden" onClick={() => setOpen(false)} />
      )}

      <main className="flex-1 min-w-0 pt-16 md:pt-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
