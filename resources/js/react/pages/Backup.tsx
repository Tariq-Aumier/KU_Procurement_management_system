import { useState, useRef, useEffect } from "react";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../contexts/I18nContext";
import { Button, Card, ConfirmModal } from "../components/ui";
import { saveData } from "../utils/storage";
import { backupsApi, type Backup as ApiBackup } from "../api/backups";

export default function Backup() {
  const { toast } = useToast();
  const { lang } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [backups, setBackups] = useState<ApiBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [confirmImport, setConfirmImport] = useState<unknown | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const backupsData = await backupsApi.list();
      setBackups(backupsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  async function handleCreateBackup() {
    try {
      setCreatingBackup(true);
      await backupsApi.create();
      toast(lang === "en" ? "Backup created successfully" : lang === "ps" ? "بیک اپ بریالي راغاښتل شو" : "بکاپ با موفقیت ایجاد شد", "success");
      await fetchBackups();
    } catch (err) {
      toast(lang === "en" ? "Failed to create backup" : lang === "ps" ? "بیک اپ راغاښتلو په کې ناکام شو" : "ایجاد بکاپ ناموفق بود", "error");
    } finally {
      setCreatingBackup(false);
    }
  }

  async function handleDownloadBackup(id: number, format: 'json' | 'excel') {
    try {
      const blob = format === 'json' 
        ? await backupsApi.downloadJson(id)
        : await backupsApi.downloadExcel(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${id}-${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast(lang === "en" ? "Backup downloaded" : lang === "ps" ? "بیک اپ ډاونلوډ شو" : "بکاپ دانلود شد", "success");
    } catch (err) {
      toast(lang === "en" ? "Failed to download backup" : lang === "ps" ? "بیک اپ ډاونلوډ کولو په کې ناکام شو" : "دانلود بکاپ ناموفق بود", "error");
    }
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.users || !Array.isArray(parsed.users)) throw new Error("Invalid format");
        setConfirmImport(parsed);
      } catch {
        toast(lang === "en" ? "Invalid backup file" : lang === "ps" ? "د فایل ډول اشتباه دی" : "فایل بکاپ نامعتبر است", "error");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">{lang === "en" ? "System Backup & Restore" : lang === "ps" ? "د سیستم بیک اپ او بیا رغول" : "بکاپ و بازیابی سیستم"}</h2>
        <p className="text-sm text-slate-500 mt-1">{lang === "en" ? "Server-side backup management" : lang === "ps" ? "د سرور لخوا د بیک اپ مدیریت" : "مدیریت بکاپ سمت سرور"}</p>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
          📊 {lang === "en" ? "Total backups:" : lang === "ps" ? "مجموعي بیک اپونه:" : "مجموع بکاپ‌ها:"} <strong className="tabular-nums">{backups.length}</strong>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <div className="text-3xl mb-3">📤</div>
          <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Create Server Backup" : lang === "ps" ? "د سرور بیک اپ جوړ کړئ" : "ایجاد بکاپ سرور"}</h3>
          <p className="text-sm text-slate-500 mt-1">{lang === "en" ? "Create a full system backup on the server. This includes all tables and data." : lang === "ps" ? "د سرور په کې د ټول سیستم بیک اپ جوړ کړئ. دا د ټولو جدولونو او معلوماتو شامل دی." : "ایجاد بکاپ کامل سیستم در سرور. این شامل تمام جداول و داده‌ها است."}</p>
          <Button onClick={handleCreateBackup} disabled={creatingBackup} icon={<span>💾</span>} className="mt-4">
            {creatingBackup ? (lang === "en" ? "Creating..." : lang === "ps" ? "راغاښتل کیږي..." : "در حال ایجاد...") : (lang === "en" ? "Create backup" : lang === "ps" ? "بیک اپ جوړ کړئ" : "ایجاد بکاپ")}
          </Button>
        </Card>

        <Card className="p-6">
          <div className="text-3xl mb-3">📥</div>
          <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Restore Local Backup" : lang === "ps" ? "د لوکال بیک اپ بیا رغول" : "بازیابی بکاپ محلی"}</h3>
          <p className="text-sm text-slate-500 mt-1">{lang === "en" ? "Upload a previous JSON backup file. ⚠ Current data will be replaced." : lang === "ps" ? "د مخکیني JSON بیک اپ فایل اپلوډ کړئ. ⚠ موجوده معلومات به ولاړ شي." : "فایل بکاپ JSON قبلی را آپلود کنید. ⚠ داده‌های فعلی جایگزین می‌شوند."}</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()} variant="secondary" icon={<span>📁</span>} className="mt-4">
            {lang === "en" ? "Select backup file" : lang === "ps" ? "د بیک اپ فایل غوره کړئ" : "انتخاب فایل بکاپ"}
          </Button>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">{lang === "en" ? "Server Backups" : lang === "ps" ? "د سرور بیک اپونه" : "بکاپ‌های سرور"}</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <button onClick={fetchBackups} className="text-sm text-brand-600 hover:underline">
              {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
            </button>
          </div>
        ) : backups.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">{lang === "en" ? "No backups found" : lang === "ps" ? "هیڅ بیک اپ ونه موندل شو" : "هیچ بکاپی یافت نشد"}</p>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{lang === "en" ? "Backup" : lang === "ps" ? "بیک اپ" : "بکاپ"} #{backup.id}</p>
                  <p className="text-xs text-slate-500">{new Date(backup.created_at).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{lang === "en" ? "Status:" : lang === "ps" ? "حالت:" : "وضعیت:"} {backup.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleDownloadBackup(backup.id, 'json')}>
                    {lang === "en" ? "JSON" : lang === "ps" ? "JSON" : "JSON"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDownloadBackup(backup.id, 'excel')}>
                    {lang === "en" ? "Excel" : lang === "ps" ? "Excel" : "Excel"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmModal
        open={!!confirmImport}
        onClose={() => setConfirmImport(null)}
        onConfirm={() => {
          if (confirmImport) {
            saveData(confirmImport as never);
            toast(lang === "en" ? "Backup restored" : lang === "ps" ? "بیک اپ بیا راغوښتل شو" : "بکاپ بازیابی شد", "success");
            setTimeout(() => window.location.reload(), 600);
          }
        }}
        title={lang === "en" ? "Restore Backup" : lang === "ps" ? "د بیک اپ بیا رغول" : "بازیابی بکاپ"}
        message={lang === "en" ? "Do you want to replace current data with this backup file? This action cannot be undone!" : lang === "ps" ? "آیا غواړئ موجوده معلومات د دې بیک اپ فایل سره ځای ناستي کړئ؟ دا عمل غیرقابل د راګرځولو دی!" : "آیا می‌خواهید داده‌های فعلی را با این فایل بکاپ جایگزین کنید؟ این عمل قابل برگشت نیست!"}
        confirmText={lang === "en" ? "Restore" : lang === "ps" ? "بیا راغواړه" : "بازیابی"}
      />
    </div>
  );
}
