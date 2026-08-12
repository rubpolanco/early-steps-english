import clsx from "clsx";

export function Badge({
  children,
  color = "blue",
  dot = false,
}: {
  children: React.ReactNode;
  color?: "blue" | "yellow" | "green" | "pink" | "gray" | "red";
  dot?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "bg-brand-sky-light text-brand-blue-dark",
    yellow: "bg-brand-yellow-soft text-amber-800",
    green: "bg-brand-green-soft text-emerald-800",
    pink: "bg-pink-100 text-pink-800",
    gray: "bg-gray-100 text-gray-600",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={clsx("badge", colors[color])}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  color = "sky",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  color?: "sky" | "yellow" | "green" | "pink";
  icon?: string;
}) {
  const bg: Record<string, string> = {
    sky: "bg-brand-sky-light",
    yellow: "bg-brand-yellow-soft",
    green: "bg-brand-green-soft",
    pink: "bg-pink-50",
  };
  const iconBg: Record<string, string> = {
    sky: "bg-brand-blue text-white",
    yellow: "bg-brand-yellow text-brand-navy",
    green: "bg-brand-green text-white",
    pink: "bg-brand-pink text-white",
  };
  return (
    <div className={clsx("card card-hover p-4", bg[color])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-brand-navy/70 font-medium">{label}</p>
        {icon && (
          <span
            className={clsx("icon-chip w-9 h-9 text-lg", iconBg[color])}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
      <p className="text-3xl font-heading font-bold text-brand-navy mt-1">{value}</p>
      {hint && <p className="text-xs text-brand-navy/60 mt-1">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) {
  return (
    <div className="card p-10 text-center text-brand-navy/70 animate-fade-in-up">
      {icon && (
        <div className="icon-chip w-16 h-16 text-3xl bg-brand-sky-light mx-auto mb-3">
          {icon}
        </div>
      )}
      <p className="font-semibold text-brand-navy">{title}</p>
      {subtitle && <p className="text-sm mt-1 max-w-sm mx-auto">{subtitle}</p>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-heading text-xl font-bold text-brand-navy">{children}</h2>
      {action}
    </div>
  );
}

export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }
  const palette = ["#159fd1", "#6fcf97", "#ffb6c1", "#ffd400"];
  const bg = palette[name.length % palette.length];
  return (
    <div
      style={{ width: size, height: size, background: bg }}
      className="rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white shadow-sm"
    >
      <span style={{ fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}
