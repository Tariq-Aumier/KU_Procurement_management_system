import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../contexts/I18nContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select, Textarea } from "../components/ui";
import type { CompanyType } from "../types";
import { companiesApi, type Company as ApiCompany } from "../api/companies";

const TYPE_LABELS: Record<CompanyType, { fa: string; ps: string; en: string }> = {
  construction: { fa: "ساختماني", ps: "ساختماني", en: "Construction" },
  logistics: { fa: "لوژستیکي", ps: "لوژستیکي", en: "Logistics" },
  retail: { fa: "پرچون", ps: "پرچون", en: "Retail" },
  services: { fa: "خدماتي", ps: "خدماتي", en: "Services" },
  logistics_construction: { fa: "لوژستیکي / ساختماني", ps: "لوژستیکي / ساختماني", en: "Logistics / Construction" },
  medical: { fa: "طبي", ps: "طبي", en: "Medical" },
  equipment: { fa: "تجهیزات", ps: "تجهیزات", en: "Equipment" },
};

export default function Companies() {
  const { toast } = useToast();
  const { lang } = useI18n();

  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"all" | CompanyType>("all");
  const [showBlacklisted, setShowBlacklisted] = useState<"all" | "yes" | "no">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [editing, setEditing] = useState<ApiCompany | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<ApiCompany | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companiesApi.list({ q: q || undefined });
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
      console.error('Companies fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (filterType !== "all" && c.company_type !== filterType) return false;
      if (showBlacklisted === "yes" && c.eligibility_status !== "blacklisted") return false;
      if (showBlacklisted === "no" && c.eligibility_status === "blacklisted") return false;
      if (q) {
        const s = q.toLowerCase();
        if (!c.legal_name.toLowerCase().includes(s) && !c.registration_no.toLowerCase().includes(s) && !c.contact_person.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
  }, [companies, q, filterType, showBlacklisted]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterType, showBlacklisted]);

  async function handleToggleBlacklist(c: ApiCompany, reason?: string) {
    try {
      const newStatus = c.eligibility_status === "blacklisted" ? "active" : "blacklisted";
      await companiesApi.update(c.id, { 
        eligibility_status: newStatus,
        blacklist_reason: newStatus === "blacklisted" ? reason : null 
      });
      await fetchCompanies();
      toast(c.eligibility_status === "blacklisted" ? 
        (lang === "en" ? "Removed from blacklist" : lang === "ps" ? "له بلاک لست څخه ووتل" : "از لیست سیاه حذف شد") : 
        (lang === "en" ? "Blacklisted" : lang === "ps" ? "بلاک لست شو" : "لیست سیاه شد"), "success");
    } catch (err) {
      toast(lang === "en" ? "Failed to update blacklist status" : lang === "ps" ? "د بلاک لست وضعیت اپډیت په کې پاتې شو" : "به‌روزرسانی وضعیت لیست سیاه ناموفق بود", "error");
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder={lang === "en" ? "🔍 Search by name, registration, or contact..." : lang === "ps" ? "🔍 د شرکت په نوم، راجستر یا اړیکیال پسې لټون..." : "🔍 جستجو بر اساس نام، ثبت یا تماس..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 min-w-[240px]"
            aria-label="Search companies"
          />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value as never)} aria-label="Filter by type">
            <option value="all">{lang === "en" ? "All types" : lang === "ps" ? "ټول ډولونه" : "همه انواع"}</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v[lang]}</option>
            ))}
          </Select>
          <Select value={showBlacklisted} onChange={(e) => setShowBlacklisted(e.target.value as never)} aria-label="Blacklist filter">
            <option value="all">{lang === "en" ? "All" : lang === "ps" ? "ټول" : "همه"}</option>
            <option value="no">{lang === "en" ? "Active" : lang === "ps" ? "فعال" : "فعال"}</option>
            <option value="yes">{lang === "en" ? "Blacklisted" : lang === "ps" ? "بلاک شوي" : "لیست سیاه"}</option>
          </Select>
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>
            {lang === "en" ? "New company" : lang === "ps" ? "نوی شرکت" : "شرکت جدید"}
          </Button>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {lang === "en" ? `Showing <strong>${paginatedData.length}</strong> of <strong>${filtered.length}</strong> companies (Page ${currentPage} of ${totalPages})` :
           lang === "ps" ? `ښودل <strong>${paginatedData.length}</strong> له <strong>${filtered.length}</strong> شرکتونو څخه (پاڼه ${currentPage} له ${totalPages})` :
           `نمایش <strong>${paginatedData.length}</strong> از <strong>${filtered.length}</strong> شرکت‌ها (صفحه ${currentPage} از ${totalPages})`}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <Button onClick={fetchCompanies} variant="secondary" size="sm">
              {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
            </Button>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState
            icon="🏢"
            title={lang === "en" ? "No companies found" : lang === "ps" ? "هیڅ شرکت ونه موندل شو" : "شرکتی یافت نشد"}
            description={lang === "en" ? "Try changing filters or add a new company" : lang === "ps" ? "فلټر بدل کړئ یا نوی شرکت اضافه کړئ" : "فیلترها را تغییر دهید یا شرکت جدید اضافه کنید"}
          />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wide dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className={`${lang === "en" ? "text-left pl-24" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Company" : lang === "ps" ? "شرکت" : "شرکت"}</th>
                  <th className={`${lang === "en" ? "text-left pl-16" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Type" : lang === "ps" ? "ډول" : "نوع"}</th>
                  <th className={`${lang === "en" ? "text-left pl-20" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Contact" : lang === "ps" ? "اړیکیال" : "تماس"}</th>
                  <th className={`${lang === "en" ? "text-left pl-8" : "text-right"} pr-4 py-3 font-semibold`}>{lang === "en" ? "Status" : lang === "ps" ? "حالت" : "وضعیت"}</th>
                  <th className={`${lang === "en" ? "text-right pr-12" : "text-right"} pl-4 py-3 font-semibold`}>{lang === "en" ? "Actions" : lang === "ps" ? "عملونه" : "عملیات"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedData.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-base dark:hover:bg-slate-800/50">
                    <td className={lang === "en" ? "pl-24 pr-4 py-3" : "pr-4 py-3"} style={{textAlign: lang === "en" ? "left" : "right"}}>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{c.legal_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.registration_no}</p>
                    </td>
                    <td className={lang === "en" ? "pl-16 pr-4 py-3" : "pr-4 py-3"} style={{textAlign: lang === "en" ? "left" : "right"}}>
                      <Badge tone={c.company_type === "construction" ? "blue" : c.company_type === "logistics" ? "violet" : c.company_type === "logistics_construction" ? "amber" : c.company_type === "medical" ? "green" : c.company_type === "equipment" ? "red" : "slate"}>
                        {TYPE_LABELS[c.company_type as CompanyType]?.[lang] || c.company_type}
                      </Badge>
                    </td>
                    <td className={lang === "en" ? "pl-20 pr-4 py-3" : "pr-4 py-3"} style={{textAlign: lang === "en" ? "left" : "right"}}>
                      <p className="text-slate-800 dark:text-slate-200">{c.contact_person}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">{c.phone || '-'}</p>
                    </td>
                    <td className={lang === "en" ? "pl-8 pr-4 py-3" : "pr-4 py-3"} style={{textAlign: lang === "en" ? "left" : "right"}}>
                      {c.eligibility_status === "blacklisted" ? (
                        <Badge tone="red">🚫 {lang === "en" ? "Blacklisted" : lang === "ps" ? "بلاک شوی" : "لیست سیاه"}</Badge>
                      ) : (
                        <Badge tone="green">✓ {lang === "en" ? "Active" : lang === "ps" ? "فعال" : "فعال"}</Badge>
                      )}
                    </td>
                    <td className={lang === "en" ? "pr-12 pl-4 py-3" : "pl-4 py-3"} style={{textAlign: "right"}}>
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setViewing(c)}>{lang === "en" ? "View" : lang === "ps" ? "لیدل" : "مشاهده"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>{lang === "en" ? "Edit" : lang === "ps" ? "سمول" : "ویرایش"}</Button>
                        {c.eligibility_status === "blacklisted" ? (
                          <Button size="sm" variant="ghost" onClick={() => handleToggleBlacklist(c)}>{lang === "en" ? "Unblock" : lang === "ps" ? "ازاد کول" : "رفع مسدودیت"}</Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => {
                            const reason = prompt(lang === "en" ? "Reason for blacklisting:" : lang === "ps" ? "د بلاک کولو دلیل:" : "دلیل مسدودیت:");
                            if (reason) handleToggleBlacklist(c, reason);
                          }}>{lang === "en" ? "Block" : lang === "ps" ? "بلاک" : "مسدود"}</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
        <CompanyForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (c) => {
            try {
              if (editing) {
                await companiesApi.update(editing.id, c);
                toast(lang === "en" ? "Changes saved" : lang === "ps" ? "بدلونونه ثبت شول" : "تغییرات ذخیره شد", "success");
              } else {
                await companiesApi.create(c);
                toast(lang === "en" ? "New company added" : lang === "ps" ? "نوی شرکت اضافه شو" : "شرکت جدید اضافه شد", "success");
              }
              await fetchCompanies();
              setCreating(false); setEditing(null);
            } catch (err) {
              toast(lang === "en" ? "Failed to save company" : lang === "ps" ? "د شرکت ثبت په کې پاتې شو" : "ذخیره شرکت ناموفق بود", "error");
            }
          }}
        />
      )}

      {viewing && (
        <CompanyView
          company={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function CompanyForm({ initial, onClose, onSave }: { initial?: ApiCompany; onClose: () => void; onSave: (c: Partial<ApiCompany>) => Promise<void> }) {
  const { lang } = useI18n();
  const [form, setForm] = useState<Partial<ApiCompany>>(
    initial ?? {
      legal_name: "",
      company_type: "construction",
      registration_no: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      experience: "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.legal_name?.trim()) err.legal_name = "نوم اړین دی";
    if (!form.registration_no?.trim()) err.registration_no = "د راجستر شمېره اړینه ده";
    if (!form.contact_person?.trim()) err.contact_person = "اړیکیال اړین دی";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "ایمیل اشتباه دی";

    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    await onSave(form);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "د شرکت سمول / Edit company" : "نوی شرکت / New company"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>کنسل / Cancel</Button>
          <Button onClick={submit as never}>{initial ? "ثبت / Save" : "اضافه کول / Add"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="د شرکت نوم / Company name" required error={errors.legal_name}>
          <Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} invalid={!!errors.legal_name} />
        </Field>
        <Field label="د راجستر شمېره / Registration No." required error={errors.registration_no}>
          <Input value={form.registration_no} onChange={(e) => setForm({ ...form, registration_no: e.target.value })} invalid={!!errors.registration_no} />
        </Field>
        <Field label="ډول / Type" required>
          <Select value={form.company_type} onChange={(e) => setForm({ ...form, company_type: e.target.value as CompanyType })}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.ps} / {v.en}</option>
            ))}
          </Select>
        </Field>
        <Field label="اړیکیال / Contact person" required error={errors.contact_person}>
          <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} invalid={!!errors.contact_person} />
        </Field>
        <Field label="تلیفون / Phone">
          <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+93 700 000 000" />
        </Field>
        <Field label="ایمیل / Email" error={errors.email}>
          <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={!!errors.email} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="پته / Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="د کاري تجربې شرحه / Work experience">
            <Textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function CompanyView({ company, onClose }: { company: ApiCompany; onClose: () => void }) {
  const { lang } = useI18n();

  return (
    <Modal
      open
      onClose={onClose}
      title={lang === "en" ? "View Company" : lang === "ps" ? "د شرکت لیدل" : "مشاهده شرکت"}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>{lang === "en" ? "Close" : lang === "ps" ? "بندول" : "بستن"}</Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">د شرکت نوم / Company name*</label>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{company.legal_name}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">د راجستر شمېره / Registration No.*</label>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{company.registration_no}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">ډول / Type*</label>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{TYPE_LABELS[company.company_type as CompanyType]?.[lang] || company.company_type}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">اړیکیال / Contact person*</label>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{company.contact_person}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">تلیفون / Phone</label>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1" dir="ltr">{company.phone || '-'}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">ایمیل / Email</label>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1" dir="ltr">{company.email || '-'}</p>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">پته / Address</label>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{company.address || '-'}</p>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">د کاري تجربې شرحه / Work experience</label>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 whitespace-pre-wrap">{company.experience || '-'}</p>
        </div>
      </div>
    </Modal>
  );
}
