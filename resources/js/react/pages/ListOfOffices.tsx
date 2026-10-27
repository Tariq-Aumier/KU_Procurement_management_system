import { useState, useEffect, useMemo } from "react";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../contexts/I18nContext";
import { Button, Input, Modal, Badge, Card } from "../components/ui";
import { officeCategoriesApi, type OfficeCategory as ApiOfficeCategory } from "../api/officeCategories";
import { officesApi, type Office as ApiOffice } from "../api/offices";

const CURRENCY_SYMBOLS: Record<string, string> = {
  AFN: "؋",
  USD: "$",
  EUR: "€",
};

const getCurrencySymbol = (currency?: string) => CURRENCY_SYMBOLS[currency || "AFN"] || currency || "؋";

type Period = "week" | "month" | "year";

export default function ListOfOffices() {
    const { toast } = useToast();
    const { lang } = useI18n();

    const [officeCategories, setOfficeCategories] = useState<ApiOfficeCategory[]>([]);
    const [offices, setOffices] = useState<ApiOffice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [period, setPeriod] = useState<Period>("month");
    const [procurementStats, setProcurementStats] = useState<Record<number, { total_value: number; total_items: number; total_equipment: number; order_count: number }>>({});

    // ----- Modal for viewing items per office -----
    const [selectedOffice, setSelectedOffice] = useState<ApiOffice | null>(null);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [officeOrders, setOfficeOrders] = useState<any[]>([]);

    // ----- Category & Office CRUD -----
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<ApiOfficeCategory | null>(null);
    const [renameCategoryValue, setRenameCategoryValue] = useState("");
    const [showAddOffice, setShowAddOffice] = useState(false);
    const [newOfficeName, setNewOfficeName] = useState("");
    const [newOfficeNamePs, setNewOfficeNamePs] = useState("");
    const [newOfficeNameFa, setNewOfficeNameFa] = useState("");
    const [editingOffice, setEditingOffice] = useState<ApiOffice | null>(null);
    const [editOfficeValue, setEditOfficeValue] = useState("");
    const [editOfficeValuePs, setEditOfficeValuePs] = useState("");
    const [editOfficeValueFa, setEditOfficeValueFa] = useState("");
    const [editOfficeDescription, setEditOfficeDescription] = useState("");

    // Fetch office categories and offices
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [categoriesData, officesData] = await Promise.all([
                officeCategoriesApi.list(),
                officesApi.list()
            ]);
            setOfficeCategories(categoriesData);
            setOffices(officesData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
            console.error('Data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Group offices by category for display
    const officeData = useMemo(() => {
        const grouped: Record<string, ApiOffice[]> = {};
        officeCategories.forEach((cat) => {
            grouped[cat.name] = offices.filter((o) => o.office_category_id === cat.id);
        });
        return grouped;
    }, [officeCategories, offices]);

    // Fetch procurement statistics for all offices (all time, not period-specific)
    useEffect(() => {
        const fetchProcurementStats = async () => {
            const API_URL = "/api/v1";
            const token = sessionStorage.getItem("pms_access_token");
            
            const stats: Record<number, { total_value: number; total_items: number; total_equipment: number; order_count: number }> = {};
            
            for (const office of offices) {
                try {
                    const response = await fetch(`${API_URL}/offices/${office.id}/statistics`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    });
                    if (response.ok) {
                        const result = await response.json();
                        // Validate and sanitize data
                        if (result.data && typeof result.data === 'object') {
                            stats[office.id] = {
                                total_value: Number(result.data.total_value) || 0,
                                total_items: Number(result.data.total_items) || 0,
                                total_equipment: Number(result.data.total_equipment) || 0,
                                order_count: Number(result.data.order_count) || 0,
                            };
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching stats for office ${office.id}:`, error);
                }
            }
            
            setProcurementStats(stats);
        };

        if (offices.length > 0) {
            fetchProcurementStats();
        }
    }, [offices]);

    const addCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) { toast(lang === "en" ? "Category name cannot be empty" : lang === "ps" ? "دسته نوم خالی نشی کولی" : "نام دسته نمی‌تواند خالی باشد", "error"); return; }
        if (officeCategories.some((c) => c.name === trimmed)) { toast(lang === "en" ? "This category already exists" : lang === "ps" ? "دا دسته دمخه شته" : "این دسته قبلاً وجود دارد", "error"); return; }
        
        try {
            await officeCategoriesApi.create({
                name: trimmed,
                code: trimmed.substring(0, 10).toUpperCase(),
            });
            setNewCategoryName("");
            setShowAddCategory(false);
            await fetchData();
            toast(lang === "en" ? `Category "${trimmed}" added` : lang === "ps" ? `دسته "${trimmed}" اضافه شوه` : `دسته "${trimmed}" اضافه شد`, "success");
        } catch (error) {
            toast(lang === "en" ? "Error adding category" : lang === "ps" ? "په اضافه کولو کې تېروتنه" : "خطا در افزودن دسته", "error");
        }
    };

    const deleteCategory = async (category: ApiOfficeCategory) => {
        if (!confirm(lang === "en" ? `Are you sure you want to delete category "${category.name}"?` : lang === "ps" ? `آیا تاسو غواړئ دسته "${category.name}" حذف کړئ؟` : `آیا از حذف دسته "${category.name}" مطمئن هستید؟`)) return;
        
        try {
            await officeCategoriesApi.delete(category.id);
            if (selectedCategory === category.id) setSelectedCategory(null);
            await fetchData();
            toast(lang === "en" ? `Category "${category.name}" deleted` : lang === "ps" ? `دسته "${category.name}" حذف شوه` : `دسته "${category.name}" حذف شد`, "info");
        } catch (error) {
            toast(lang === "en" ? "Error deleting category" : lang === "ps" ? "په حذف کولو کې تېروتنه" : "خطا در حذف دسته", "error");
        }
    };

    const renameCategory = async () => {
        const trimmed = renameCategoryValue.trim();
        if (!trimmed) { toast(lang === "en" ? "Category name cannot be empty" : lang === "ps" ? "دسته نوم خالی نشی کولی" : "نام دسته نمی‌تواند خالی باشد", "error"); return; }
        if (editingCategory && trimmed !== editingCategory.name && officeCategories.some((c) => c.name === trimmed)) {
            toast(lang === "en" ? "This name is already in use" : lang === "ps" ? "دا نوم دمخه کارول شوی" : "این نام قبلاً استفاده شده است", "error");
            return;
        }
        if (editingCategory) {
            try {
                await officeCategoriesApi.update(editingCategory.id, { name: trimmed });
                if (selectedCategory === editingCategory.id) setSelectedCategory(null);
                toast(lang === "en" ? `Category renamed to "${trimmed}"` : lang === "ps" ? `دسته ته "${trimmed}" بدلون شو` : `دسته به "${trimmed}" تغییر یافت`, "success");
                setEditingCategory(null);
                setRenameCategoryValue("");
                await fetchData();
            } catch (error) {
                toast(lang === "en" ? "Error renaming category" : lang === "ps" ? "په بدلون کولو کې تېروتنه" : "خطا در تغییر نام دسته", "error");
            }
        }
    };

    const addOffice = async () => {
        const trimmed = newOfficeName.trim();
        if (!trimmed) { toast(lang === "en" ? "Office name cannot be empty" : lang === "ps" ? "دفتر نوم خالی نشی کولی" : "نام دفتر نمی‌تواند خالی باشد", "error"); return; }
        if (!selectedCategory) return;
        
        if (offices.some((o) => o.office_category_id === selectedCategory && o.name === trimmed)) {
            toast(lang === "en" ? "This office already exists in this category" : lang === "ps" ? "دا دفتر دمخه په دا دسته کې شته" : "این دفتر قبلاً در این دسته وجود دارد", "error");
            return;
        }
        
        try {
            await officesApi.create({
                office_category_id: selectedCategory,
                code: trimmed.substring(0, 10).toUpperCase(),
                name: trimmed,
                name_ps: newOfficeNamePs || trimmed,
                name_fa: newOfficeNameFa || trimmed,
                active: true,
            });
            setNewOfficeName("");
            setNewOfficeNamePs("");
            setNewOfficeNameFa("");
            setShowAddOffice(false);
            await fetchData();
            toast(lang === "en" ? `Office "${trimmed}" added` : lang === "ps" ? `دفتر "${trimmed}" اضافه شو` : `دفتر "${trimmed}" اضافه شد`, "success");
        } catch (error) {
            toast(lang === "en" ? "Error adding office" : lang === "ps" ? "په اضافه کولو کې تېروتنه" : "خطا در افزودن دفتر", "error");
        }
    };

    const handleDeleteOffice = async (office: ApiOffice) => {
        if (!confirm(lang === "en" ? `Are you sure you want to delete office "${office.name}"?` : lang === "ps" ? `آیا تاسو غواړئ دفتر "${office.name}" حذف کړئ؟` : `آیا از حذف دفتر "${office.name}" مطمئن هستید؟`)) return;
        
        try {
            await officesApi.delete(office.id);
            await fetchData();
            toast(lang === "en" ? `Office "${office.name}" deleted` : lang === "ps" ? `دفتر "${office.name}" حذف شو` : `دفتر "${office.name}" حذف شد`, "info");
        } catch (error) {
            toast(lang === "en" ? "Error deleting office" : lang === "ps" ? "په حذف کولو کې تېروتنه" : "خطا در حذف دفتر", "error");
        }
    };

    const editOffice = async () => {
        const trimmed = editOfficeValue.trim();
        if (!trimmed) { toast(lang === "en" ? "Office name cannot be empty" : lang === "ps" ? "دفتر نوم خالی نشی کولی" : "نام دفتر نمی‌تواند خالی باشد", "error"); return; }
        if (!editingOffice) return;
        
        if (trimmed !== editingOffice.name && offices.some((o) => o.office_category_id === editingOffice.office_category_id && o.name === trimmed)) {
            toast(lang === "en" ? "This name already exists in this category" : lang === "ps" ? "دا نوم دمخه په دا دسته کې شته" : "این نام قبلاً در این دسته وجود دارد", "error");
            return;
        }
        
        try {
            await officesApi.update(editingOffice.id, {
                name: trimmed,
                name_ps: editOfficeValuePs || trimmed,
                name_fa: editOfficeValueFa || trimmed,
                description: editOfficeDescription,
            });
            toast(lang === "en" ? `Office renamed to "${trimmed}"` : lang === "ps" ? `دفتر ته "${trimmed}" بدلون شو` : `دفتر به "${trimmed}" تغییر یافت`, "success");
            setEditingOffice(null);
            setEditOfficeValue("");
            setEditOfficeValuePs("");
            setEditOfficeValueFa("");
            setEditOfficeDescription("");
            await fetchData();
        } catch (error) {
            toast(lang === "en" ? "Error updating office" : lang === "ps" ? "په بدلون کولو کې تېروتنه" : "خطا در ویرایش دفتر", "error");
        }
    };

    // ----- Statistics & Dashboard -----
    // Calculate totals from procurement statistics (all time)
    const totalOffices = offices.length;
    const totalEquipment = Math.floor(Object.values(procurementStats).reduce((acc, s) => acc + (Number(s.total_equipment) || 0), 0));
    const totalValue = Object.values(procurementStats).reduce((acc, s) => acc + (Number(s.total_value) || 0), 0);
    const primaryCurrency = "AFN"; // Default currency for office statistics

    // Fetch orders for a specific office
    const fetchOfficeOrders = async (officeId: number) => {
        const API_URL = "/api/v1";
        const token = sessionStorage.getItem("pms_access_token");
        
        try {
            const response = await fetch(`${API_URL}/orders?office_id=${officeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            if (response.ok) {
                const result = await response.json();
                setOfficeOrders(result.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch office orders:", error);
            setOfficeOrders([]);
        }
    };

    const currentCategory = officeCategories.find((c) => c.id === selectedCategory);
    const currentOffices = currentCategory ? officeData[currentCategory.name] || [] : [];
    const filteredOffices = currentOffices.filter((office) =>
        office.name.toLowerCase().includes(search.toLowerCase()) ||
        (office.name_ps && office.name_ps.toLowerCase().includes(search.toLowerCase())) ||
        (office.name_fa && office.name_fa.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6" dir="rtl">
            {/* --- Title and Actions --- */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lang === "en" ? "Kabul University Office List" : lang === "ps" ? "لست ادارات پوهنتون کابل" : "لیست ادارات دانشگاه کابل"}</h1>
                <Button onClick={() => setShowAddCategory(true)}>{lang === "en" ? "➕ New Category" : lang === "ps" ? "➕ نوی دسته" : "➕ دسته جدید"}</Button>
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
            {/* --- Statistics Dashboard --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Total Offices" : lang === "ps" ? "مجموع ادارات" : "مجموع ادارات"}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalOffices}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Equipment & Supplies" : lang === "ps" ? "تجهیزات و سامان" : "تجهیزات و سامان"}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums break-all">{totalEquipment.toLocaleString()}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Total Value" : lang === "ps" ? "ارزش کل" : "ارزش کل"}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums break-all">{isNaN(totalValue) ? "0" : Math.floor(totalValue).toLocaleString()} {getCurrencySymbol(primaryCurrency)}</p>
                </Card>
                <Card className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{lang === "en" ? "Period" : lang === "ps" ? "دوره" : "دوره"}</p>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as Period)}
                            className="mt-1 border rounded px-3 py-1 text-sm bg-white dark:bg-slate-800 dark:border-slate-700"
                        >
                            <option value="week">{lang === "en" ? "Week" : lang === "ps" ? "هفته" : "هفته"}</option>
                            <option value="month">{lang === "en" ? "Month" : lang === "ps" ? "ماه" : "ماه"}</option>
                            <option value="year">{lang === "en" ? "Year" : lang === "ps" ? "کال" : "سال"}</option>
                        </select>
                    </div>
                    <Badge tone="green">{period === "week" ? (lang === "en" ? "7 days" : lang === "ps" ? "۷ ورځي" : "۷ روز") : period === "month" ? (lang === "en" ? "30 days" : lang === "ps" ? "۳۰ ورځي" : "۳۰ روز") : (lang === "en" ? "365 days" : lang === "ps" ? "۳۶۵ ورځي" : "۳۶۵ روز")}</Badge>
                </Card>
            </div>

            {/* --- Category list --- */}
            <Card>
                <div className="flex flex-wrap gap-2 p-2">
                    {officeCategories.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-1">
                            <button
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedCategory === cat.id
                                        ? "bg-brand-600 text-white"
                                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                    }`}
                            >
                                {cat.name} <Badge tone="slate">{officeData[cat.name]?.length || 0}</Badge>
                            </button>
                            <button
                                onClick={() => {
                                    setEditingCategory(cat);
                                    setRenameCategoryValue(cat.name);
                                }}
                                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                                ✎
                            </button>
                            <button
                                onClick={() => deleteCategory(cat)}
                                className="text-xs text-red-600 hover:underline dark:text-red-400"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </Card>

            {/* --- Offices with Statistics --- */}
            {selectedCategory && currentCategory && (
                <Card>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentCategory.name}</h2>
                        <div className="flex gap-2">
                            <Input
                                placeholder={lang === "en" ? "Search offices..." : lang === "ps" ? "لټون د اداراتو..." : "جستجو در ادارات..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-48"
                            />
                            <Button onClick={() => setShowAddOffice(true)}>{lang === "en" ? "➕ New Office" : lang === "ps" ? "➕ نوی دفتر" : "➕ دفتر جدید"}</Button>
                        </div>
                    </div>

                    {filteredOffices.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{lang === "en" ? "No offices found" : lang === "ps" ? "هیڅ دفتر ونه موندل شو" : "هیچ دفتری یافت نشد"}</p>
                    ) : (
                        <ul className="space-y-2">
                            {filteredOffices.map((office) => {
                                const procStats = procurementStats[office.id] || { total_value: 0, total_items: 0, total_equipment: 0, order_count: 0 };
                                return (
                                    <li
                                        key={office.id}
                                        className="flex flex-wrap justify-between items-center p-3 bg-slate-50 rounded border dark:bg-slate-800/50 dark:border-slate-700"
                                    >
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{office.name}</span>
                                            {office.name_ps && <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">({office.name_ps})</span>}
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {lang === "en" ? "Equipment:" : lang === "ps" ? "تجهیزات:" : "تجهیزات:"} <Badge tone="blue">{Math.floor(procStats.total_equipment)}</Badge>
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {lang === "en" ? "Items:" : lang === "ps" ? "اقلام:" : "اقلام:"} <Badge tone="amber">{Math.floor(procStats.total_items)}</Badge>
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {lang === "en" ? "Value:" : lang === "ps" ? "ارزش:" : "ارزش:"} <Badge tone="green">{Math.floor(procStats.total_value).toLocaleString()} {getCurrencySymbol("AFN")}</Badge>
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {lang === "en" ? "Orders:" : lang === "ps" ? "سفارشات:" : "سفارشات:"} <Badge tone="slate">{procStats.order_count}</Badge>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedOffice(office);
                                                    setShowItemsModal(true);
                                                }}
                                            >
                                                {lang === "en" ? "📋 View" : lang === "ps" ? "📋 لیدل" : "📋 نمایش"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedOffice(office);
                                                    fetchOfficeOrders(office.id);
                                                    setShowOrdersModal(true);
                                                }}
                                            >
                                                {lang === "en" ? "📜 Orders" : lang === "ps" ? "📜 سفارشات" : "📜 سفارشات"}
                                            </Button>
                                            <button
                                                onClick={() => {
                                                    setEditingOffice(office);
                                                    setEditOfficeValue(office.name);
                                                    setEditOfficeValuePs(office.name_ps || "");
                                                    setEditOfficeValueFa(office.name_fa || "");
                                                    setEditOfficeDescription(office.description || "");
                                                }}
                                                className="text-blue-600 hover:underline text-sm dark:text-blue-400"
                                            >
                                                {lang === "en" ? "Edit" : lang === "ps" ? "سمول" : "ویرایش"}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOffice(office)}
                                                className="text-red-600 hover:underline text-sm dark:text-red-400"
                                            >
                                                {lang === "en" ? "Delete" : lang === "ps" ? "حذف" : "حذف"}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            )}

            {/* --- Modal to show procurement statistics for a specific office --- */}
            <Modal
                open={showItemsModal}
                onClose={() => setShowItemsModal(false)}
                title={`${lang === "en" ? "Procurement Statistics" : lang === "ps" ? "آمار سفارشات" : "آمار سفارشات"} - ${selectedOffice?.name || ""}`}
                size="lg"
                footer={
                    <Button variant="secondary" onClick={() => setShowItemsModal(false)}>
                        {lang === "en" ? "Close" : lang === "ps" ? "بستن" : "بستن"}
                    </Button>
                }
            >
                {selectedOffice && procurementStats[selectedOffice.id] ? (
                    <div className="grid grid-cols-2 gap-4 p-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Equipment" : lang === "ps" ? "تجهیزات" : "تجهیزات"}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {Math.floor(procurementStats[selectedOffice.id].total_equipment)}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Items" : lang === "ps" ? "اقلام" : "اقلام"}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {Math.floor(procurementStats[selectedOffice.id].total_items)}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Value" : lang === "ps" ? "ارزش" : "ارزش"}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {Math.floor(procurementStats[selectedOffice.id].total_value).toLocaleString()} {getCurrencySymbol("AFN")}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{lang === "en" ? "Orders" : lang === "ps" ? "سفارشات" : "سفارشات"}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {procurementStats[selectedOffice.id].order_count}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">{lang === "en" ? "No statistics recorded for this office" : lang === "ps" ? "هیڅ آمار دا دفتر لپاره ثبت نشتی" : "هیچ آماری برای این دفتر ثبت نشده است"}</p>
                )}
            </Modal>

            {/* --- Modal to show order history for a specific office --- */}
            <Modal
                open={showOrdersModal}
                onClose={() => setShowOrdersModal(false)}
                title={`${lang === "en" ? "Order History" : lang === "ps" ? "سفارشات تاریخچه" : "سفارشات ګدشته"} - ${selectedOffice?.name || ""}`}
                size="lg"
                footer={
                    <Button variant="secondary" onClick={() => setShowOrdersModal(false)}>
                        {lang === "en" ? "Close" : lang === "ps" ? "بستن" : "بستن"}
                    </Button>
                }
            >
                {officeOrders.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">{lang === "en" ? "No orders recorded for this office" : lang === "ps" ? "هیڅ سفارش دا دفتر لپاره ثبت نشتی" : "هیچ سفارشی برای این دفتر ثبت نشده است"}</p>
                ) : (
                    <div className="space-y-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b dark:bg-slate-900/50 dark:border-slate-700">
                                    <tr>
                                        <th className="text-right px-3 py-2 text-slate-600 dark:text-slate-400">{lang === "en" ? "Order No" : lang === "ps" ? "سفارش شمېره" : "شماره سفارش"}</th>
                                        <th className="text-right px-3 py-2 text-slate-600 dark:text-slate-400">{lang === "en" ? "Title" : lang === "ps" ? "سرلیک" : "عنوان"}</th>
                                        <th className="text-right px-3 py-2 text-slate-600 dark:text-slate-400">{lang === "en" ? "Category" : lang === "ps" ? "دسته" : "دسته‌بندی"}</th>
                                        <th className="text-right px-3 py-2 text-slate-600 dark:text-slate-400">{lang === "en" ? "Priority" : lang === "ps" ? "لومړیتوب" : "لومړیتوب"}</th>
                                        <th className="text-right px-3 py-2 text-slate-600 dark:text-slate-400">{lang === "en" ? "Status" : lang === "ps" ? "وضعیت" : "وضعیت"}</th>
                                        <th className="text-right px-3 py-2 text-slate-600 dark:text-slate-400">{lang === "en" ? "Amount" : lang === "ps" ? "مبلغ" : "مبلغ"}</th>
                                        <th className="text-right px-3 py-2 text-slate-600 dark:text-slate-400">{lang === "en" ? "Request Date" : lang === "ps" ? "د غوښتنې نېټه" : "تاریخ درخواست"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    {officeOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{order.order_no}</td>
                                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{order.title}</td>
                                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{order.category}</td>
                                            <td className="px-3 py-2">
                                                <Badge
                                                    tone={
                                                        order.priority === 'urgent' ? 'red' :
                                                        order.priority === 'high' ? 'amber' :
                                                        order.priority === 'medium' ? 'blue' : 'slate'
                                                    }
                                                >
                                                    {order.priority}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2">
                                                <Badge
                                                    tone={
                                                        order.status === 'completed' ? 'green' :
                                                        order.status === 'in_progress' ? 'blue' :
                                                        order.status === 'pending' ? 'amber' :
                                                        order.status === 'cancelled' ? 'red' : 'slate'
                                                    }
                                                >
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                                                {order.amount.toLocaleString()} {order.currency}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{order.requested_date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-t-2 border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">{lang === "en" ? "Total:" : lang === "ps" ? "مجموع:" : "مجموع کل:"}</span>
                                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {Math.floor(officeOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0)).toLocaleString()} AFN
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* --- CRUD Modals --- */}
            <Modal
                open={showAddCategory}
                onClose={() => setShowAddCategory(false)}
                title={lang === "en" ? "Add New Category" : lang === "ps" ? "نوی دسته اضافه کړئ" : "اضافه کردن دسته جدید"}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddCategory(false)}>
                            {lang === "en" ? "Cancel" : lang === "ps" ? "لغو" : "لغو"}
                        </Button>
                        <Button onClick={addCategory}>{lang === "en" ? "Add" : lang === "ps" ? "اضافه" : "اضافه"}</Button>
                    </>
                }
            >
                <Input
                    placeholder={lang === "en" ? "Category name..." : lang === "ps" ? "دسته نوم..." : "نام دسته..."}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
            </Modal>

            <Modal
                open={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                title={lang === "en" ? "Rename Category" : lang === "ps" ? "دسته نوم بدلون کړئ" : "تغییر نام دسته"}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditingCategory(null)}>
                            {lang === "en" ? "Cancel" : lang === "ps" ? "لغو" : "لغو"}
                        </Button>
                        <Button onClick={renameCategory}>{lang === "en" ? "Save" : lang === "ps" ? "خوندي کړئ" : "ذخیره"}</Button>
                    </>
                }
            >
                <Input
                    placeholder={lang === "en" ? "New name..." : lang === "ps" ? "نوی نوم..." : "نام جدید..."}
                    value={renameCategoryValue}
                    onChange={(e) => setRenameCategoryValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && renameCategory()}
                />
            </Modal>

            <Modal
                open={showAddOffice}
                onClose={() => setShowAddOffice(false)}
                title={`${lang === "en" ? "Add office to" : lang === "ps" ? "دفتر اضافه کړئ ته" : "اضافه کردن دفتر به"} "${currentCategory?.name}"`}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddOffice(false)}>
                            {lang === "en" ? "Cancel" : lang === "ps" ? "لغو" : "لغو"}
                        </Button>
                        <Button onClick={addOffice}>{lang === "en" ? "Add" : lang === "ps" ? "اضافه" : "اضافه"}</Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <Input
                        placeholder={lang === "en" ? "Office name (English)..." : lang === "ps" ? "دفتر نوم (انګلیسی)..." : "نام دفتر (انگلیسی)..."}
                        value={newOfficeName}
                        onChange={(e) => setNewOfficeName(e.target.value)}
                    />
                    <Input
                        placeholder={lang === "en" ? "Office name (Pashto)..." : lang === "ps" ? "دفتر نوم (پښتو)..." : "نام دفتر (پشتو)..."}
                        value={newOfficeNamePs}
                        onChange={(e) => setNewOfficeNamePs(e.target.value)}
                    />
                    <Input
                        placeholder={lang === "en" ? "Office name (Dari)..." : lang === "ps" ? "دفتر نوم (دری)..." : "نام دفتر (دری)..."}
                        value={newOfficeNameFa}
                        onChange={(e) => setNewOfficeNameFa(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addOffice()}
                    />
                </div>
            </Modal>

            <Modal
                open={!!editingOffice}
                onClose={() => setEditingOffice(null)}
                title={lang === "en" ? "Edit Office Name" : lang === "ps" ? "دفتر نوم سمول" : "ویرایش نام دفتر"}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditingOffice(null)}>
                            {lang === "en" ? "Cancel" : lang === "ps" ? "لغو" : "لغو"}
                        </Button>
                        <Button onClick={editOffice}>{lang === "en" ? "Save" : lang === "ps" ? "خوندي کړئ" : "ذخیره"}</Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <Input
                        placeholder={lang === "en" ? "Office name (English)..." : lang === "ps" ? "دفتر نوم (انګلیسی)..." : "نام دفتر (انگلیسی)..."}
                        value={editOfficeValue}
                        onChange={(e) => setEditOfficeValue(e.target.value)}
                    />
                    <Input
                        placeholder={lang === "en" ? "Office name (Pashto)..." : lang === "ps" ? "دفتر نوم (پښتو)..." : "نام دفتر (پشتو)..."}
                        value={editOfficeValuePs}
                        onChange={(e) => setEditOfficeValuePs(e.target.value)}
                    />
                    <Input
                        placeholder={lang === "en" ? "Office name (Dari)..." : lang === "ps" ? "دفتر نوم (دری)..." : "نام دفتر (دری)..."}
                        value={editOfficeValueFa}
                        onChange={(e) => setEditOfficeValueFa(e.target.value)}
                    />
                    <textarea
                        placeholder={lang === "en" ? "Description..." : lang === "ps" ? "شرح..." : "توضیحات..."}
                        value={editOfficeDescription}
                        onChange={(e) => setEditOfficeDescription(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-700"
                        rows={3}
                    />
                </div>
            </Modal>
                </>
            )}
        </div>
    );
}
