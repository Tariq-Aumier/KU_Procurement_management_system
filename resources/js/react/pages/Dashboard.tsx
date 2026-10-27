import { useMemo, memo, useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";
import { Card, StatCard, Badge, ProgressBar, EmptyState } from "../components/ui";
import { TIER_LIMITS } from "../types";
import type { PageKey } from "../components/Layout";
import type { DashboardStats } from "../api/dashboard";

const API_URL = "/api/v1";
const TOKEN_KEY = "pms_access_token";

const api = async (path: string, init: RequestInit = {}): Promise<any> => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { 
    Accept: "application/json",
    ...(init.headers as Record<string, string> || {}) 
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body && !(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message || `API request failed: ${res.status}`);
  }
  return body.data;
};

function Dashboard({ onNavigate }: { onNavigate: (k: PageKey) => void }) {
  const { resolvedTheme } = useTheme();
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api('/dashboard');
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    if (!dashboardData) return null;
    
    const totalCompanies = dashboardData.companies.length;
    const blacklisted = dashboardData.companies.filter((c) => c.blacklisted).length;
    const activeContracts = dashboardData.contracts.filter((c) => c.status === "active").length;
    const totalContractValue = dashboardData.contracts.reduce((s, c) => s + c.amount, 0);
    const pendingOrders = dashboardData.orders.filter((o) => o.status === "pending" || o.status === "in_progress").length;
    const urgentOrders = dashboardData.orders.filter((o) => (o.priority === "urgent" || o.priority === "high") && o.status !== "completed").length;
    const incompleteOrders = dashboardData.orders.filter((o) => o.status === "incomplete").length;

    const tierCounts = dashboardData.stats.tierCounts;
    const maxTier = Math.max(1, ...Object.values(tierCounts));

    return {
      totalCompanies,
      blacklisted,
      activeContracts,
      totalContractValue,
      pendingOrders,
      urgentOrders,
      incompleteOrders,
      tierCounts,
      maxTier,
    };
  }, [dashboardData]);

  const recentContracts = dashboardData?.contracts.slice(0, 5) || [];
  const urgentOrdersList = dashboardData?.orders.filter((o) => o.priority === "urgent" || o.priority === "high").slice(0, 5) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{lang === "en" ? "Loading dashboard..." : lang === "ps" ? "دشبورډ لوډیږي..." : "در حال بارگذاری داشبورد..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-brand-600 hover:text-brand-700"
          >
            {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-600 dark:text-slate-400">{lang === "en" ? "No data available" : lang === "ps" ? "دیتا نشته" : "داده‌ای موجود نیست"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <Card className="p-6 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
        <h2 className="text-xl font-bold">{t.welcome}</h2>
        <p className="text-sm text-white/80 mt-1">
          {lang === "en" ? "Here is a quick overview of the system status. Use the cards below to navigate quickly." : 
           lang === "ps" ? " دلته د سیستم د عمومي حالت لنړه کتنه ده. د لاندې کارتونو څخه ګټه واخلئ ترڅو په چټکۍ سره ولاړ شئ." :
           "در اینجا نمای کلی از وضعیت سیستم ارائه شده است. از کارت‌های زیر برای سریع‌تر حرکت کنید."}
        </p>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.companies} value={stats.totalCompanies} icon="🏢" tone="blue" hint={`${stats.blacklisted} ${lang === "en" ? "blacklisted" : lang === "ps" ? "بلاک شوي" : "لیست سیاه"}`} />
        <StatCard label={lang === "en" ? "Active Contracts" : lang === "ps" ? "فعال قراردادونه" : "قراردادهای فعال"} value={stats.activeContracts} icon="📑" tone="green" hint={`${dashboardData?.contracts.length || 0} ${lang === "en" ? "total" : lang === "ps" ? "ټول" : "مجموع"}`} />
        <StatCard label={lang === "en" ? "Contract Value" : lang === "ps" ? "د قراردادونو ارزښت" : "ارزش قرارداد"} value={formatMoney(stats.totalContractValue)} icon="💰" tone="violet" hint="USD" />
        <StatCard label={t.orders} value={stats.pendingOrders} icon="📦" tone="amber" hint={`${stats.urgentOrders} ${lang === "en" ? "urgent" : lang === "ps" ? "بیړنۍ" : "فوری"}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier breakdown chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Contract Distribution by Amount" : lang === "ps" ? "د قراردادونو وېش پر اساس د ارزښت" : "توزیع قرارداد بر اساس مبلغ"}</h3>
              <p className="text-xs text-slate-500">{lang === "en" ? "Tier breakdown" : lang === "ps" ? "د طبقې وېش" : "طبقه‌بندی"}</p>
            </div>
            <button onClick={() => onNavigate("contracts")} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              {lang === "en" ? "View all →" : lang === "ps" ? "ټول وګورئ ←" : "مشاهده همه ←"}
            </button>
          </div>
          <div className="space-y-4">
            {(["tier1", "tier2", "tier3", "tier4"] as const).map((t, idx) => {
              const tones = ["green", "blue", "amber", "red"] as const;
              const count = stats.tierCounts[t];
              const pct = (count / stats.maxTier) * 100;
              return (
                <div key={t}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge tone={tones[idx]}>{TIER_LIMITS[t].label[lang]}</Badge>
                      <span className="text-xs text-slate-500">{TIER_LIMITS[t].labelEn}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-slate-700">{count}</span>
                  </div>
                  <ProgressBar value={pct} tone={tones[idx]} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-1">{lang === "en" ? "Alerts" : lang === "ps" ? "خبرتیاوې" : "هشدارها"}</h3>
          <p className="text-xs text-slate-500 mb-4">{lang === "en" ? "Items requiring attention" : lang === "ps" ? "د پاملرنې وړ موارد" : "موارد نیاز به توجه"}</p>
          <div className="space-y-2.5">
            <AlertRow icon="🚫" label={lang === "en" ? "Blacklisted companies" : lang === "ps" ? "بلاک لست شرکتونه" : "شرکت‌های لیست سیاه"} count={stats.blacklisted} tone="red" onClick={() => onNavigate("companies")} theme={resolvedTheme} />
            <AlertRow icon="⚡" label={lang === "en" ? "Urgent orders" : lang === "ps" ? "بیړنۍ سپارښتنې" : "سفارشات فوری"} count={stats.urgentOrders} tone="amber" onClick={() => onNavigate("orders")} theme={resolvedTheme} />
            <AlertRow icon="⏳" label={lang === "en" ? "Incomplete orders" : lang === "ps" ? "ناتمامې سپارښتنې" : "سفارشات ناقص"} count={stats.incompleteOrders} tone="violet" onClick={() => onNavigate("orders")} theme={resolvedTheme} />
          </div>
        </Card>
      </div>

      {/* Recent contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Recent Contracts" : lang === "ps" ? "وروستي قراردادونه" : "قراردادهای اخیر"}</h3>
            <button onClick={() => onNavigate("contracts")} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              {lang === "en" ? "View all →" : lang === "ps" ? "ټول ←" : "مشاهده همه ←"}
            </button>
          </div>
          {recentContracts.length === 0 ? (
            <EmptyState icon="📑" title={lang === "en" ? "No contracts yet" : lang === "ps" ? "هیڅ قرارداد نشته" : "هنوز قراردادی نیست"} description={lang === "en" ? "Start by adding a contract" : lang === "ps" ? "د قرارداد اضافه کولو پیل وکړئ" : "با افزودن قرارداد شروع کنید"} />
          ) : (
            <div className="space-y-2">
              {recentContracts.map((c) => {
                const company = dashboardData?.companies.find((x) => x.id === c.company_id);
                return (
                  <div key={c.id} className="p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-base">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                        <p className="text-xs text-slate-500 truncate">{company?.name} · {c.contract_no}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatMoney(c.amount)} {c.currency}</p>
                        <Badge tone={c.status === "active" ? "green" : c.status === "completed" ? "blue" : "slate"}>
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <ProgressBar value={c.progressPercent} tone={c.progressPercent === 100 ? "green" : "blue"} />
                      <span className="text-xs text-slate-500 tabular-nums w-10 text-left">{c.progressPercent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Priority Orders" : lang === "ps" ? "لومړیتوب لرونکې سپارښتنې" : "سفارشات اولویت‌دار"}</h3>
            <button onClick={() => onNavigate("orders")} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              {lang === "en" ? "View all →" : lang === "ps" ? "ټول ←" : "مشاهده همه ←"}
            </button>
          </div>
          {urgentOrdersList.length === 0 ? (
            <EmptyState icon="📦" title={lang === "en" ? "No urgent orders" : lang === "ps" ? "هیڅ بیړنۍ سپارښتنه نشته" : "سفارش فوری وجود ندارد"} description={lang === "en" ? "All orders are on track" : lang === "ps" ? "ټولې سپارښتنې په ډیره لاره کې دي" : "همه سفارشات در مسیر هستند"} />
          ) : (
            <div className="space-y-2">
              {urgentOrdersList.map((o) => (
                <div key={o.id} className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-base flex items-center gap-3">
                  <div className={`w-2 h-12 rounded-full ${o.priority === "urgent" ? "bg-red-500" : "bg-amber-500"}`} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{o.title}</p>
                    <p className="text-xs text-slate-500">{o.order_no} · {new Date(o.required_date).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={o.priority === "urgent" ? "red" : "amber"}>{o.priority}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function AlertRow({
  icon, label, count, tone, onClick, theme,
}: { icon: string; label: string; count: number; tone: "red" | "amber" | "violet"; onClick: () => void; theme: "light" | "dark" }) {
  const tones = {
    red: theme === "dark" 
      ? "bg-red-950/30 border-red-800 hover:bg-red-950/50 text-red-300" 
      : "bg-red-50 border-red-200 hover:bg-red-100",
    amber: theme === "dark" 
      ? "bg-amber-950/30 border-amber-800 hover:bg-amber-950/50 text-amber-300" 
      : "bg-amber-50 border-amber-200 hover:bg-amber-100",
    violet: theme === "dark" 
      ? "bg-violet-950/30 border-violet-800 hover:bg-violet-950/50 text-violet-300" 
      : "bg-violet-50 border-violet-200 hover:bg-violet-100",
  };
  const textColor = theme === "dark" ? "text-slate-100" : "text-slate-900";
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-base text-right ${tones[tone]}`}
    >
      <span className="text-xl" aria-hidden>{icon}</span>
      <div className="flex-1 text-right">
        <p className={`text-sm font-medium ${textColor}`}>{label}</p>
      </div>
      <span className={`text-2xl font-bold tabular-nums ${textColor}`}>{count}</span>
    </button>
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return Math.floor(n / 1_000_000) + "M";
  if (n >= 1_000) return Math.floor(n / 1_000) + "K";
  return Math.floor(n).toString();
}

export default memo(Dashboard);
