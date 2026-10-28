import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../contexts/I18nContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select, Textarea, ProgressBar } from "../components/ui";
import type { ContractStatus, ContractTier } from "../types";
import { TIER_LIMITS, getTierFromAmount } from "../types";
import { contractsApi, type Contract as ApiContract } from "../api/contracts";

const STATUS_TONE = {
  draft: "slate", active: "green", completed: "blue", cancelled: "red",
} as const;

function ContractViewModal({ contract, onClose }: { contract: ApiContract; onClose: () => void }) {
  const { data } = useApp();
  const { lang } = useI18n();
  const company = data.companies.find((c) => String(c.id) === String(contract.company_id));
  const contractTier = getTierFromAmount(contract.amount);

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'AFN': return '؋';
      case 'EUR': return '€';
      case 'USD': default: return '$';
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={lang === "en" ? "Contract Details" : lang === "ps" ? "تفصیلات قرارداد" : "جزئیات قرارداد"}
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>{lang === "en" ? "Close" : lang === "ps" ? "بستن" : "بستن"}</Button>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Contract No." : lang === "ps" ? "نمبر قرارداد" : "شماره قرارداد"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{contract.contract_no}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Company" : lang === "ps" ? "شرکت" : "شرکت"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{company?.name ?? "—"}</div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Title" : lang === "ps" ? "عنوان" : "عنوان"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{contract.title}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Amount" : lang === "ps" ? "ارزښت" : "ارزش"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{getCurrencySymbol(contract.currency)}{Math.floor(contract.amount).toLocaleString()} {contract.currency}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Tier" : lang === "ps" ? "طبقه" : "طبقه"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{TIER_LIMITS[contractTier].labelEn}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Start Date" : lang === "ps" ? "تاریخ شروع" : "تاریخ شروع"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{contract.start_date}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "End Date" : lang === "ps" ? "تاریخ پایان" : "تاریخ پایان"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{contract.end_date}</div>
        </div>
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Status" : lang === "ps" ? "حالت" : "وضعیت"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100"><Badge tone={STATUS_TONE[contract.status as keyof typeof STATUS_TONE]}>{contract.status}</Badge></div>
        </div>
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Progress" : lang === "ps" ? "پیشرفت" : "پیشرفت"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{contract.progress_percent}%</div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Description" : lang === "ps" ? "توضیحات" : "توضیحات"}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{contract.description || "—"}</div>
        </div>
      </div>
    </Modal>
  );
}

