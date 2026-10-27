import { useMemo, useRef, useState, useEffect } from "react";
import { useI18n } from "../contexts/I18nContext";
import { Card, Badge, Button, ProgressBar } from "../components/ui";
import { TIER_LIMITS } from "../types";
import { contractsApi } from "../api/contracts";
import { ordersApi } from "../api/orders";
import { companiesApi } from "../api/companies";

const CURRENCY_SYMBOLS: Record<string, string> = {
  AFN: "؋",
  USD: "$",
  EUR: "€",
};

const getCurrencySymbol = (currency?: string) => CURRENCY_SYMBOLS[currency || "AFN"] || currency || "؋";

export default function Reports() {
  const { lang } = useI18n();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [contracts, setContracts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [contractsData, ordersData, companiesData] = await Promise.all([
        contractsApi.list(),
        ordersApi.list(),
        companiesApi.list(),
      ]);
      setContracts(contractsData);
      setOrders(ordersData);
      setCompanies(companiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tierStats = useMemo(() => {
    return (["tier1", "tier2", "tier3", "tier4"] as const).map((t) => {
      const list = contracts.filter((c) => c.tier === t);
      const sum = list.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const currency = list[0]?.currency || "AFN";
      return { tier: t, count: list.length, sum, currency };
    });
  }, [contracts]);

  const totalContractValue = contracts.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const primaryCurrency = contracts[0]?.currency || "AFN";

  const statusStats = useMemo(() => {
    return (["draft", "active", "completed", "cancelled"] as const).map((s) => ({
      status: s,
      count: contracts.filter((c) => c.status === s).length,
    }));
  }, [contracts]);

  const orderPriorityStats = useMemo(() => {
    return (["urgent", "high", "medium", "low"] as const).map((p) => ({
      priority: p,
      count: orders.filter((o) => o.priority === p).length,
    }));
  }, [orders]);

  const companyTypeStats = useMemo(() => {
    return (["construction", "logistics", "retail", "services"] as const).map((t) => ({
      type: t,
      count: companies.filter((c) => c.type === t).length,
    }));
  }, [companies]);

  const topCompanies = useMemo(() => {
    const map = new Map<number, { total: number; currency: string }>();
    contracts.forEach((c) => {
      if (c.company_id) {
        const current = map.get(c.company_id) || { total: 0, currency: c.currency || "AFN" };
        map.set(c.company_id, {
          total: current.total + (Number(c.amount) || 0),
          currency: c.currency || "AFN",
        });
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([id, { total, currency }]) => ({
        company: companies.find((c) => c.id === id),
        total,
        currency,
      }));
  }, [contracts, companies]);

  const maxTier = Math.max(1, ...tierStats.map((t) => t.count));
  const maxPriority = Math.max(1, ...orderPriorityStats.map((p) => p.count));
  const maxTopCompany = Math.max(1, ...topCompanies.map((t) => t.total));

  return (
    <div className="space-y-5" ref={printRef}>
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{lang === "en" ? "System Reports" : lang === "ps" ? "د سیستم راپورونه" : "گزارشات سیستم"}</h2>
          <p className="text-xs text-slate-500">Standardized reporting & analytics</p>
        </div>
        <Button variant="secondary" onClick={() => window.print()} icon={<span>🖨</span>}>
          {lang === "en" ? "Print" : lang === "ps" ? "چاپ کول" : "چاپ"}
        </Button>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <Button onClick={fetchData} variant="secondary" size="sm">
            {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
          </Button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tier distribution - bar chart */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Contract distribution by value" : lang === "ps" ? "د قراردادونو وېش پر ارزښت" : "توزیع قرارداد بر اساس ارزش"}</h3>
          <p className="text-xs text-slate-500 mb-5">Contract distribution by amount tier</p>
          <div className="space-y-4">
            {tierStats.map((s) => {
              const colors = { tier1: "green", tier2: "blue", tier3: "amber", tier4: "red" } as const;
              return (
                <div key={s.tier}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <Badge tone={colors[s.tier]}>{TIER_LIMITS[s.tier].label[lang]}</Badge>
                    <div className="text-xs text-slate-600">
                      <span className="tabular-nums font-semibold">{s.count}</span> {lang === "en" ? "contracts" : lang === "ps" ? "قراردادونه" : "قراردادها"} · <span className="tabular-nums">{getCurrencySymbol(s.currency)}{s.sum.toLocaleString()}</span>
                    </div>
                  </div>
                  <ProgressBar value={(s.count / maxTier) * 100} tone={colors[s.tier]} />
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200 text-sm text-slate-700">
            {lang === "en" ? "Total value:" : lang === "ps" ? "مجموعي ارزښت:" : "مجموع ارزش:"} <strong className="tabular-nums text-lg">{getCurrencySymbol(primaryCurrency)}{totalContractValue.toLocaleString()}</strong>
          </div>
        </Card>

        {/* Status pie (using SVG) */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Contract status" : lang === "ps" ? "د قراردادونو حالت" : "وضعیت قرارداد"}</h3>
          <p className="text-xs text-slate-500 mb-5">Contract status breakdown</p>
          <DonutChart
            data={statusStats.map((s) => ({
              label: s.status,
              value: s.count,
              color: s.status === "active" ? "#10b981" : s.status === "completed" ? "#3b82f6" : s.status === "cancelled" ? "#ef4444" : "#94a3b8",
            }))}
          />
        </Card>

        {/* Priority bars */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Order priority" : lang === "ps" ? "د سپارښتنو لومړیتوب" : "اولویت سفارش"}</h3>
          <p className="text-xs text-slate-500 mb-5">Order priority distribution</p>
          <div className="space-y-3">
            {orderPriorityStats.map((p) => {
              const tones = { urgent: "red", high: "amber", medium: "blue", low: "slate" } as const;
              return (
                <div key={p.priority}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize text-slate-700">{p.priority}</span>
                    <span className="tabular-nums font-semibold">{p.count}</span>
                  </div>
                  <ProgressBar value={(p.count / maxPriority) * 100} tone={p.priority === "urgent" ? "red" : p.priority === "high" ? "amber" : p.priority === "medium" ? "blue" : "blue"} />
                  {/* eslint-disable-next-line */}
                  <span className="hidden">{tones[p.priority]}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Company types */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Company distribution" : lang === "ps" ? "د شرکتونو وېش" : "توزیع شرکت"}</h3>
          <p className="text-xs text-slate-500 mb-5">Companies by type</p>
          <DonutChart
            data={companyTypeStats.map((s) => ({
              label: s.type,
              value: s.count,
              color: s.type === "construction" ? "#3b82f6" : s.type === "logistics" ? "#8b5cf6" : s.type === "retail" ? "#f59e0b" : "#64748b",
            }))}
          />
        </Card>

        {/* Top companies */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">{lang === "en" ? "Top 5 companies by contract value" : lang === "ps" ? "د پنځو غوره شرکتونو لیست (د قرارداد ارزښت)" : "لیست ۵ شرکت برتر بر اساس ارزش قرارداد"}</h3>
          <p className="text-xs text-slate-500 mb-5">Top 5 companies by total contract value</p>
          {topCompanies.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">{lang === "en" ? "No data" : lang === "ps" ? "معلومات نشته" : "هیچ داده‌ای"}</p>
          ) : (
            <div className="space-y-3">
              {topCompanies.map((t, i) => (
                <div key={t.company?.id ?? i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="font-medium text-slate-900 truncate">{t.company?.name ?? "Unknown"}</p>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">{getCurrencySymbol(t.currency)}{t.total.toLocaleString()}</p>
                    </div>
                    <ProgressBar value={(t.total / maxTopCompany) * 100} tone="blue" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
        )}
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width="180" height="180" viewBox="0 0 180 180" className="shrink-0">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        {data.map((d, i) => {
          const len = (d.value / total) * circumference;
          const dash = `${len} ${circumference}`;
          const el = (
            <circle
              key={i}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="22"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="90" y="86" textAnchor="middle" className="fill-slate-900 text-xl font-bold">{total}</text>
        <text x="90" y="104" textAnchor="middle" className="fill-slate-500 text-[10px]">Total</text>
      </svg>
      <div className="flex-1 space-y-2 min-w-0">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} aria-hidden />
            <span className="flex-1 capitalize text-slate-700 truncate">{d.label}</span>
            <span className="tabular-nums font-semibold text-slate-900">{d.value}</span>
            <span className="text-xs text-slate-500 tabular-nums w-10 text-left">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
