import { useState } from "react";
import { useI18n } from "../contexts/I18nContext";
import AgriculturalWaterInquiry from "./procurement/AgriculturalWaterInquiry";
import SavedForms from "./procurement/SavedForms";

type FormType = "list" | "agricultural-water-inquiry" | "saved-forms";

export default function Forms() {
  const { isRTL } = useI18n();
  const [currentForm, setCurrentForm] = useState<FormType>("list");

  if (currentForm === "agricultural-water-inquiry") {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
        <main className="max-w-[1600px] mx-auto px-5 lg:px-8 py-6">
          <button
            onClick={() => setCurrentForm("list")}
            className="mb-4 text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            ← بازگشت به لیست فرم‌ها
          </button>
          <AgriculturalWaterInquiry />
        </main>
      </div>
    );
  }

  if (currentForm === "saved-forms") {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
        <main className="max-w-[1600px] mx-auto px-5 lg:px-8 py-6">
          <button
            onClick={() => setCurrentForm("list")}
            className="mb-4 text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            ← بازگشت به لیست فرم‌ها
          </button>
          <SavedForms />
        </main>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
      <main className="max-w-[1600px] mx-auto px-5 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">فرم‌های تدارکات</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => setCurrentForm("agricultural-water-inquiry")}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-600 transition-all duration-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <span className="text-2xl">💧</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">استعلام آب زراعتی</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">درخواست نرخ دهی آب زراعتی</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              فرم استعلام آب زراعتی برای پوهنحی زراعت - شامل جدول اقلام، شرایط تدارک و پرداخت، و روش ارزیابی
            </p>
            <div className="flex items-center text-sm text-brand-600 dark:text-brand-400 font-medium">
              باز کردن فرم
              <span className="mr-2">←</span>
            </div>
          </div>

          <div
            onClick={() => setCurrentForm("saved-forms")}
            className="bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 rounded-xl border border-brand-300 dark:border-brand-500 p-6 cursor-pointer hover:shadow-lg hover:shadow-brand-500/25 transition-all duration-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 dark:bg-white/10 flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">فرم‌های ذخیره شده</h3>
                <p className="text-sm text-brand-100">Saved Forms</p>
              </div>
            </div>
            <p className="text-sm text-brand-100 mb-4">
              مشاهده و مدیریت تمام فرم‌های ذخیره شده - RFQ، مقایسه، امر خریداری و غیره
            </p>
            <div className="flex items-center text-sm text-white font-medium">
              مشاهده فرم‌ها
              <span className="mr-2">←</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