export default function Contracts() {
  const { data } = useApp();
  const { toast } = useToast();
  const { lang } = useI18n();
  
  const [contracts, setContracts] = useState<ApiContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [tier, setTier] = useState<"all" | ContractTier>("all");
  const [status, setStatus] = useState<"all" | ContractStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [editing, setEditing] = useState<ApiContract | null>(null);
  const [viewing, setViewing] = useState<ApiContract | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractsApi.list({ 
        q: q || undefined,
        status: status !== "all" ? status : undefined
      });
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
      console.error('Contracts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (tier !== "all" && getTierFromAmount(c.amount) !== tier) return false;
      if (status !== "all" && c.status !== status) return false;
      if (q) {
        const s = q.toLowerCase();
        const company = data.companies.find((x) => String(x.id) === String(c.company_id));
        if (!c.title.toLowerCase().includes(s) && !c.contract_no.toLowerCase().includes(s) && !company?.name.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
  }, [contracts, data, q, tier, status]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, tier, status]);

  const totalValue = filtered.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'AFN': return '؋';
      case 'EUR': return '€';
      case 'USD': default: return '$';
    }
  };

  return (
    <div className="space-y-5">
      {/* Tier summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["tier1", "tier2", "tier3", "tier4"] as const).map((t) => {
          const list = contracts.filter((c) => getTierFromAmount(c.amount) === t);
          const sum = list.reduce((s, c) => s + (Number(c.amount) || 0), 0);
          const tones = { tier1: "from-emerald-500 to-emerald-600", tier2: "from-blue-500 to-blue-600", tier3: "from-amber-500 to-amber-600", tier4: "from-red-500 to-red-600" };
          const active = tier === t;
          // Get the most common currency in this tier
          const tierCurrencies = list.map(c => c.currency);
          const mostCommonCurrency = tierCurrencies.length > 0 
            ? tierCurrencies.sort((a, b) => tierCurrencies.filter(v => v === a).length - tierCurrencies.filter(v => v === b).length)[0] 
            : 'USD';
          return (
            <button
              key={t}
              onClick={() => setTier(active ? "all" : t)}
              className={`p-4 rounded-2xl border-2 text-right transition-base ${active ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30" : "border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
            >
              <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-br ${tones[t]}`}>
                {TIER_LIMITS[t].label[lang]}
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 tabular-nums">{list.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{TIER_LIMITS[t].labelEn}</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 tabular-nums">{getCurrencySymbol(mostCommonCurrency)}{Math.floor(sum).toLocaleString()}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder={lang === "en" ? "🔍 Search by title, number, company..." : lang === "ps" ? "🔍 لټون د عنوان، شمېر، شرکت..." : "🔍 جستجو بر اساس عنوان، شماره، شرکت..."} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[240px]" />
          <Select value={status} onChange={(e) => setStatus(e.target.value as never)}>
            <option value="all">{lang === "en" ? "All statuses" : lang === "ps" ? "ټول حالات" : "همه وضعیت‌ها"}</option>
            <option value="draft">{lang === "en" ? "Draft" : lang === "ps" ? "مسوده" : "مسوده"}</option>
            <option value="active">{lang === "en" ? "Active" : lang === "ps" ? "فعال" : "فعال"}</option>
            <option value="completed">{lang === "en" ? "Completed" : lang === "ps" ? "بشپړ" : "تکمیل شده"}</option>
            <option value="cancelled">{lang === "en" ? "Cancelled" : lang === "ps" ? "لغوه" : "لغو شده"}</option>
          </Select>
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>{lang === "en" ? "New contract" : lang === "ps" ? "نوی قرارداد" : "قرارداد جدید"}</Button>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
          <span>{lang === "en" ? `Showing ${paginatedData.length} of ${filtered.length} contracts (Page ${currentPage} of ${totalPages})` :
                lang === "ps" ? `ښودل ${paginatedData.length} له ${filtered.length} قراردادونو څخه (پاڼه ${currentPage} له ${totalPages})` :
                `نمایش ${paginatedData.length} از ${filtered.length} قرارداد (صفحه ${currentPage} از ${totalPages})`}</span>
          <span>·</span>
          <span>{lang === "en" ? "Total value:" : lang === "ps" ? "مجموعي ارزښت:" : "ارزش کل:"} <strong className="text-slate-700 dark:text-slate-300">{getCurrencySymbol(filtered.length > 0 ? filtered[0].currency : 'USD')}{Math.floor(totalValue).toLocaleString()}</strong></span>
        </div>
      </Card>

      {/* List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <Button onClick={fetchContracts} variant="secondary" size="sm">
              {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
            </Button>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            icon="📑"
            title={lang === "en" ? "No contracts found" : lang === "ps" ? "هیڅ قرارداد ونه موندل شو" : "قراردادی یافت نشد"}
            description={lang === "en" ? "No contracts match your filters" : lang === "ps" ? "هیڅ قرارداد ستاسو فلټرونه سره نه برابرېږي" : "هیچ قراردادی با فیلترهای شما مطابقت ندارد"}
          />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className={`${lang === "en" ? "text-left pl-20" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Contract" : lang === "ps" ? "قرارداد" : "قرارداد"}</th>
                  <th className={`${lang === "en" ? "text-left pl-12" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Company" : lang === "ps" ? "شرکت" : "شرکت"}</th>
                  <th className={`${lang === "en" ? "text-left pl-8" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Amount" : lang === "ps" ? "ارزښت" : "ارزش"}</th>
                  <th className={`${lang === "en" ? "text-left pl-8" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Progress" : lang === "ps" ? "پرمختګ" : "پیشرفت"}</th>
                  <th className={`${lang === "en" ? "text-left pl-4" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Status" : lang === "ps" ? "حالت" : "وضعیت"}</th>
                  <th className={`${lang === "en" ? "text-left pl-4" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Doc" : lang === "ps" ? "سند" : "سند"}</th>
                  <th className={`${lang === "en" ? "text-right pr-12" : "text-right"} pl-4 py-3 font-semibold`}>{lang === "en" ? "Actions" : lang === "ps" ? "عملونه" : "عملیات"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedData.map((c) => {
                  const company = data.companies.find((x) => String(x.id) === String(c.company_id));
                  const contractTier = getTierFromAmount(c.amount);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className={lang === "en" ? "pl-20 pr-4 py-3" : "pr-4 py-3"}>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{c.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{c.contract_no}</p>
                      </td>
                      <td className={lang === "en" ? "pl-12 pr-4 py-3" : "pr-4 py-3"} style={{textAlign: lang === "en" ? "left" : "right"}}>
                        <span className="text-slate-800 dark:text-slate-200">{company?.name ?? "—"}</span>
                      </td>
                      <td className={lang === "en" ? "pl-8 pr-4 py-3" : "pr-4 py-3"} style={{textAlign: lang === "en" ? "left" : "right"}}>
                        <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{getCurrencySymbol(c.currency)}{Math.floor(c.amount).toLocaleString()} {c.currency}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{TIER_LIMITS[contractTier].labelEn}</p>
                      </td>
                      <td className={`${lang === "en" ? "pl-8" : ""} pr-4 py-3 min-w-[140px]`} style={{textAlign: lang === "en" ? "left" : "right"}}>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={c.progress_percent} tone={c.progress_percent === 100 ? "green" : "blue"} />
                          <span className="text-xs tabular-nums text-slate-700 dark:text-slate-300 w-10 text-left">{c.progress_percent}%</span>
                        </div>
                      </td>
                      <td className={lang === "en" ? "pl-4 pr-4 py-3" : "pr-4 py-3"} style={{textAlign: lang === "en" ? "left" : "right"}}><Badge tone={STATUS_TONE[c.status as keyof typeof STATUS_TONE]}>{c.status}</Badge></td>
                      <td className={lang === "en" ? "pl-4 pr-4 py-3" : "pr-4 py-3"} style={{textAlign: lang === "en" ? "left" : "right"}}>
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      </td>
                      <td className={lang === "en" ? "pr-12 pl-4 py-3" : "pl-4 py-3"} style={{textAlign: "right"}}>
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(c)}>{lang === "en" ? "View" : lang === "ps" ? "مشاهده" : "مشاهده"}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>{lang === "en" ? "Edit" : lang === "ps" ? "سمول" : "ویرایش"}</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {lang === "en" ? `Page ${currentPage} of ${totalPages}` :
                 lang === "ps" ? `پاڼه ${currentPage} له ${totalPages}` :
                 `صفحه ${currentPage} از ${totalPages}`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {lang === "en" ? "Previous" : lang === "ps" ? "مخکینی" : "قبلی"}
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? "primary" : "ghost"}
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[32px]"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {lang === "en" ? "Next" : lang === "ps" ? "راتلونکی" : "بعدی"}
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </Card>

      {(creating || editing) && (
        <ContractFormModal
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (c: any) => {
            try {
              if (editing) {
                await contractsApi.update(editing.id, c);
                toast(lang === "en" ? "Contract updated" : lang === "ps" ? "قرارداد ثبت شو" : "قرارداد به‌روز شد", "success");
              } else {
                await contractsApi.create(c);
                toast(lang === "en" ? "Contract added" : lang === "ps" ? "نوی قرارداد اضافه شو" : "قرارداد جدید اضافه شد", "success");
              }
              await fetchContracts();
              setCreating(false); setEditing(null);
            } catch (error) {
              toast(lang === "en" ? "Error saving: " : lang === "ps" ? "خطا در ذخیره سازی: " : "خطا در ذخیره سازی: " + (error instanceof Error ? error.message : "Unknown error"), "error");
            }
          }}
        />
      )}

      {viewing && (
        <ContractViewModal
          contract={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function ContractFormModal({ initial, onClose, onSave }: { initial?: ApiContract; onClose: () => void; onSave: (c: Partial<ApiContract>) => Promise<void> }) {
  const { data } = useApp();
  const [form, setForm] = useState<Partial<ApiContract>>(
    initial ?? {
      contract_no: `CT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      company_id: data.companies[0]?.id ? Number(data.companies[0].id) : undefined,
      title: "",
      amount: 0,
      currency: "USD",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      status: "draft",
      progress_percent: 0,
      description: "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.title?.trim()) err.title = "اړین دی";
    if (!form.company_id) err.company_id = "شرکت غوره کړئ";
    if (form.amount && form.amount <= 0) err.amount = "ارزښت باید له صفر څخه ډېر وي";
    if (form.end_date && form.start_date && new Date(form.end_date) <= new Date(form.start_date)) err.end_date = "د پای نېټه باید د پیل نېټې وروسته وي";

    if (Object.keys(err).length) { setErrors(err); return; }
    await onSave(form);
  }

  const detectedTier = getTierFromAmount(form.amount || 0);

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "د قرارداد سمول" : "نوی قرارداد"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>کنسل</Button>
          <Button onClick={submit as never}>{initial ? "ثبت" : "اضافه"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="د قرارداد شمېره / Contract No." required>
          <Input value={form.contract_no} onChange={(e) => setForm({ ...form, contract_no: e.target.value })} />
        </Field>
        <Field label="شرکت / Company" required error={errors.company_id}>
          <Select value={form.company_id ?? ""} onChange={(e) => setForm({ ...form, company_id: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">— انتخاب —</option>
            {data.companies.filter((c) => !c.blacklisted).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="عنوان / Title" required error={errors.title}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} invalid={!!errors.title} />
          </Field>
        </div>
        <Field label="ارزښت / Amount" required error={errors.amount} hint={`Tier: ${TIER_LIMITS[detectedTier].labelEn}`}>
          <Input type="number" min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} invalid={!!errors.amount} />
        </Field>
        <Field label="پیسې / Currency">
          <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as never })}>
            <option value="USD">USD</option>
            <option value="AFN">AFN</option>
            <option value="EUR">EUR</option>
          </Select>
        </Field>
        <Field label="د پیل نېټه / Start date">
          <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </Field>
        <Field label="د پای نېټه / End date" error={errors.end_date}>
          <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} invalid={!!errors.end_date} />
        </Field>
        <Field label="حالت / Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as never })}>
            <option value="draft">مسوده / Draft</option>
            <option value="active">فعال / Active</option>
            <option value="completed">بشپړ / Completed</option>
            <option value="cancelled">لغوه / Cancelled</option>
          </Select>
        </Field>
        <Field label="د پرمختګ سلنه / Progress %" hint="۰ څخه ۱۰۰">
          <Input type="number" min={0} max={100} value={form.progress_percent} onChange={(e) => setForm({ ...form, progress_percent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="شرحه / Description">
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
