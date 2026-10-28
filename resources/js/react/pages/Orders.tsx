import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../contexts/I18nContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select, Textarea } from "../components/ui";
import type { Priority, OrderStatus } from "../types";
import { ordersApi, type ProcurementOrder as ApiOrder } from "../api/orders";

const PRIORITY_TONE = { low: "slate", medium: "blue", high: "amber", urgent: "red" } as const;
const PRIORITY_RANK: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
const STATUS_LABEL = {
  draft: { fa: "مسوده", en: "Draft", tone: "slate" as const },
  pending: { fa: "په تمه", en: "Pending", tone: "amber" as const },
  approved: { fa: "تایید شوی", en: "Approved", tone: "green" as const },
  in_progress: { fa: "په جریان کې", en: "In progress", tone: "blue" as const },
  completed: { fa: "بشپړ", en: "Completed", tone: "green" as const },
  incomplete: { fa: "ناتمام", en: "Incomplete", tone: "red" as const },
  cancelled: { fa: "لغوه شوی", en: "Cancelled", tone: "red" as const },
};

export default function Orders() {
  const { data } = useApp();
  const { toast } = useToast();
  const { lang } = useI18n();
  
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [q, setQ] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "retail" | "contract" | "equipment" | "supplies">("all");
  const [sortByPriority, setSortByPriority] = useState(true);

  const [editing, setEditing] = useState<ApiOrder | null>(null);
  const [viewing, setViewing] = useState<ApiOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.list({ 
        q: q || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        priority: filterPriority !== "all" ? filterPriority : undefined,
        category: filterCategory !== "all" ? filterCategory : undefined
      });
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      console.error('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    let arr = orders.filter((o) => {
      if (filterPriority !== "all" && o.priority !== filterPriority) return false;
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (filterCategory !== "all" && o.category !== filterCategory) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!o.title.toLowerCase().includes(s) && !o.order_no.toLowerCase().includes(s)) return false;
      }
      return true;
    });
    if (sortByPriority) {
      arr = [...arr].sort((a, b) => PRIORITY_RANK[b.priority as Priority] - PRIORITY_RANK[a.priority as Priority]);
    }
    return arr;
  }, [orders, q, filterPriority, filterStatus, filterCategory, sortByPriority]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterPriority, filterStatus, filterCategory, sortByPriority]);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder={lang === "en" ? "🔍 Search orders..." : lang === "ps" ? "🔍 لټون د سپارښتنو..." : "🔍 جستجو سفارشات..."} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[200px]" />
          <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as never)} aria-label="Priority">
            <option value="all">{lang === "en" ? "All priorities" : lang === "ps" ? "ټول لومړیتوبونه" : "همه اولویت‌ها"}</option>
            <option value="urgent">{lang === "en" ? "Urgent" : lang === "ps" ? "بیړنی" : "فوری"}</option>
            <option value="high">{lang === "en" ? "High" : lang === "ps" ? "لوړ" : "بالا"}</option>
            <option value="medium">{lang === "en" ? "Medium" : lang === "ps" ? "متوسط" : "متوسط"}</option>
            <option value="low">{lang === "en" ? "Low" : lang === "ps" ? "ټیټ" : "پایین"}</option>
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as never)} aria-label="Status">
            <option value="all">{lang === "en" ? "All statuses" : lang === "ps" ? "ټول حالات" : "همه وضعیت‌ها"}</option>
            <option value="pending">{lang === "en" ? "Pending" : lang === "ps" ? "په تمه" : "در انتظار"}</option>
            <option value="in_progress">{lang === "en" ? "In progress" : lang === "ps" ? "په جریان کې" : "در حال انجام"}</option>
            <option value="completed">{lang === "en" ? "Completed" : lang === "ps" ? "بشپړ" : "تکمیل شده"}</option>
            <option value="incomplete">{lang === "en" ? "Incomplete" : lang === "ps" ? "ناتمام" : "ناقص"}</option>
          </Select>
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as never)} aria-label="Category">
            <option value="all">{lang === "en" ? "All categories" : lang === "ps" ? "ټولې کټګورۍ" : "همه دسته‌بندی‌ها"}</option>
            <option value="retail">{lang === "en" ? "Retail" : lang === "ps" ? "پرچون" : "خرده‌فروشی"}</option>
            <option value="contract">{lang === "en" ? "Contract" : lang === "ps" ? "قراردادي" : "قراردادی"}</option>
            <option value="equipment">{lang === "en" ? "Equipment" : lang === "ps" ? "تجهیزات" : "تجهیزات"}</option>
            <option value="supplies">{lang === "en" ? "Supplies" : lang === "ps" ? "سامان" : "تجهیزات"}</option>
          </Select>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 px-2 cursor-pointer">
            <input type="checkbox" checked={sortByPriority} onChange={(e) => setSortByPriority(e.target.checked)} />
            {lang === "en" ? "Sort by priority" : lang === "ps" ? "د لومړیتوب لخوا ترتیب" : "مرتب‌سازی بر اساس اولویت"}
          </label>
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>{lang === "en" ? "New order" : lang === "ps" ? "نوې سپارښتنه" : "سفارش جدید"}</Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <Button onClick={fetchOrders} variant="secondary" size="sm">
              {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
            </Button>
          </div>
        ) : paginatedData.length === 0 ? (
          <EmptyState icon="📦" title={lang === "en" ? "No orders found" : lang === "ps" ? "هیڅ سپارښتنه ونه موندل شوه" : "سفارشی یافت نشد"} />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Priority" : lang === "ps" ? "لومړیتوب" : "اولویت"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Order" : lang === "ps" ? "سپارښتنه" : "سفارش"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Office" : lang === "ps" ? "دفتر" : "دفتر"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Category" : lang === "ps" ? "کټګوري" : "دسته‌بندی"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Amount" : lang === "ps" ? "ارزښت" : "ارزش"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Required date" : lang === "ps" ? "اړینه نېټه" : "تاریخ مورد نیاز"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Status" : lang === "ps" ? "حالت" : "وضعیت"}</th>
                  <th className="text-left px-4 py-3 font-semibold">{lang === "en" ? "Actions" : lang === "ps" ? "عملونه" : "عملیات"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedData.map((o) => {
                  const company = data.companies.find((c) => String(c.id) === String(o.company_id));
                  const office = data.offices.find((off) => String(off.id) === String(o.office_id));
                  const overdue = new Date(o.required_date) < new Date() && o.status !== "completed";
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <Badge tone={PRIORITY_TONE[o.priority as keyof typeof PRIORITY_TONE]}>
                          {o.priority === "urgent" && "⚡ "}
                          {o.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{o.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{o.order_no} {company && `· ${company.name}`}</p>
                      </td>
                      <td className="px-4 py-3">
                        {office ? <Badge tone="slate">{office.name}</Badge> : <span className="text-slate-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={o.category === "retail" ? "violet" : o.category === "contract" ? "blue" : o.category === "equipment" ? "amber" : "green"}>
                          {o.category === "retail" ? (lang === "en" ? "Retail" : lang === "ps" ? "پرچون" : "خرده‌فروشی") : 
                           o.category === "contract" ? (lang === "en" ? "Contract" : lang === "ps" ? "قراردادي" : "قراردادی") :
                           o.category === "equipment" ? (lang === "en" ? "Equipment" : lang === "ps" ? "تجهیزات" : "تجهیزات") :
                           (lang === "en" ? "Supplies" : lang === "ps" ? "سامان" : "تجهیزات")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {Math.floor(o.amount).toLocaleString()} {o.currency}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-xs ${overdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}>
                          {new Date(o.required_date).toLocaleDateString()}
                          {overdue && " ⚠"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_LABEL[o.status as keyof typeof STATUS_LABEL]?.tone}>{lang === "en" ? STATUS_LABEL[o.status as keyof typeof STATUS_LABEL]?.en : lang === "ps" ? STATUS_LABEL[o.status as keyof typeof STATUS_LABEL]?.fa : STATUS_LABEL[o.status as keyof typeof STATUS_LABEL]?.fa}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(o)}>{lang === "en" ? "View" : lang === "ps" ? "لیدل" : "مشاهده"}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(o)}>{lang === "en" ? "Edit" : lang === "ps" ? "سمول" : "ویرایش"}</Button>
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
        <OrderForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (o) => {
            try {
              if (editing) {
                await ordersApi.update(editing.id, o);
                toast(lang === "en" ? "Order updated" : lang === "ps" ? "سپارښتنه ثبت شوه" : "سفارش به‌روز شد", "success");
              } else {
                await ordersApi.create(o);
                toast(lang === "en" ? "New order added" : lang === "ps" ? "نوې سپارښتنه اضافه شوه" : "سفارش جدید اضافه شد", "success");
              }
              await fetchOrders();
              setCreating(false); setEditing(null);
            } catch (error) {
              toast(lang === "en" ? "Error saving: " : lang === "ps" ? "خطا در ذخیره سازی: " : "خطا در ذخیره سازی: " + (error instanceof Error ? error.message : "Unknown error"), "error");
            }
          }}
        />
      )}

      {viewing && (
        <ViewOrder
          order={viewing}
          onClose={() => setViewing(null)}
          data={data}
        />
      )}
    </div>
  );
}

function OrderForm({ initial, onClose, onSave }: { initial?: ApiOrder; onClose: () => void; onSave: (o: Partial<ApiOrder>) => Promise<void> }) {
  const { data } = useApp();
  const [form, setForm] = useState<Partial<ApiOrder>>(
    initial ?? {
      order_no: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      title: "",
      company_id: null,
      office_id: null,
      category: "retail",
      priority: "medium",
      status: "pending",
      requested_date: new Date().toISOString().slice(0, 10),
      required_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      amount: 0,
      equipment: 0,
      items: 0,
      currency: "AFN",
      description: "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [itemsList, setItemsList] = useState<Array<{ id: number; name: string; quantity: number; unitPrice: number }>>(
    initial?.items_list || []
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.title?.trim()) err.title = "عنوان اړین دی";
    if (form.amount && form.amount < 0) err.amount = "اشتباه";
    if (Object.keys(err).length) { setErrors(err); return; }
    await onSave({ ...form, items_list: itemsList });
  }

  return (
    <Modal
      open onClose={onClose}
      title={initial ? "د سپارښتنې سمول" : "نوې سپارښتنه"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>کنسل</Button>
          <Button onClick={submit as never}>{initial ? "ثبت" : "اضافه"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="د سپارښتنې شمېره" required><Input value={form.order_no} onChange={(e) => setForm({ ...form, order_no: e.target.value })} /></Field>
        <Field label="کټګوري / Category" required>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as never })}>
            <option value="retail">پرچون اخیستل / Retail purchase</option>
            <option value="contract">قراردادي / Contract</option>
            <option value="equipment">تجهیزات / Equipment</option>
            <option value="supplies">سامان / Supplies</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="عنوان / Title" required error={errors.title}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} invalid={!!errors.title} />
          </Field>
        </div>
        <Field label="لومړیتوب / Priority" required>
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as never })}>
            <option value="urgent">⚡ بیړنی / Urgent</option>
            <option value="high">لوړ / High</option>
            <option value="medium">متوسط / Medium</option>
            <option value="low">ټیټ / Low</option>
          </Select>
        </Field>
        <Field label="حالت / Status" required>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as never })}>
            <option value="pending">په تمه</option>
            <option value="in_progress">په جریان کې</option>
            <option value="completed">بشپړ</option>
            <option value="incomplete">ناتمام</option>
          </Select>
        </Field>
        <Field label="شرکت / Company (optional)">
          <Select value={form.company_id ?? ""} onChange={(e) => setForm({ ...form, company_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">—</option>
            {data.companies.filter((c) => !c.blacklisted).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </Select>
        </Field>
        <Field label="دفتر / Office (optional)">
          <Select value={form.office_id ?? ""} onChange={(e) => setForm({ ...form, office_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">— انتخاب نشده —</option>
            {data.offices.map((office) => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="ارزښت / Amount" error={errors.amount}>
          <Input type="number" min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} invalid={!!errors.amount} />
        </Field>
        <Field label="تجهیزات / Equipment">
          <Input type="number" min={0} value={form.equipment || ""} onChange={(e) => setForm({ ...form, equipment: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="اقلام / Items">
          <div className="flex gap-2">
            <Input type="number" min={0} value={form.items || ""} onChange={(e) => setForm({ ...form, items: Number(e.target.value) || 0 })} />
            <Button type="button" variant="secondary" onClick={() => setShowItemsModal(true)}>+</Button>
          </div>
          {itemsList.length > 0 && (
            <div className="mt-2 space-y-1">
              {itemsList.map((item, index) => (
                <div key={item.id} className="text-xs text-slate-600 dark:text-slate-400">
                  Item {index + 1}: {item.name} (Qty: {item.quantity}, Price: {item.unitPrice})
                </div>
              ))}
            </div>
          )}
        </Field>
        <Field label="د ارزښت واحد / Currency" required>
          <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as "AFN" | "USD" | "EUR" })}>
            <option value="AFN">افغانۍ / Afghan Afghani (AFN)</option>
            <option value="USD">د امریکا ډالر / US Dollar (USD)</option>
            <option value="EUR">یورو / Euro (EUR)</option>
          </Select>
        </Field>
        <Field label="د غوښتنې نېټه"><Input type="date" value={form.requested_date} onChange={(e) => setForm({ ...form, requested_date: e.target.value })} /></Field>
        <Field label="د اړتیا نېټه"><Input type="date" value={form.required_date} onChange={(e) => setForm({ ...form, required_date: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <Field label="شرحه">
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </form>
      
      {/* Items Modal */}
      {showItemsModal && (
        <Modal
          open
          onClose={() => setShowItemsModal(false)}
          title="Add Items"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowItemsModal(false)}>Cancel</Button>
              <Button onClick={() => {
                setForm({ ...form, items: itemsList.length });
                setShowItemsModal(false);
              }}>Save Items</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Input placeholder="Item Name" id="itemName" />
              <Input type="number" placeholder="Quantity" id="itemQty" />
              <Input type="number" placeholder="Unit Price" id="itemPrice" />
            </div>
            <Button onClick={() => {
              const name = (document.getElementById('itemName') as HTMLInputElement)?.value || '';
              const qty = Number((document.getElementById('itemQty') as HTMLInputElement)?.value) || 0;
              const price = Number((document.getElementById('itemPrice') as HTMLInputElement)?.value) || 0;
              if (name) {
                setItemsList([...itemsList, { id: Date.now(), name, quantity: qty, unitPrice: price }]);
                (document.getElementById('itemName') as HTMLInputElement).value = '';
                (document.getElementById('itemQty') as HTMLInputElement).value = '';
                (document.getElementById('itemPrice') as HTMLInputElement).value = '';
              }
            }}>Add Item</Button>
            
            {itemsList.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Added Items:</h4>
                <div className="space-y-2">
                  {itemsList.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <span>Item {index + 1}: {item.name} (Qty: {item.quantity}, Price: {item.unitPrice})</span>
                      <Button size="sm" variant="ghost" onClick={() => setItemsList(itemsList.filter(i => i.id !== item.id))}>×</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function ViewOrder({ order, onClose, data }: { order: ApiOrder; onClose: () => void; data: any }) {
  const company = data.companies.find((c: any) => c.id === order.company_id);
  
  const handlePrint = () => {
    const printContent = `
      <html dir="rtl">
      <head>
        <title>سند سفارش تدارکات - ${order.order_no}</title>
        <style>
          body { font-family: 'Tahoma', sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: right; }
          th { background-color: #f0f0f0; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>سند سفارش تدارکات</h2>
          <p>شماره سفارش: ${order.order_no}</p>
          <p>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</p>
        </div>
        <div class="section">
          <p><span class="label">عنوان:</span> ${order.title}</p>
          <p><span class="label">کټګوري:</span> ${order.category === 'retail' ? 'پرچون' : order.category === 'contract' ? 'قراردادي' : order.category === 'equipment' ? 'تجهیزات' : 'سامان'}</p>
          <p><span class="label">لومړیتوب:</span> ${order.priority}</p>
          <p><span class="label">حالت:</span> ${order.status}</p>
          <p><span class="label">دفتر:</span> ${data.offices.find((o: any) => o.id === order.office_id)?.name || '—'}</p>
          <p><span class="label">شرکت:</span> ${company?.name || '—'}</p>
        </div>
        <div class="section">
          <h3>معلومات مالی</h3>
          <p><span class="label">ارزش کل:</span> ${Math.floor(order.amount).toLocaleString()} ${order.currency}</p>
          <p><span class="label">تجهیزات:</span> ${Math.floor(order.equipment || 0)}</p>
          <p><span class="label">اقلام:</span> ${Math.floor(order.items || 0)}</p>
        </div>
        <div class="section">
          <h3>نیټې</h3>
          <p><span class="label">د غوښتنې نېټه:</span> ${order.requested_date}</p>
          <p><span class="label">د اړتیا نېټه:</span> ${order.required_date}</p>
        </div>
        <div class="section">
          <h3>شرحه</h3>
          <p>${order.description || '—'}</p>
        </div>
        <div class="footer">
          <p>این سند به صورت خودکار توسط سیستم تدارکات کابل دانشگاه تولید شده است.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Modal
      open onClose={onClose}
      title={`مشاهده سفارش - ${order.order_no}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>بستن</Button>
          <Button onClick={handlePrint}>چاپ</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">شماره سفارش</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{order.order_no}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">کټګوري</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {order.category === 'retail' ? 'پرچون' : order.category === 'contract' ? 'قراردادي' : order.category === 'equipment' ? 'تجهیزات' : 'سامان'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">عنوان</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{order.title}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">لومړیتوب</p>
            <Badge tone={order.priority === 'urgent' ? 'red' : order.priority === 'high' ? 'amber' : order.priority === 'medium' ? 'blue' : 'slate'}>
              {order.priority}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">حالت</p>
            <Badge tone={order.status === 'completed' ? 'green' : order.status === 'in_progress' ? 'blue' : order.status === 'pending' ? 'amber' : 'slate'}>
              {order.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">دفتر</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{data.offices.find((o: any) => o.id === order.office_id)?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">شرکت</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{company?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">ارزش کل</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{Math.floor(order.amount).toLocaleString()} {order.currency}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">تجهیزات</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{Math.floor(order.equipment || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">اقلام</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{Math.floor(order.items || 0)}</p>
          </div>
        </div>

        {/* Items List Section */}
        {order.items_list && order.items_list.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Items Details / تفصیل اقلام</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-right">شماره</th>
                    <th className="px-4 py-3 font-semibold text-right">اسم جنس</th>
                    <th className="px-4 py-3 font-semibold text-right">مقدار</th>
                    <th className="px-4 py-3 font-semibold text-right">قیمت فی واحد</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items_list.map((item, index) => (
                    <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{item.unitPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">د غوښتنې نېټه</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{order.requested_date}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">د اړتیا نېټه</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{order.required_date}</p>
          </div>
        </div>
        
        {order.description && (
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">شرحه</p>
            <p className="text-slate-900 dark:text-slate-100">{order.description}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}