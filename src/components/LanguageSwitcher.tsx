import { setLocale } from "@/app/actions";
import type { Locale } from "@/lib/i18n/types";

/**
 * A tiny EN / ES pill toggle. Works with no JavaScript — each option is
 * its own form submitting to the `setLocale` server action, which sets a
 * cookie and redirects back to the current page.
 */
export function LanguageSwitcher({
  locale,
  variant = "light",
}: {
  locale: Locale;
  variant?: "light" | "dark";
}) {
  const wrap =
    variant === "dark"
      ? "bg-white/15 backdrop-blur-sm"
      : "bg-brand-sky-light";

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-full p-1 text-xs font-bold ${wrap}`}>
      {(["en", "es"] as Locale[]).map((l) => (
        <form action={setLocale} key={l}>
          <input type="hidden" name="locale" value={l} />
          <button
            type="submit"
            aria-current={locale === l}
            className={
              locale === l
                ? "rounded-full bg-brand-blue px-2.5 py-1 text-white shadow-sm"
                : variant === "dark"
                ? "rounded-full px-2.5 py-1 text-white/80 hover:text-white"
                : "rounded-full px-2.5 py-1 text-brand-navy/60 hover:text-brand-navy"
            }
          >
            {l.toUpperCase()}
          </button>
        </form>
      ))}
    </div>
  );
}
