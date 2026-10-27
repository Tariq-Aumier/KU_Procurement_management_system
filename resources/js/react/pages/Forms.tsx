import { useI18n } from "../contexts/I18nContext";

export default function Forms() {
  const { isRTL } = useI18n();

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
      <main className="max-w-[1600px] mx-auto px-5 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Forms</h1>
        <p className="text-slate-600 dark:text-slate-400">Forms section is ready for content.</p>
      </main>
    </div>
  );
}

