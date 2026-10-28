import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useI18n } from "../contexts/I18nContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select, Textarea } from "../components/ui";
import type { InventoryItemType } from "../types";
import { inventoryItemsApi, type InventoryItem as ApiInventoryItem } from "../api/inventoryItems";

const TYPE_TONES: Record<InventoryItemType, "blue" | "violet" | "amber" | "green"> = {
  sample: "violet",
  equipment: "blue",
  supply: "amber",
  asset: "green",
};

const STATUS_TONES = {
  in_stock: "green",
  low_stock: "amber",
  out_of_stock: "red",
} as const;

export default function Inventory() {
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const [inventoryItems, setInventoryItems] = useState<ApiInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  const [viewing, setViewing] = useState<ApiInventoryItem | null>(null);
  const [editing, setEditing] = useState<ApiInventoryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch inventory items
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await inventoryItemsApi.list();
      setInventoryItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (filterType !== "all" && item.item_type !== filterType) return false;
      if (filterStatus !== "all") {
        const status = getItemStatus(item);
        if (status !== filterStatus) return false;
      }
      if (q) {
        const s = q.toLowerCase();
        if (!item.name.toLowerCase().includes(s) && !item.code.toLowerCase().includes(s) && !item.category.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
  }, [inventoryItems, q, filterType, filterStatus]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterType, filterStatus]);

  const stats = useMemo(() => {
    const total = inventoryItems.length;
    const samples = inventoryItems.filter((i) => i.item_type === "sample").length;
    const lowStock = inventoryItems.filter((i) => getItemStatus(i) === "low_stock").length;
    const outOfStock = inventoryItems.filter((i) => getItemStatus(i) === "out_of_stock").length;
    return { total, samples, lowStock, outOfStock };
  }, [inventoryItems]);

  function getItemStatus(item: ApiInventoryItem): "in_stock" | "low_stock" | "out_of_stock" {
    if (item.min_stock === 0) return "in_stock";
    if (item.min_stock === undefined) return "in_stock";
    if (item.min_stock <= 0) return "in_stock";
    return "low_stock";
  }

  function getStatusLabel(status: "in_stock" | "low_stock" | "out_of_stock"): string {
    if (status === "in_stock") return t.inStock;
    if (status === "low_stock") return t.lowStock;
    return t.outOfStock;
  }

  const typeOptions = [
    { value: "sample", label: t.samples },
    { value: "equipment", label: lang === "en" ? "Equipment" : lang === "ps" ? "تجهیزات" : "تجهیزات" },
    { value: "supply", label: lang === "en" ? "Supply" : lang === "ps" ? "تمویل" : "تدارک" },
    { value: "asset", label: lang === "en" ? "Asset" : lang === "ps" ? "شتمني" : "دارایی" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-xs opacity-90">{t.items}</p>
          <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
          <p className="text-xs opacity-90">{t.samples}</p>
          <p className="text-2xl font-bold tabular-nums">{stats.samples}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <p className="text-xs opacity-90">{t.lowStock}</p>
          <p className="text-2xl font-bold tabular-nums">{stats.lowStock}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <p className="text-xs opacity-90">{t.outOfStock}</p>
          <p className="text-2xl font-bold tabular-nums">{stats.outOfStock}</p>
        </Card>
      </div>

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
        <>
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder={`🔍 ${t.search}...`} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[200px]" />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value as never)}>
            <option value="all">{t.category}</option>
            {typeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as never)}>
            <option value="all">{t.status}</option>
            <option value="in_stock">{t.inStock}</option>
            <option value="low_stock">{t.lowStock}</option>
            <option value="out_of_stock">{t.outOfStock}</option>
          </Select>
          <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>{t.addItem}</Button>
        </div>
      </Card>

      {/* Items Table */}
      <Card>
        {paginatedData.length === 0 ? (
          <EmptyState icon="📦" title={t.noData} />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase">
                <tr>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">{t.code}</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">{t.name}</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">{t.type}</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">{t.category}</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">{t.unit}</th>
                  <th className="text-left pl-12 pr-4 py-3 font-semibold">{t.status}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((item) => {
                  const status = getItemStatus(item);
                  const typeLabel = typeOptions.find((o) => o.value === item.item_type)?.label || item.item_type;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="pl-12 pr-4 py-3"><Badge tone="slate">{item.code}</Badge></td>
                      <td className="pl-12 pr-4 py-3">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.description || ""}</p>
                      </td>
                      <td className="pl-12 pr-4 py-3"><Badge tone={TYPE_TONES[item.item_type as keyof typeof TYPE_TONES] || "blue"}>{typeLabel}</Badge></td>
                      <td className="pl-12 pr-4 py-3 text-slate-600">{item.category}</td>
                      <td className="pl-12 pr-4 py-3 text-slate-600">{item.unit}</td>
                      <td className="pl-12 pr-4 py-3"><Badge tone={STATUS_TONES[status]}>{getStatusLabel(status)}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(item)}>{lang === "en" ? "View" : lang === "ps" ? "کتل" : "مشاهده"}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(item)}>{t.edit}</Button>
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

      {/* Modals */}
      {viewing && <ItemDetailsModal item={viewing} onClose={() => setViewing(null)} />}
      {(creating || editing) && (
        <ItemForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (item) => {
            try {
              if (editing) {
                await inventoryItemsApi.update(editing.id, item);
                toast(t.save, "success");
              } else {
                await inventoryItemsApi.create(item);
                toast(t.add, "success");
              }
              await fetchData();
              setCreating(false); setEditing(null);
            } catch (err) {
              toast("Error saving item", "error");
            }
          }}
        />
      )}
        </>
      )}
    </div>
  );
}

