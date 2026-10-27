import { useState, useMemo, useEffect } from "react";
import { useI18n } from "../contexts/I18nContext";
import { Card, Input, Badge, EmptyState, Select } from "../components/ui";
import { auditLogsApi, type AuditLog as ApiAuditLog } from "../api/auditLogs";

const ACTION_TONE: Record<string, "green" | "blue" | "amber" | "red" | "violet" | "slate"> = {
  create: "green",
  update: "blue",
  delete: "red",
  login: "violet",
  logout: "slate",
  backup: "amber",
  restore: "amber",
  blacklist: "red",
  unblacklist: "green",
  add_violation: "amber",
  reset_password: "red",
};

export default function Audit() {
  const { lang } = useI18n();
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const [action, setAction] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const logs = await auditLogsApi.list({ pageSize: 500 });
      setAuditLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const entities = useMemo(() => Array.from(new Set(auditLogs.map((l) => l.entity_type))).sort(), [auditLogs]);
  const actions = useMemo(() => Array.from(new Set(auditLogs.map((l) => l.action))).sort(), [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs.filter((l) => {
      if (entity !== "all" && l.entity_type !== entity) return false;
      if (action !== "all" && l.action !== action) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!l.username.toLowerCase().includes(s) && !l.details_json.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [auditLogs, q, entity, action]);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder={lang === "en" ? "🔍 Search by username or details..." : lang === "ps" ? "🔍 د کاروونکي نوم یا توضیحاتو پسې لټون..." : "🔍 جستجو بر اساس نام کاربری یا توضیحات..."} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[240px]" />
          <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="all">{lang === "en" ? "All entities" : lang === "ps" ? "ټولې برخې" : "همه بخش‌ها"}</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="all">{lang === "en" ? "All actions" : lang === "ps" ? "ټول عملونه" : "همه عملیات"}</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
        <p className="text-xs text-slate-500 mt-3">{lang === "en" ? "All system actions performed by users. Last 500 records are kept." : lang === "ps" ? "د سیستم ټول عملونه چې تر اوسه د کاروونکو لخوا ترسره شوي. وروستي ۵۰۰ ریکارډونه ساتل کیږي." : "همه عملیات سیستم که تاکن توسط کاربران انجام شده است. آخرین ۵۰۰ رکورد نگهداری می‌شود."}</p>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button onClick={fetchData} className="text-sm text-brand-600 hover:underline">
            {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
          </button>
        </div>
      ) : (
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="📜" title={lang === "en" ? "No logs found" : lang === "ps" ? "هیڅ لاګ نشته" : "هیچ لاگی یافت نشد"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Time" : lang === "ps" ? "وخت" : "زمان"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "User" : lang === "ps" ? "کاروونکی" : "کاربر"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Action" : lang === "ps" ? "عمل" : "عملیات"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Entity" : lang === "ps" ? "برخه" : "بخش"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Details" : lang === "ps" ? "توضیحات" : "توضیحات"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">@{l.username}</td>
                    <td className="px-4 py-3"><Badge tone={ACTION_TONE[l.action] ?? "slate"}>{l.action}</Badge></td>
                    <td className="px-4 py-3 text-slate-700">{l.entity_type}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{l.details_json}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      )}
    </div>
  );
}
