import { useI18n } from '../../contexts/I18nContext';

export default function ProcurementForms() {
  const { isRTL } = useI18n();

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
      <main className="max-w-[1600px] mx-auto px-5 lg:px-8 py-6">
        {/* Blank page */}
      </main>
    </div>
  );
}