function ItemForm({ initial, onClose, onSave }: { initial?: ApiInventoryItem; onClose: () => void; onSave: (i: Partial<ApiInventoryItem>) => Promise<void> }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<Partial<ApiInventoryItem>>(
    initial ?? {
      code: `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: "",
      item_type: "sample",
      category: "",
      description: "",
      unit: lang === "en" ? "pcs" : lang === "ps" ? "عدد" : "عدد",
      min_stock: 10,
      max_stock: 100,
      reorder_point: 15,
      inventory_location_id: 1,
      condition: "new",
      currency: "AFN",
    }
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ ...form });
  }

  const typeOptions = [
    { value: "sample", label: t.samples },
    { value: "equipment", label: lang === "en" ? "Equipment" : lang === "ps" ? "تجهیزات" : "تجهیزات" },
    { value: "supply", label: lang === "en" ? "Supply" : lang === "ps" ? "تمویل" : "تدارک" },
    { value: "asset", label: lang === "en" ? "Asset" : lang === "ps" ? "شتمې" : "دارایی" },
  ];

  return (
    <Modal open onClose={onClose} title={initial ? t.editItem : t.addItem} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>{t.cancel}</Button><Button onClick={submit as never}>{t.save}</Button></>}
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t.code} required><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
        <Field label={t.type} required>
          <Select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })}>
            {typeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={t.name} required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        </div>
        <Field label={t.category} required><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
        <Field label={t.unit} required><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
        <Field label={t.minStock}><Input type="number" min={0} value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} /></Field>
        <Field label={t.maxStock}><Input type="number" min={0} value={form.max_stock} onChange={(e) => setForm({ ...form, max_stock: Number(e.target.value) })} /></Field>
        <Field label={t.batchNumber}><Input value={form.batch_number ?? ""} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} /></Field>
        <Field label={t.serialNumber}><Input value={form.serial_number ?? ""} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></Field>
        <Field label="Condition" required>
          <Select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="damaged">Damaged</option>
            <option value="returned">Returned</option>
            <option value="disposed">Disposed</option>
          </Select>
        </Field>
        <Field label="Currency" required>
          <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option value="AFN">AFN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </Select>
        </Field>
        <Field label="Unit Cost"><Input type="number" min={0} value={form.unit_cost ?? ""} onChange={(e) => setForm({ ...form, unit_cost: e.target.value ? Number(e.target.value) : undefined })} /></Field>
        <div className="sm:col-span-2">
          <Field label={t.description}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
      </form>
    </Modal>
  );
}

function ItemDetailsModal({ item, onClose }: { item: ApiInventoryItem; onClose: () => void }) {
  const { t } = useI18n();
  
  return (
    <Modal open onClose={onClose} title={t.itemDetails} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-500">{t.code}</p><p className="font-semibold">{item.code}</p></div>
          <div><p className="text-xs text-slate-500">{t.name}</p><p className="font-semibold">{item.name}</p></div>
          <div><p className="text-xs text-slate-500">{t.type}</p><p><Badge tone="violet">{item.item_type}</Badge></p></div>
          <div><p className="text-xs text-slate-500">{t.category}</p><p>{item.category}</p></div>
          <div><p className="text-xs text-slate-500">{t.unit}</p><p>{item.unit}</p></div>
          <div><p className="text-xs text-slate-500">Condition</p><p>{item.condition}</p></div>
          <div><p className="text-xs text-slate-500">Min Stock</p><p>{item.min_stock}</p></div>
          <div><p className="text-xs text-slate-500">Max Stock</p><p>{item.max_stock ?? "—"}</p></div>
          <div><p className="text-xs text-slate-500">Reorder Point</p><p>{item.reorder_point}</p></div>
          <div><p className="text-xs text-slate-500">Currency</p><p>{item.currency}</p></div>
          <div><p className="text-xs text-slate-500">Unit Cost</p><p>{item.unit_cost ?? "—"}</p></div>
          <div><p className="text-xs text-slate-500">Batch Number</p><p>{item.batch_number ?? "—"}</p></div>
          <div><p className="text-xs text-slate-500">Serial Number</p><p>{item.serial_number ?? "—"}</p></div>
          <div><p className="text-xs text-slate-500">Received Date</p><p>{item.received_date ?? "—"}</p></div>
          <div><p className="text-xs text-slate-500">Expiry Date</p><p>{item.expiry_date ?? "—"}</p></div>
        </div>
        {item.description && (
          <div className="border-t pt-4">
            <p className="text-xs text-slate-500">{t.description}</p>
            <p>{item.description}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
