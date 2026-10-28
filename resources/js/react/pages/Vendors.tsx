import { useState, useEffect, type FormEvent } from "react";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../contexts/I18nContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select } from "../components/ui";
import type { CompanyType } from "../types";
import { vendorsApi, type Vendor as ApiVendor } from "../api/vendors";
import { companiesApi } from "../api/companies";

const TYPE_LABELS: Record<CompanyType, { fa: string; ps: string; en: string }> = {
  construction: { fa: "ساختماني", ps: "ساختماني", en: "Construction" },
  logistics: { fa: "لوژستیکي", ps: "لوژستیکي", en: "Logistics" },
  retail: { fa: "پرچون", ps: "پرچون", en: "Retail" },
  services: { fa: "خدماتي", ps: "خدماتي", en: "Services" },
  logistics_construction: { fa: "لوژستیکي / ساختماني", ps: "لوژستیکي / ساختماني", en: "Logistics / Construction" },
  medical: { fa: "طبي", ps: "طبي", en: "Medical" },
  equipment: { fa: "تجهیزات", ps: "تجهیزات", en: "Equipment" },
};

export default function Vendors() {
  const { toast } = useToast();
  const { lang } = useI18n();
  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiVendor | null>(null);
  const [viewing, setViewing] = useState<ApiVendor | null>(null);
  const [numberedView, setNumberedView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vendorsData, companiesData] = await Promise.all([
        vendorsApi.list(),
        companiesApi.list()
      ]);
      setVendors(vendorsData);
      setCompanies(companiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
      console.error('Vendors fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filtered = vendors.filter((v) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return v.account_no.toLowerCase().includes(s) || (v.tax_id && v.tax_id.toLowerCase().includes(s));
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder={lang === "en" ? "🔍 Search vendors by name, account..." : lang === "ps" ? "🔍 د وېنډر په نوم، حساب شمېره..." : "🔍 جستجو فروشندگان بر اساس نام، حساب..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 min-w-[240px]"
          />
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>
            {lang === "en" ? "New vendor" : lang === "ps" ? "نوی وېنډر" : "فروشنده جدید"}
          </Button>
          <Button onClick={() => setNumberedView(!numberedView)} variant="secondary">
            {numberedView ? (lang === "en" ? "📋 Normal view" : lang === "ps" ? "📋 معمولی ښودل" : "📋 نمای عادی") : (lang === "en" ? "🔢 Numbered view" : lang === "ps" ? "🔢 شماره‌دار ښودل" : "🔢 نمای شماره‌دار")}
          </Button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {lang === "en" ? "Vendor Form · Account-N number is required for each vendor" : lang === "ps" ? "د وېنډر فورم · د Account-N نمبر هر وېنډر ته اړین دی" : "فرم فروشنده · شماره Account-N برای هر فروشنده الزامی است"}
        </p>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <Button onClick={fetchVendors} variant="secondary" size="sm">
              {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
            </Button>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState 
            icon="🤝" 
            title={lang === "en" ? "No vendors" : lang === "ps" ? "هیڅ وېنډر نشته" : "هیچ فروشنده‌ای وجود ندارد"} 
            description={lang === "en" ? "No vendors registered yet" : lang === "ps" ? "هیڅ وېنډر ثبت نشتی" : "هنوز فروشنده‌ای ثبت نشده است"} 
          />
        ) : numberedView ? (
          // Numbered list view
          <>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{lang === "en" ? "Vendor List" : lang === "ps" ? "لیست وېنډرونه" : "لیست فروشندگان"}</h3>
              <Badge tone="violet">{paginatedData.length} {lang === "en" ? "registered" : lang === "ps" ? "ثبت شوي" : "ثبت شده"}</Badge>
            </div>
            <ol className="list-decimal list-inside space-y-2 max-h-[600px] overflow-y-auto">
              {paginatedData.map((v) => {
                const company = companies.find(c => c.id === v.company_id);
                return (
                <li key={v.id} className="text-base p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{company?.legal_name || 'Unknown'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">({v.account_no})</span>
                      <Badge tone={v.verification_status === 'verified' ? 'green' : 'amber'}>{v.verification_status}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setViewing(v)}>
                        {lang === "en" ? "View" : lang === "ps" ? "لیدل" : "مشاهده"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(v)}>
                        {lang === "en" ? "Edit" : lang === "ps" ? "سمول" : "ویرایش"}
                      </Button>
                    </div>
                  </div>
                </li>
                );
              })}
            </ol>
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
        ) : (
          // Original table view
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">Account-N</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">Company</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">Status</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">Tax ID</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">Bank Account</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedData.map((v) => {
                  const company = companies.find(c => c.id === v.company_id);
                  return (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="pl-12 pr-4 py-3">
                      <Badge tone="violet">{v.account_no}</Badge>
                    </td>
                    <td className="pl-12 pr-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{company?.legal_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{v.contact_info || '-'}</p>
                    </td>
                    <td className="pl-12 pr-4 py-3">
                      <Badge tone={v.verification_status === 'verified' ? 'green' : 'amber'}>{v.verification_status}</Badge>
                    </td>
                    <td className="pl-12 pr-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{v.tax_id || '-'}</td>
                    <td className="pl-12 pr-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{v.bank_account || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setViewing(v)}>
                          {lang === "en" ? "View" : lang === "ps" ? "لیدل" : "مشاهده"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(v)}>
                          {lang === "en" ? "Edit" : lang === "ps" ? "سمول" : "ویرایش"}
                        </Button>
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

      {/* Vendor Form Modal */}
      {(creating || editing) && (
        <VendorForm
          initial={editing ?? undefined}
          companies={companies}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={async (v) => {
            try {
              if (editing) {
                await vendorsApi.update(editing.id, v);
                toast(lang === "en" ? "Changes saved" : lang === "ps" ? "بدلونونه ثبت شول" : "تغییرات ذخیره شد", "success");
              } else {
                await vendorsApi.create(v);
                toast(lang === "en" ? "Vendor added" : lang === "ps" ? "وېنډر اضافه شو" : "فروشنده اضافه شد", "success");
              }
              await fetchVendors();
              setCreating(false);
              setEditing(null);
            } catch (err) {
              toast(lang === "en" ? "Failed to save vendor" : lang === "ps" ? "د وېنډر ثبت په کې پاتې شو" : "ذخیره فروشنده ناموفق بود", "error");
            }
          }}
        />
      )}

      {/* View Vendor Modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={lang === "en" ? "Vendor Details" : lang === "ps" ? "د وېنډر معلومات" : "اطلاعات فروشنده"}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setViewing(null)}>
            {lang === "en" ? "Close" : lang === "ps" ? "بستن" : "بستن"}
          </Button>
        }
      >
        {viewing && (() => {
          const company = companies.find(c => c.id === viewing.company_id);
          return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Account-N" : lang === "ps" ? "Account-N" : "Account-N"}</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{viewing.account_no}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Status" : lang === "ps" ? "حالت" : "وضعیت"}</p>
                <Badge tone={viewing.verification_status === 'verified' ? 'green' : 'amber'}>{viewing.verification_status}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Company" : lang === "ps" ? "شرکت" : "شرکت"}</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{company?.legal_name || 'Unknown'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Tax ID" : lang === "ps" ? "د مالیې شمېره" : "شناسه مالیاتی"}</p>
                <p className="font-mono text-slate-700 dark:text-slate-300">{viewing.tax_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Bank Account" : lang === "ps" ? "د بانک حساب" : "حساب بانکی"}</p>
                <p className="font-mono text-slate-700 dark:text-slate-300">{viewing.bank_account || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Bank Name" : lang === "ps" ? "د بانک نوم" : "نام بانک"}</p>
              <p className="text-slate-700 dark:text-slate-300">{viewing.bank_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Contact Info" : lang === "ps" ? "د اړیکې معلومات" : "اطلاعات تماس"}</p>
              <p className="text-slate-700 dark:text-slate-300">{viewing.contact_info || '-'}</p>
            </div>
          </div>
          );
        })()}
      </Modal>

    </div>
  );
}

// Vendor Form Component
function VendorForm({
  initial,
  companies,
  onClose,
  onSave,
}: {
  initial?: ApiVendor;
  companies: any[];
  onClose: () => void;
  onSave: (v: Partial<ApiVendor>) => Promise<void>;
}) {
  const { lang } = useI18n();
  const [form, setForm] = useState<Partial<ApiVendor>>(
    initial ?? {
      company_id: companies[0]?.id || 0,
      account_no: `ACC-N-${1000 + companies.length + 1}`,
      tax_id: "",
      bank_name: "",
      bank_account: "",
      contact_info: "",
      verification_status: "pending",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.company_id) err.company_id = "شرکت اړین دی";
    if (!form.account_no?.trim()) err.account_no = "حساب شمېره اړینه ده";
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
      title={initial ? (lang === "en" ? "Edit Vendor" : lang === "ps" ? "د وېنډر سمول" : "ویرایش فروشنده") : (lang === "en" ? "New Vendor" : lang === "ps" ? "نوی وېنډر" : "فروشنده جدید")}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {lang === "en" ? "Cancel" : lang === "ps" ? "کنسل" : "لغو"}
          </Button>
          <Button onClick={submit as never}>{lang === "en" ? "Save" : lang === "ps" ? "ثبت" : "ذخیره"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="Company" required error={errors.company_id}>
          <Select
            value={form.company_id?.toString() || ""}
            onChange={(e) => setForm({ ...form, company_id: parseInt(e.target.value) })}
            invalid={!!errors.company_id}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.legal_name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Account-N" required error={errors.account_no}>
          <Input
            value={form.account_no}
            onChange={(e) => setForm({ ...form, account_no: e.target.value })}
            invalid={!!errors.account_no}
          />
        </Field>
        <Field label="Tax ID">
          <Input
            value={form.tax_id || ""}
            onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
          />
        </Field>
        <Field label="Bank Name">
          <Input
            value={form.bank_name || ""}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
          />
        </Field>
        <Field label="Bank Account">
          <Input
            dir="ltr"
            value={form.bank_account || ""}
            onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
          />
        </Field>
        <Field label="Contact Info">
          <Input
            value={form.contact_info || ""}
            onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Verification Status">
            <Select
              value={form.verification_status || "pending"}
              onChange={(e) => setForm({ ...form, verification_status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}
