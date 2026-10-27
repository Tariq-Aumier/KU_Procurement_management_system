import { useState, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useI18n } from "../contexts/I18nContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Input, Field } from "../components/ui";

export default function Login() {
  const { login } = useApp();
  const { t, lang, setLang, isRTL } = useI18n();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil !== null && lockedUntil > Date.now();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    if (isLocked) {
      const secs = Math.ceil((lockedUntil! - Date.now()) / 1000);
      setErrors({ general: t.locked.replace("{secs}", String(secs)) });
      return;
    }

    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = t.usernameRequired;
    if (!password) newErrors.password = t.passwordRequired;
    else if (password.length < 6) newErrors.password = t.passwordLength;

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const res = await login(username.trim(), password);
    setLoading(false);

    if (!res.ok) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 30_000);
        setAttempts(0);
        setErrors({ general: t.securityLock });
      } else {
        setErrors({ general: `${res.error} (${5 - newAttempts} ${t.attemptsLeft})` });
      }
      toast(res.error || t.invalid, "error");
    } else {
      toast(t.welcome, "success");
    }
  }

  const features = [t.feature1, t.feature2, t.feature3, t.feature4];

  return (
    <div className="min-h-screen flex items-stretch dark:bg-slate-900" dir={isRTL ? "rtl" : "ltr"}>
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-between w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl">📋</div>
            <div>
              <h1 className="text-lg font-bold">{t.appName}</h1>
              <p className="text-xs text-white/70">{t.appNameShort}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              {t.loginTitle.split(isRTL ? " " : " ").slice(0, -1).join(" ")}
              <br />
              <span className="text-brand-300">{t.loginTitle.split(isRTL ? " " : " ").pop()}</span>
            </h2>
            <p className="text-white/80 leading-7">{t.loginDescription}</p>
            <ul className="space-y-3 text-sm text-white/90">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-400/30 border border-brand-300 flex items-center justify-center text-xs">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">© 2026 {t.appName} · v1.0</p>
        </div>
      </div>

      {/* Right login form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xl">📋</div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.appName}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.appNameShort}</p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <button onClick={() => setLang("en")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${lang === "en" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>🇬🇧 {t.english}</button>
            <button onClick={() => setLang("ps")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${lang === "ps" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>🇦🇫 {t.pashto}</button>
            <button onClick={() => setLang("fa")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${lang === "fa" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>🇦🇫 {t.dari}</button>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.welcome}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.login}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm rounded-lg px-4 py-3" role="alert">
                {errors.general}
              </div>
            )}

            <Field label={t.username} htmlFor="username" error={errors.username} required>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                invalid={!!errors.username}
                disabled={isLocked || loading}
              />
            </Field>

            <Field label={t.password} htmlFor="password" error={errors.password} required>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  invalid={!!errors.password}
                  disabled={isLocked || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 z-10"
                  disabled={isLocked || loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </Field>

            <Button type="submit" size="lg" className="w-full" loading={loading} disabled={isLocked}>
              {t.login}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
