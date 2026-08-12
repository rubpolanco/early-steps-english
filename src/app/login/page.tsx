import { Logo } from "@/components/Logo";
import { login } from "./actions";
import { ensureSeeded, DEMO_STAFF_PASSWORD, DEMO_GUARDIAN_PASSWORD } from "@/lib/seed";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  await ensureSeeded();
  const { error, next } = await searchParams;

  const demoAccounts = [
    { label: "Director (admin)", email: "admin@earlystepsenglish.com", password: DEMO_STAFF_PASSWORD, color: "bg-brand-yellow-soft" },
    { label: "Teacher — Little Explorers", email: "jennifer@earlystepsenglish.com", password: DEMO_STAFF_PASSWORD, color: "bg-brand-sky-light" },
    { label: "Front desk", email: "frontdesk@earlystepsenglish.com", password: DEMO_STAFF_PASSWORD, color: "bg-brand-green-soft" },
    { label: "Parent — Patricia Castillo", email: "patricia.castillo@example.com", password: DEMO_GUARDIAN_PASSWORD, color: "bg-pink-50" },
  ];

  return (
    <div className="flex-1 sunburst-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size={72} href={null} />
        </div>
        <div className="card p-8">
          <h1 className="font-heading text-2xl font-bold text-brand-navy text-center mb-1">
            Welcome back!
          </h1>
          <p className="text-center text-sm text-brand-navy/70 mb-6">
            Sign in to your school portal
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2 border border-red-100">
              {error}
            </div>
          )}

          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={next ?? ""} />
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-brand-navy/15 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">
                Password
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
              Sign in
            </button>
          </form>
        </div>

        <div className="card p-5 mt-4">
          <p className="text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-3">
            Try a demo account
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoAccounts.map((a) => (
              <form action={login} key={a.email}>
                <input type="hidden" name="email" value={a.email} />
                <input type="hidden" name="password" value={a.password} />
                <button
                  type="submit"
                  className={`w-full text-left rounded-xl px-3 py-2 text-xs font-medium text-brand-navy hover:brightness-95 ${a.color}`}
                >
                  <span className="block font-semibold">{a.label}</span>
                  <span className="opacity-70">{a.email}</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
