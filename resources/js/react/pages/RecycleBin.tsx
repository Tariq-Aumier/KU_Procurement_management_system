import { useState, useEffect } from "react";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../contexts/I18nContext";
import { Button, Card } from "../components/ui";
import { trashedApi, type TrashedItem as ApiTrashedItem } from "../api/trashed";

type DeletedItem = {
  id: number;
  type: string;
  resource: string;
  name: string;
  deletedAt: string;
  deletedBy: string;
  originalData: ApiTrashedItem;
};

const TYPE_LABELS: Record<string, { fa: string; ps: string; en: string }> = {
  users: { fa: "کاربر / User", ps: "کاروونکی / User", en: "User" },
  companies: { fa: "شرکت / Company", ps: "شرکت / Company", en: "Company" },
  contracts: { fa: "قرارداد / Contract", ps: "قرارداد / Contract", en: "Contract" },
  'procurement-orders': { fa: "سفارش / Order", ps: "سفارش / Order", en: "Order" },
  vendors: { fa: "فروشنده / Vendor", ps: "وېنډر / Vendor", en: "Vendor" },
  'inventory-items': { fa: "موجودی انبار / Inventory", ps: "موجودی انبار / Inventory", en: "Inventory" },
  'office-categories': { fa: "دسته‌بندی دفتر / Office Category", ps: "دسته دفتر / Office Category", en: "Office Category" },
  offices: { fa: "دفتر / Office", ps: "دفتر / Office", en: "Office" },
  'inventory-locations': { fa: "مکان انبار / Inventory Location", ps: "مکان انبار / Inventory Location", en: "Inventory Location" },
  'procurement-forms-rfq': { fa: "فرم درخواست قیمت / RFQ Form", ps: "فرم درخواست قیمت / RFQ Form", en: "RFQ Form" },
  'procurement-forms-m2': { fa: "فرم م-2 / M2 Form", ps: "فرم م-2 / M2 Form", en: "M2 Form" },
  'procurement-forms-evaluation': { fa: "فرم ارزیابی / Evaluation Form", ps: "فرم ارزیابی / Evaluation Form", en: "Evaluation Form" },
};

const TYPE_ICONS: Record<string, string> = {
  users: "👤",
  companies: "🏢",
  contracts: "📑",
  'procurement-orders': "📦",
  vendors: "🤝",
  'inventory-items': "📦",
  'office-categories': "📁",
  offices: "🏢",
  'inventory-locations': "📍",
  'procurement-forms-rfq': "📋",
  'procurement-forms-m2': "📝",
  'procurement-forms-evaluation': "📊",
};

