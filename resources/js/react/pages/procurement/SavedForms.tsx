import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { useI18n } from "../../contexts/I18nContext";
import { Button, Card, Badge, EmptyState, Modal } from "../../components/ui";

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

type SavedForm = {
  id: number;
  type: string;
  type_label: string;
  number: string;
  title: string;
  date: string | null;
  status: string;
  created_by: string;
  created_at: string;
};

const TYPE_ICONS: Record<string, string> = {
  rfq: "📋",
  comparison: "📊",
  cash_po: "💰",
  purchase_order: "📑",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  under_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
  closed: "bg-slate-100 text-slate-700",
};

const STATUS_LABELS: Record<string, { fa: string; ps: string; en: string }> = {
  draft: { fa: "پیش‌نویس", ps: "پیش‌نویس", en: "Draft" },
  submitted: { fa: "ارسال شده", ps: "ارسال شده", en: "Submitted" },
  published: { fa: "منتشر شده", ps: "منتشر شده", en: "Published" },
  under_review: { fa: "در حال بررسی", ps: "در حال بررسی", en: "Under Review" },
  approved: { fa: "تایید شده", ps: "تایید شده", en: "Approved" },
  rejected: { fa: "رد شده", ps: "رد شده", en: "Rejected" },
  cancelled: { fa: "لغو شده", ps: "لغو شده", en: "Cancelled" },
  closed: { fa: "بسته شده", ps: "بسته شده", en: "Closed" },
};

export default function SavedForms() {
  const { toast } = useToast();
  const { lang } = useI18n();
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const data = await api('/procurement-workflow/all-saved-forms');
      
      // Also fetch custom saved forms
      const customForms = await api('/procurement-workflow/custom-forms');
      
      const allForms = Array.isArray(data) ? data : [];
      const customFormsArray = Array.isArray(customForms) ? customForms : [];
      
      // Filter out comparison and purchase_order forms from standard forms
      const filteredStandardForms = allForms.filter((form: any) => 
        form.type !== 'comparison' && 
        form.type !== 'purchase_order'
      );
      
      // Combine both types of forms
      const combinedForms = [
        ...filteredStandardForms,
        ...customFormsArray.map((form: any) => ({
          id: form.id,
          type: form.form_type,
          type_label: form.title,
          number: 'Custom',
          title: form.title,
          date: form.created_at,
          status: form.status,
          created_by: 'Unknown',
          created_at: form.created_at,
        }))
      ];
      
      setForms(combinedForms);
    } catch (error) {
      toast('Failed to load saved forms', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const filteredForms = forms.filter(form => {
    if (filterType !== 'all' && form.type !== filterType) return false;
    if (filterStatus !== 'all' && form.status !== filterStatus) return false;
    return true;
  });

  const uniqueTypes = [...new Set(forms.map(f => f.type))];
  const uniqueStatuses = [...new Set(forms.map(f => f.status))];

  const handleViewForm = async (form: SavedForm) => {
    try {
      // If it's a custom form, fetch its details
      if (form.type === 'agricultural_water_inquiry' || form.type.startsWith('custom_')) {
        const formData = await api(`/procurement-workflow/custom-forms/${form.id}`);
        setSelectedForm(formData);
        setShowModal(true);
      } else {
        // For standard forms, navigate to the appropriate form view
        toast(`Viewing ${form.type_label}`, 'info');
      }
    } catch (error) {
      toast('Failed to load form details', 'error');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {lang === "en" ? "Saved Procurement Forms" : lang === "ps" ? "ذخیره شوی فورم‌های تدارکاتی" : "فرم‌های تدارکاتی ذخیره شده"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === "en" ? "All saved RFQ, Comparison, and Purchase Order forms" : lang === "ps" ? "ټول ذخیره شوی فورم‌های RFQ، مقایسه، امر خریداری" : "همه فرم‌های ذخیره شده RFQ، مقایسه، امر خریداری"}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          >
            <option value="all">{lang === "en" ? "All Types" : lang === "ps" ? "ټول ډولونه" : "همه انواع"}</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          >
            <option value="all">{lang === "en" ? "All Status" : lang === "ps" ? "ټول حالتونه" : "همه وضعیت‌ها"}</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{STATUS_LABELS[status]?.[lang] || status}</option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={fetchForms}
            disabled={loading}
          >
            🔄 {lang === "en" ? "Refresh" : lang === "ps" ? "تازه کول" : "تازه کردن"}
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{lang === "en" ? "Loading..." : lang === "ps" ? "در حال بارگذاری..." : "در حال بارگذاری..."}</p>
        </Card>
      ) : filteredForms.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState 
            icon="📄" 
            title={lang === "en" ? "No saved forms" : lang === "ps" ? "هیڅ ذخیره شوی فورم نشته" : "هیچ فرم ذخیره شده‌ای وجود ندارد"} 
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredForms.map((form) => (
            <Card key={`${form.type}-${form.id}`} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-3xl">{TYPE_ICONS[form.type] || "📄"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                        {form.type_label}
                      </span>
                      <Badge tone={STATUS_COLORS[form.status] as any || "bg-slate-100 text-slate-700"}>
                        {STATUS_LABELS[form.status]?.[lang] || form.status}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{form.title}</h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{lang === "en" ? `Number: ${form.number}` : lang === "ps" ? `نمبر: ${form.number}` : `شماره: ${form.number}`}</span>
                      {form.date && <span>{lang === "en" ? `Date: ${new Date(form.date).toLocaleDateString()}` : lang === "ps" ? `ناریخ: ${new Date(form.date).toLocaleDateString()}` : `تاریخ: ${new Date(form.date).toLocaleDateString()}`}</span>}
                      <span>{lang === "en" ? `By: ${form.created_by}` : lang === "ps" ? `لخوا: ${form.created_by}` : `توسط: ${form.created_by}`}</span>
                      <span>{lang === "en" ? `Created: ${new Date(form.created_at).toLocaleDateString()}` : lang === "ps" ? `جوړ شو: ${new Date(form.created_at).toLocaleDateString()}` : `ایجاد شده: ${new Date(form.created_at).toLocaleDateString()}`}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleViewForm(form)}
                  >
                    {lang === "en" ? "View" : lang === "ps" ? "لیدل" : "مشاهده"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal to view saved form details */}
      {showModal && selectedForm && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={selectedForm.title || 'Form Details'}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {lang === "en" ? "Close" : lang === "ps" ? "بستن" : "بستن"}
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{lang === "en" ? "Form Type" : lang === "ps" ? "ډول فورم" : "نوع فرم"}</h3>
              <p className="text-slate-600 dark:text-slate-400">{selectedForm.form_type}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{lang === "en" ? "Status" : lang === "ps" ? "حالت" : "وضعیت"}</h3>
              <p className="text-slate-600 dark:text-slate-400">{selectedForm.status}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{lang === "en" ? "Form Data" : lang === "ps" ? "دیتا فورم" : "داده‌های فرم"}</h3>
              <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-auto max-h-96">
                {JSON.stringify(JSON.parse(selectedForm.form_data), null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
