import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { login } from "./actions";
import { ensureSeeded, DEMO_STAFF_PASSWORD, DEMO_GUARDIAN_PASSWORD } from "@/lib/seed";
import { getDict } from "@/lib/i18n";

const ERROR_KEYS = {
  missing_fields: "errorMissingFields",
  wrong_password: "errorWrongPassword",
  inactive_account: "errorInactiveAccount",
  not_found: "errorNotFound",
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  await ensureSeeded();
  const { error, next } = await searchParams;
  const { locale, t } = await getDict();

  const errorMessage =
    error && error in ERROR_KEYS
      ? t.login[ERROR_KEYS[error as keyof typeof ERROR_KEYS]]
      : undefined;

  const demoAccounts = [
    { label: t.login.demoDirector, email: "admin@earlystepsenglish.com", password: DEMO_STAFF_PASSWORD, color: "bg-brand-yellow-soft", icon: "🎓" },
    { label: t.login.demoTeacher, email: "jennifer@earlystepsenglish.com", password: DEMO_STAFF_PASSWORD, color: "bg-brand-sky-light", icon: "🧑‍🏫" },
    { label: t.login.demoFrontDesk, email: "frontdesk@earlystepsenglish.com", password: DEMO_STAFF_PASSWORD, color: "bg-brand-green-soft", icon: "🛎️" },
    { label: t.login.demoParent, email: "patricia.castillo@example.com", password: DEMO_GUARDIAN_PASSWORD, color: "bg-pink-50", icon: "👪" },
  ];

  return (
    <div className="flex-1 sunburst-bg flex items-center justify-center p-6">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher locale={locale} />
      </div>

      <div className="w-full max-w-md relative animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <Logo size={76} href={null} />
        </div>
        <div className="card p-8">
          <h1 className="font-heading text-2xl font-bold text-brand-navy text-center mb-1">
            {t.login.welcomeBack}
          </h1>
          <p className="text-center text-sm text-brand-navy/70 mb-6">
            {t.login.subtitle}
          </p>

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2 border border-red-100">
              {errorMessage}
            </div>
          )}

          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={next ?? ""} />
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">
                {t.login.email}
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder={t.login.emailPlaceholder}
                className="w-full rounded-xl border border-brand-navy/15 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">
                {t.login.password}
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-brand-navy/15 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5">
              {t.login.signIn}
            </button>
          </form>
        </div>

        <div className="card p-5 mt-4">
          <p className="text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-3">
            {t.login.tryDemo}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoAccounts.map((a) => (
              <form action={login} key={a.email}>
                <input type="hidden" name="email" value={a.email} />
                <input type="hidden" name="password" value={a.password} />
                <button
                  type="submit"
                  className={`w-full flex items-start gap-2 text-left rounded-xl px-3 py-2 text-xs font-medium text-brand-navy transition hover:brightness-95 hover:-translate-y-0.5 ${a.color}`}
                >
                  <span className="text-base leading-none mt-0.5" aria-hidden>{a.icon}</span>
                  <span>
                    <span className="block font-semibold">{a.label}</span>
                    <span className="opacity-70">{a.email}</span>
                  </span>
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