export default function RecycleBin() {
  const { toast } = useToast();
  const { lang } = useI18n();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const RESOURCES = ['users', 'companies', 'contracts', 'procurement-orders', 'vendors', 'inventory-items', 'office-categories', 'offices', 'inventory-locations', 'procurement-forms-rfq', 'procurement-forms-m2', 'procurement-forms-evaluation'];

  // Fetch deleted items from backend
  const fetchDeletedItems = async () => {
    setLoading(true);
    const items: DeletedItem[] = [];

    for (const resource of RESOURCES) {
      try {
        let result: ApiTrashedItem[];
        
        // Special handling for procurement forms
        if (resource.startsWith('procurement-forms-')) {
          const formType = resource.replace('procurement-forms-', '');
          result = await trashedApi.listProcurementForm(formType);
        } else {
          result = await trashedApi.list(resource);
        }
        
        result.forEach((item: ApiTrashedItem) => {
          const name = getNameForItem(resource, item);
          items.push({
            id: item.id,
            type: resource,
            resource: resource,
            name: name,
            deletedAt: item.deleted_at,
            deletedBy: "System",
            originalData: item,
          });
        });
      } catch (error) {
        // Skip resources that don't support trashed or have errors
      }
    }

    setDeletedItems(items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const getNameForItem = (resource: string, item: any): string => {
    switch (resource) {
      case 'users': return item.name || item.username;
      case 'companies': return item.legal_name || item.name;
      case 'contracts': return item.title;
      case 'procurement-orders': return item.title;
      case 'vendors': return item.vendor_name || item.account_no;
      case 'inventory-items': return item.name;
      case 'office-categories': return item.name;
      case 'offices': return item.name;
      case 'inventory-locations': return item.name;
      case 'procurement-forms-rfq': return item.number || item.id;
      case 'procurement-forms-m2': return item.sequence_number || item.id;
      case 'procurement-forms-evaluation': return item.reference_number || item.title || item.id;
      default: return item.name || item.id;
    }
  };

  const filteredItems = selectedType === "all" 
    ? deletedItems 
    : deletedItems.filter(item => item.type === selectedType);

  const handleRestore = async (item: DeletedItem) => {
    try {
      // Special handling for procurement forms
      if (item.resource.startsWith('procurement-forms-')) {
        const formType = item.resource.replace('procurement-forms-', '');
        await trashedApi.restoreProcurementForm(formType, item.id);
      } else {
        await trashedApi.restore(item.resource, item.id);
      }
      toast(`${item.name} restored successfully`, "success");
      await fetchDeletedItems();
    } catch (error) {
      toast(`Failed to restore ${item.name}`, "error");
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    if (confirm(`Are you sure you want to permanently delete ${item.name}? This action cannot be undone.`)) {
      try {
        // Special handling for procurement forms
        if (item.resource.startsWith('procurement-forms-')) {
          const formType = item.resource.replace('procurement-forms-', '');
          await trashedApi.forceDeleteProcurementForm(formType, item.id);
        } else {
          await trashedApi.forceDelete(item.resource, item.id);
        }
        toast(`${item.name} permanently deleted`, "success");
        await fetchDeletedItems();
      } catch (error) {
        toast(`Failed to permanently delete ${item.name}`, "error");
      }
    }
  };

  const uniqueTypes = [...new Set(deletedItems.map(item => item.type))];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lang === "en" ? "Recycle Bin" : lang === "ps" ? "سطل زباله" : "سطل زباله"}</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={fetchDeletedItems}
            disabled={loading}
          >
            🔄 {lang === "en" ? "Refresh" : lang === "ps" ? "تازه کول" : "تازه کردن"}
          </Button>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">{lang === "en" ? "All Types" : lang === "ps" ? "ټول ډولونه" : "همه انواع"}</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{TYPE_LABELS[type]?.[lang] || type}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🗑️</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{lang === "en" ? "Recycle bin is empty" : lang === "ps" ? "سطل زباله خالی دی" : "سطل زباله خالی است"}</h2>
          <p className="text-slate-600 dark:text-slate-400">{lang === "en" ? "The recycle bin is empty" : lang === "ps" ? "سطل زباله خالی دی" : "سطل زباله خالی است"}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={`${item.type}-${item.id}`} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-3xl">{TYPE_ICONS[item.type] || "📄"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                        {TYPE_LABELS[item.type]?.[lang] || item.type}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h3>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <span>{lang === "en" ? `Deleted on: ${new Date(item.deletedAt).toLocaleDateString()}` : lang === "ps" ? `حذف شو: ${new Date(item.deletedAt).toLocaleDateString()}` : `حذف شده در: ${new Date(item.deletedAt).toLocaleDateString()}`}</span>
                      <span className="mx-2">•</span>
                      <span>{lang === "en" ? `By: ${item.deletedBy}` : lang === "ps" ? `لخوا: ${item.deletedBy}` : `توسط: ${item.deletedBy}`}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRestore(item)}
                    className="text-green-600 hover:text-green-700"
                  >
                    {lang === "en" ? "Restore" : lang === "ps" ? "بیا رغول" : "بازیابی"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePermanentDelete(item)}
                    className="text-red-600 hover:text-red-700"
                  >
                    {lang === "en" ? "Delete Permanently" : lang === "ps" ? "دایمي حذف" : "حذف دائمی"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
