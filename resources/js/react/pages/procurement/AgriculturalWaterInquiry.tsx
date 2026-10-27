import { useState, useRef, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";

interface FormItem {
  id: number;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface FormData {
  requestDate: string;
  requestNumber: string;
  to: string;
  date: string;
  bidDeadline: string;
  items: FormItem[];
  totalWithoutTaxDigits: string;
  totalWithoutTaxWords: string;
  totalTaxDigits: string;
  totalTaxWords: string;
  totalWithTaxDigits: string;
  totalWithTaxWords: string;
  deliveryPeriod: string;
  warrantyPeriod: string;
  supplierName: string;
  supplierRep: string;
  supplierSignature: string;
  supplierDate: string;
  deliveryDays: string;
  internalPreference: string;
  issuingOfficer: string;
  officerSignature: string;
}

export default function AgriculturalWaterInquiry() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    requestDate: "1405/ / ",
    requestNumber: "",
    to: "",
    date: "",
    bidDeadline: "",
    items: [
      {
        id: 1,
        name: "آب زراعتی",
        description: "آب زراعتی هفته 500 متر مکعب (برای 9 هفته)",
        unit: "متر مکعب",
        quantity: 4500,
        unitPrice: "",
        totalPrice: "",
      },
    ],
    totalWithoutTaxDigits: "",
    totalWithoutTaxWords: "",
    totalTaxDigits: "",
    totalTaxWords: "",
    totalWithTaxDigits: "",
    totalWithTaxWords: "",
    deliveryPeriod: "",
    warrantyPeriod: "",
    supplierName: "",
    supplierRep: "",
    supplierSignature: "",
    supplierDate: "",
    deliveryDays: "",
    internalPreference: "",
    issuingOfficer: "هیئت خریداری و نرخگیری",
    officerSignature: "",
  });

  const [logEntries, setLogEntries] = useState<string[]>(["📋 قالب بارگذاری شد."]);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString("fa-IR");
    setLogEntries((prev) => [`[${timestamp}] ${msg}`, ...prev]);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [logEntries]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    addLog(`تغییر فیلد: ${name} = "${value}"`);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...formData.items];
    if (field === "quantity") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    if (field === "unitPrice" || field === "quantity") {
      const qty = parseFloat(String(updated[index].quantity)) || 0;
      const price = parseFloat(String(updated[index].unitPrice)) || 0;
      updated[index].totalPrice = Math.floor(qty * price).toString();
      addLog(`محاسبه خودکار: ${updated[index].name} قیمت مجموعی = ${updated[index].totalPrice}`);
    }
    setFormData((prev) => ({ ...prev, items: updated }));
  };

  const addNewItem = () => {
    const newItem: FormItem = {
      id: formData.items.length + 1,
      name: "",
      description: "",
      unit: "",
      quantity: 0,
      unitPrice: "",
      totalPrice: "",
    };
    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    addLog("➕ ردیف جدید اضافه شد");
  };

  const removeItem = (index: number) => {
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: updated }));
    addLog(`🗑️ ردیف ${index + 1} حذف شد`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveForm = async () => {
    try {
      const API_URL = "/api/v1";
      const token = sessionStorage.getItem("pms_access_token");
      
      const response = await fetch(`${API_URL}/procurement-workflow/custom-form-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          form_type: 'agricultural_water_inquiry',
          form_data: formData,
          title: 'درخواست نرخ دهی - آب زراعتی',
        }),
      });

      if (response.ok) {
        toast('فرم با موفقیت ذخیره شد', 'success');
        addLog('✅ فرم ذخیره شد');
      } else {
        toast('خطا در ذخیره فرم', 'error');
        addLog('❌ خطا در ذخیره فرم');
      }
    } catch (error) {
      toast('خطا در ذخیره فرم', 'error');
      addLog('❌ خطا در ذخیره فرم: ' + error);
    }
  };

  return (
    <div dir="rtl" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-lg">
      {/* Print button at top */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={handleSaveForm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
          >
            💾 ذخیره فرم
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium flex items-center gap-2"
          >
            🖨️ چاپ فرم
          </button>
        </div>
      </div>

      {/* Logo at top */}
      <div className="flex justify-center mb-6">
        <img 
          src="/logo.png" 
          alt="لوگو" 
          className="w-[120px] h-[120px] object-contain"
        />
      </div>

      {/* header */}
      <div className="text-center font-bold text-lg leading-[1.9] mb-4">
        <div className="text-2xl text-slate-800 dark:text-slate-100 mb-2">امارت اسلامی افغانستان</div>
        <div className="text-xl text-slate-700 dark:text-slate-200">وزارت تحصیلات عالی</div>
        <div className="text-xl text-slate-700 dark:text-slate-200">ریاست پوهنتون کابل</div>
        <div className="text-lg text-slate-600 dark:text-slate-300">معاونیت مالی و اداری</div>
        <div className="text-lg text-slate-600 dark:text-slate-300">آمریت تهیه و تدارکات</div>
        <div className="text-2xl text-amber-700 dark:text-amber-400 mt-3 font-bold">سند معیاری</div>
        <div className="text-xl text-amber-600 dark:text-amber-500 font-semibold">درخواست نرخ دهی</div>
      </div>

      <div className="mb-4 font-bold text-xl">
        تهیه اجناس و خدمات غیر مشورتی
        <span className="mr-4">(ضرورت پوهنحی زراعت (آب زراعتی</span>
      </div>

      <div className="flex flex-wrap justify-between gap-2.5 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="font-bold text-sm">تاریخ صدور درخواست نرخ دهی:</label>
          <input
            name="requestDate"
            value={formData.requestDate}
            onChange={handleChange}
            className="min-w-[130px] border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="font-bold text-sm">شماره درخواست نرخ گیری:</label>
          <input
            name="requestNumber"
            value={formData.requestNumber}
            onChange={handleChange}
            className="min-w-[100px] border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2.5 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="font-bold text-sm">به:</label>
          <input
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="min-w-[180px] border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
            placeholder="اداره مربوطه"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="font-bold text-sm">تاریخ:</label>
          <input
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="min-w-[120px] border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-700/50 p-3.5 my-3 border-r-4 border-slate-700 dark:border-slate-500 rounded text-sm">
        <div className="mb-2">(1) اداره ریاست پوهنتون کابل آمریت تهیه و تدارکات تخصیص بودجه لازم برای تدارک اجناس/ خدمات غیر مشورتی مندرج این درخواست را دارد.</div>
        <div className="mb-2">
          (2) آفر سربسته شما الی{" "}
          <input
            name="bidDeadline"
            value={formData.bidDeadline}
            onChange={handleChange}
            className="w-[100px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
            placeholder="تاریخ"
          />{" "}
          یا قبل ازآن به دفتر ریاست پوهنتون کابل آمریت تهیه وتدارکات تسلیم داده شود.
        </div>
        <div>(3) آفر ها ئیکه بعد از میعاد تسلیمی ارائه گردند، بدون اینکه بازشود مسترد می گردد. پاکت حاوی آفر باید به صورت واضح عبارت نرخ برای { } نشانی شده باشد.</div>
        <div>(4) آفر ارائه شده در آفرها باید الی مدت (30) روز تقویمی سر از تاریخ ختم میعاد تسلیمی آفرها اعتبار داشته باشد.</div>
        <div>(5) در صورت تغیر در مقدار نیازمندی، اداره می تواند مقدار نیازمندی تقاضا شده را الی (25) فیصد زیاد و یا کم نماید، مشروط به اینکه قیمت مجموعی آن از حدود صلاحیت پولی برای درخواست نرخ گیری تجاوز ننماید.</div>
        <div>
          (6) ترجیح داخلی مطابق حکم چهارم طرزالعمل تدارکات قابل اجرا است.{" "}
          <input
            name="internalPreference"
            value={formData.internalPreference}
            onChange={handleChange}
            className="w-[140px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500 mr-1.5"
            placeholder="درج فیصدی"
          />
        </div>
        <div>(7) آفر گشائی در محضر عام حتمی نبوده و فرمایش دهنده مکلف به قبول نازلترین نرخ نمی باشد. در صورت رد هر یک یا تمام آفرها فرمایش دهنده کدام مسؤلیت در قبال داوطلب تهیه/ارائه کننده ندارد.</div>
        <div>
          (8) آفر دهنده اسناد ذیل را با آفر خویش ضمیمه می نماید:
          <ol className="mr-8 mt-2 list-decimal pl-4">
            <li className="ml-4">جواز تجارتی/ فعالیت/کار قابل اعتبار؛</li>
            <li className="ml-4">نمبرتشخیصیه مالیه؛</li>
            <li className="ml-4">اجازه نامه تولید کننده (درصورت لزوم).</li>
          </ol>
        </div>
        <div>(9) سند نرخ گیری تکمیل و توسط شخص با صلاحیت یا نماینده تهیه/ ارائه کننده در هر صفحه مهر امضاء شده باشد.</div>
      </div>

      <div className="flex flex-wrap justify-between gap-2.5 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="font-bold text-sm">نام کارمند صادر کننده درخواست نرخ گیری:</label>
          <input
            name="issuingOfficer"
            value={formData.issuingOfficer}
            onChange={handleChange}
            className="min-w-[150px] border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="font-bold text-sm">وظیفه کارمند: هیئت خریداری و نرخگیری</label>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="font-bold text-sm">امضاء:</label>
          <input
            name="officerSignature"
            value={formData.officerSignature}
            onChange={handleChange}
            className="min-w-[100px] border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* جدول اقلام */}
      <h4 className="my-5 text-base font-semibold">جدول اقلام و قیمت ها</h4>
      <div className="my-4.5 border border-slate-600 dark:border-slate-500">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-600 dark:border-slate-500 p-2 text-center bg-slate-200 dark:bg-slate-700 font-bold w-16">شماره</th>
              <th className="border border-slate-600 dark:border-slate-500 p-2 text-center bg-slate-200 dark:bg-slate-700 font-bold w-80">اسم اقلام</th>
              <th className="border border-slate-600 dark:border-slate-500 p-2 text-center bg-slate-200 dark:bg-slate-700 font-bold min-w-[400px]">تشریح با مشخصات تخنیکی</th>
              <th className="border border-slate-600 dark:border-slate-500 p-2 text-center bg-slate-200 dark:bg-slate-700 font-bold w-32">واحد</th>
              <th className="border border-slate-600 dark:border-slate-500 p-2 text-center bg-slate-200 dark:bg-slate-700 font-bold w-28">مقدار</th>
              <th className="border border-slate-600 dark:border-slate-500 p-2 text-center bg-slate-200 dark:bg-slate-700 font-bold w-64">قیمت فی واحد به افغانی</th>
              <th className="border border-slate-600 dark:border-slate-500 p-2 text-center bg-slate-200 dark:bg-slate-700 font-bold w-56">قمیت مجموعی به افغانی</th>
              <th className="border border-slate-600 dark:border-slate-500 p-2 text-center bg-slate-200 dark:bg-slate-700 font-bold w-16">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-slate-600 dark:border-slate-500 p-2 text-center w-16 align-top">{idx + 1}</td>
                <td className="border border-slate-600 dark:border-slate-500 p-2 text-center w-80 align-top">
                  <input
                    className="w-full border-none bg-transparent text-center text-sm p-0.5 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20"
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-2 text-center min-w-[400px] align-top">
                  <textarea
                    className="w-full border-none bg-transparent text-center text-sm p-0.5 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20 resize-none"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    rows={2}
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-2 text-center w-32 align-top">
                  <input
                    className="w-full border-none bg-transparent text-center text-sm p-0.5 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20"
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-2 text-center w-28 align-top">
                  <input
                    type="number"
                    className="w-full border-none bg-transparent text-center text-sm p-0.5 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-2 text-center w-64 align-top">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border-none bg-transparent text-center text-sm p-0.5 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-2 text-center w-56 align-top">
                  <input
                    type="text"
                    className="w-full border-none bg-slate-100 dark:bg-slate-700 text-center text-sm p-0.5"
                    value={item.totalPrice}
                    readOnly
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-2 text-center w-16">
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-600 hover:text-red-800 text-lg font-bold"
                    disabled={formData.items.length === 1}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addNewItem}
        className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium"
      >
        + افزودن ردیف جدید
      </button>

      {/* totals fields */}
      <div className="my-3">
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-sm">مجموع قیمت به ارقام بدون مالیات:</label>
          <input
            name="totalWithoutTaxDigits"
            value={formData.totalWithoutTaxDigits}
            onChange={handleChange}
            className="min-w-[150px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-sm">مجموع قیمت به حروف بدون مالیات:</label>
          <input
            name="totalWithoutTaxWords"
            value={formData.totalWithoutTaxWords}
            onChange={handleChange}
            className="min-w-[200px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-sm">مجموع مبلغ مالیات به ارقام:</label>
          <input
            name="totalTaxDigits"
            value={formData.totalTaxDigits}
            onChange={handleChange}
            className="min-w-[150px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-sm">مجموع مبلغ مالیات به حروف:</label>
          <input
            name="totalTaxWords"
            value={formData.totalTaxWords}
            onChange={handleChange}
            className="min-w-[200px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-sm">مجموع مبلغ به ارقام بشمول مالیات:</label>
          <input
            name="totalWithTaxDigits"
            value={formData.totalWithTaxDigits}
            onChange={handleChange}
            className="min-w-[150px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-sm">مجموع مبلغ به حروف به شمول مالیات:</label>
          <input
            name="totalWithTaxWords"
            value={formData.totalWithTaxWords}
            onChange={handleChange}
            className="min-w-[200px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-sm">مدت تحویلی و تکمیل (روز، هفته یا ماه) اجناس / خدمات از تاریخ صدور امرخریداری:</label>
          <input
            name="deliveryPeriod"
            value={formData.deliveryPeriod}
            onChange={handleChange}
            className="min-w-[180px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-sm">مدت ضمانت (وارنتی/ گرنتی) بعد از تاریخ اکمال:</label>
          <input
            name="warrantyPeriod"
            value={formData.warrantyPeriod}
            onChange={handleChange}
            className="min-w-[180px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* signature supplier */}
      <div className="flex flex-wrap justify-between mt-6 border-t border-dashed border-slate-400 dark:border-slate-600 pt-5">
        <div className="min-w-[220px] my-2.5">
          <div className="mb-1.5">
            <label className="font-bold text-sm">اسم تهیه/ ارائه کننده:</label>{" "}
            <input
              name="supplierName"
              value={formData.supplierName}
              onChange={handleChange}
              className="w-full border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="mb-1.5">
            <label className="font-bold text-sm">اسم شخص یا نماینده با صلاحیت تهیه/ارائه کننده:</label>{" "}
            <input
              name="supplierRep"
              value={formData.supplierRep}
              onChange={handleChange}
              className="w-full border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="mb-1.5">
            <label className="font-bold text-sm">امضای شخص یا نماینده تهیه/ارائه کننده:</label>{" "}
            <input
              name="supplierSignature"
              value={formData.supplierSignature}
              onChange={handleChange}
              className="w-full border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="mb-1.5">
            <label className="font-bold text-sm">تاریخ:</label>{" "}
            <input
              name="supplierDate"
              value={formData.supplierDate}
              onChange={handleChange}
              className="w-full border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="min-w-[220px] my-2.5 text-center">
          <div className="font-bold mb-5">مهر تهیه/ارائه کننده</div>
          <div className="border border-dashed border-slate-500 h-20 rounded flex items-center justify-center text-slate-500">مهر</div>
        </div>
      </div>

      <div className="text-xs my-3 bg-slate-50 dark:bg-slate-700/30 p-1.5 rounded">
        یادداشت: فرمایش گیرنده کاپی رهنمود، ساخت و مودل، بروشور و یا فهرست تجهیزات یا خدماتی را که اکمال می نماید ضمیمه نماید. معلومات فوق جهت ارزیابی مؤثر آفرها استفاده می گردد.
      </div>

      {/* شرایط تدارک و پرداخت */}
      <div className="bg-slate-50 dark:bg-slate-700/30 p-3 my-5 rounded">
        <h4 className="my-2.5 text-base font-semibold">شرایط تدارک و پرداخت</h4>
        <p className="text-sm">شرایط ذیل صرف با موافقه تحریری فرمایش دهنده قابل تغییر می باشد.</p>
        <ol className="mr-5 list-decimal text-sm">
          <li>تهیه کننده مکلف به پرداخت تأمینات و تضمینات نمی باشد.</li>
          <li>
            تهیه اجناس باید درظرف{" "}
            <input
              name="deliveryDays"
              value={formData.deliveryDays}
              onChange={handleChange}
              className="w-[70px] border-none border-b border-slate-800 dark:border-slate-400 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:border-brand-500"
              placeholder="روز"
            />{" "}
            روز/هفته سر از تاریخ صدور امرخریداری، تکمیل گردد.
          </li>
          <li>بعد از اکمال خدمات غیر مشورتی/ تهیه اجناس، تهیه/ارائه کننده باید نسخه اصلی و (2) کاپی بل (Invoice) را به فرمایش دهنده تسلیم نماید؛</li>
          <li>پرداخت توسط فرمایش دهنده، طی مدت (30) روز کاری درمقابل مقدار واقعی اجناس/خدمات غیر مشورتی تهیه شده صورت می گیرد.</li>
          <li>
            فرمایش دهنده میتواند در حالات ذیل با ارسال اطلاعیه کتبی به تهیه/ارائه کننده، امرخریداری را کاملاً یا قسماً فسخ نماید:
            <ol className="mr-6 list-decimal">
              <li>تهیه/ارائه کننده موفق به تحویل بخش یا تمام اجناس درظرف مدت معینه در امرخریداری نشود؛</li>
              <li>تهیه /ارائه کننده موفق به اجرای مکلفیت های دیگر تحت امر خریداری نشود.</li>
              <li>هرگاه در اجناس اکمال شده یا خدمات ارائه شده نواقص و یا کاستی ها مشاهده گردد، تهیه/ارائه کننده مکلف به رفع نواقص و کاستی ها در مدت (3) روز کاری بعد از دریافت اطلاعیه در مورد می باشد، در غیر آن فرمایش دهنده می تواند امر خریداری را فسخ نماید.</li>
              <li>هرگاه تهیه/ارائه کننده، در جریان داوطلبی و یا حین اجرای وظایف محوله تحت امر خریداری اقدام به فساد و تقلب نموده باشد.</li>
            </ol>
          </li>
          <li>هرگاه در درخواست نرخ گیری میعاد ضمانت (وارنتی/ گرنتی) تصریح گردیده باشد، تهیه/ارائه کننده مکلف به تعویض در طول مدت معینه می باشد.</li>
        </ol>
      </div>

      {/* روش ارزیابی */}
      <div className="my-4">
        <h4 className="text-base font-semibold">روش و معیار های ارزیابی</h4>
        <p className="text-sm font-semibold">ارزیابی آفر ها</p>
        <ol className="mr-8 list-decimal text-sm pl-4">
          <li className="ml-4">
            قبل از ارزیابی مفصل نرخ ها، فرمایش دهنده باید تشخیص نماید که آفرها:
            <ol className="mr-8 list-decimal pl-4">
              <li className="ml-4">با شرایط و معیار های مندرج این درخواست نرخ گیری مطابقت دارد؛</li>
              <li className="ml-4">طور یکه لازم است امضا و مهر شده است.</li>
            </ol>
          </li>
          <li className="ml-4">آفر جوابگو آفر است که بعد از ارزیابی، معیار های کیفی و تخنیکی و شرایط مندرج این درخواست نرخ گیری در آن رعایت گردیده باشد.</li>
          <li className="ml-4">
            فرمایش دهنده طور ذیل ارزیابی مالی را انجام می دهد:
            <ol className="mr-8 list-decimal pl-4">
              <li className="ml-4">ارزیابی برای اقلام یا جزءها صورت می گیرد؛</li>
              <li className="ml-4">هر گونه اشتباهات محاسبوی اصلاح می گردد؛</li>
              <li className="ml-4">تخفیفات غیر مشروط پشنهاد شده محاسبه می گردد؛</li>
              <li className="ml-4">اعمال هر گونه ترجیح داخلی</li>
            </ol>
          </li>
          <li>آفر های غیرجوابگو رد گردیده، بعد از آن نمیتواند با اصلاح اشتباهات غیر محاسبوی یا انحرافات جوابگو ساخته شود.</li>
          <li>هیچ نوع مذاکره با داوطلبی که نازلترین قیمت را پیشنهاد نموده یا داوطلب دیگر صورت گرفته نمیتواند.</li>
          <li>داوطلب مکلف نیست که منحیث شرایط برای اعطاء مسؤلیت های را که در اسناد درخواست نرخ دهی تصریح نشده اند، مانند تغیر درقیمت یا تعدیل درسند ارائه نرخ بپذیرد.</li>
        </ol>
        <p className="text-sm font-semibold mt-3">اصلاح اشتباهات محاسبوی</p>
        <ol className="mr-5 list-decimal text-sm">
          <li>
            اشتباهات محاسبوی طور ذیل تصحیح می گردد:
            <ol className="mr-6 list-decimal">
              <li>درصورت تفاوت میان مبلغ به ارقام و حروف، مبلغ به حروف قابل اعتبار می باشد؛</li>
              <li>درصورتیکه تفاوت میان قیمت فی واحد و قیمت مجموعی وجود داشته باشد، قیمت فی واحد برای ارزیابی قیمت ها و ترتیب امر خریداری قابل اعتبار می باشد؛</li>
              <li>درصورت موجودیت تفاوت میان نرخ فی واحد و قیمت مجموعی (حاصل ضرب مقدار در نرخ فی واحد)، نرخ فی واحد قابل اعتبار می باشد، هرگاه از نظر فرمایش دهنده اشتباه در نقاط اعشاری در قیمت فی واحد برجسته باشد، دراین صورت قیمت مجموعی اقلام طوریکه نرخ داده شده است قابل اعتبار بوده و قیمت فی واحد باید اصلاح شود.</li>
              <li>فرمایش دهنده مطابق مندرجات فوق اشتباهات محاسبوی را اصلاح و بعد از اخذ موافقه کتبی داوطلب در قیمت مجموعی آفر محاسبه می نماید.</li>
              <li>داوطلب مکلف به پذیرش اشتباهات محاسبوی در آفر خویش می باشد. در صورت عدم پذیرش اشتباهات محاسبوی توسط داوطلب، آفر وی رد می گردد.</li>
            </ol>
          </li>
        </ol>
      </div>

    </div>
  );
}
