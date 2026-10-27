import { useState } from "react";

interface FormItem {
  description: string;
  unit: string;
  quantity: string;
  unitPrice: number;
  total: string;
}

interface FormData {
  serialNumber: string;
  date: string;
  requestedBy: string;
  items: FormItem[];
  sumTotal: string;
  totalAmountWords: string;
  approvingSignature: string;
  privateNumber: string;
  allocationNumber: string;
  branchOffice: string;
  commitmentAmount: string;
  paymentOrder: string;
  noteText: string;
  certifierSignature1: string;
  certifierSignatureM12: string;
  certifierSignatureM16: string;
}

export default function M2CashPurchaseOrder() {
  const [form, setForm] = useState<FormData>({
    serialNumber: "",
    date: "1405/ / ",
    requestedBy: "",
    items: [
      {
        description: "الماری به طول 2.55 سانتی متر و ارتفاع آن به 2.66 سانتی متر و عمق آن به 33 سانتی متر و 80 سانتی قسمت پایین الماری پله دار و قسمت بالای آن شلف خانه دار",
        unit: "پایه",
        quantity: "",
        unitPrice: 40250,
        total: "",
      },
      { description: "", unit: "", quantity: "", unitPrice: 0, total: "" },
      { description: "", unit: "", quantity: "", unitPrice: 0, total: "" },
      { description: "", unit: "", quantity: "", unitPrice: 0, total: "" },
      { description: "", unit: "", quantity: "", unitPrice: 0, total: "" },
      { description: "", unit: "", quantity: "", unitPrice: 0, total: "" },
      { description: "", unit: "", quantity: "", unitPrice: 0, total: "" },
      { description: "", unit: "", quantity: "", unitPrice: 0, total: "" },
      { description: "", unit: "", quantity: "", unitPrice: 0, total: "" },
    ],
    sumTotal: "",
    totalAmountWords: "",
    approvingSignature: "",
    privateNumber: "",
    allocationNumber: "",
    branchOffice: "",
    commitmentAmount: "",
    paymentOrder: "",
    noteText: "قرار شرح فوق مبلغ (شش هزار و نه صد) افغانی درک قیمت (1) قلم جنس ضرورت آمریت محترم خدمات از وجه محترم میرقاسم معتمد حواله جهت ویزه به مدیریت عمومی محترم کنترول راجع گردید. با احترام",
    certifierSignature1: "",
    certifierSignatureM12: "",
    certifierSignatureM16: "",
  });

  const recalcRowTotal = (qty: string, price: number) => {
    const q = parseFloat(qty) || 0;
    const p = price || 0;
    return Math.floor(q * p).toString();
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...form.items];
    if (field === "unitPrice") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    if (field === "quantity" || field === "unitPrice") {
      const qty = field === "quantity" ? value : updated[index].quantity;
      const price = field === "unitPrice" ? parseFloat(value) || 0 : updated[index].unitPrice;
      updated[index].total = recalcRowTotal(qty, price);
    }
    setForm((prev) => ({ ...prev, items: updated }));
    setTimeout(() => recalcSum(), 20);
  };

  const recalcSum = () => {
    const sum = form.items.reduce((acc, item) => {
      const val = parseFloat(item.total) || 0;
      return acc + val;
    }, 0);
    setForm((prev) => ({ ...prev, sumTotal: Math.floor(sum).toString() }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div dir="rtl" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-lg">
      <div className="text-lg font-bold text-center mb-4 border-b-2 border-slate-700 dark:border-slate-500 pb-2">
        فورمه م-2: نمبر مسلسل ({" "}
        <input
          name="serialNumber"
          value={form.serialNumber}
          onChange={handleChange}
          className="w-[100px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
          placeholder="..."
        />{" "}
        ) مورخ{" "}
        <input
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-[120px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
        />{" "}
        امر خریداری نقدی برای جنس خدمات (بیع مطلق معجل)
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">4. توسط کدام شخص درخواست شده است.</span>
          <input
            name="requestedBy"
            value={form.requestedBy}
            onChange={handleChange}
            className="min-w-[200px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
            placeholder="اسم شعبه، شخص درخواست کننده و نمبر"
          />
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">اسم شعبه، شخص درخواست کننده و نمبر</div>
      </div>

      <div className="overflow-x-auto my-4 border border-slate-600 dark:border-slate-500 rounded">
        <table className="w-full border-collapse text-sm min-w-[1000px]">
          <thead>
            <tr>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">شماره</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">تشریحات</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs"></th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">واحد</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">مقدار</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">فیات</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">قیمت تخمینی</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">قیمت تادیه شده</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">خریداری از شخص</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs"></th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">محل امضاء هیئت خریداری</th>
              <th className="border border-slate-600 dark:border-slate-500 p-1 text-center bg-slate-200 dark:bg-slate-700 font-bold text-xs">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-slate-600 dark:border-slate-500 p-1 text-center text-xs">{idx + 1}</td>
                <td className="border border-slate-600 dark:border-slate-500 p-1">
                  <input
                    className="w-full border-none bg-transparent text-xs p-1 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    placeholder="تشریح..."
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-1"></td>
                <td className="border border-slate-600 dark:border-slate-500 p-1">
                  <input
                    className="w-full border-none bg-transparent text-xs p-1 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20"
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                    placeholder="واحد"
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-1">
                  <input
                    type="number"
                    className="w-full border-none bg-transparent text-xs p-1 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-1">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border-none bg-transparent text-xs p-1 focus:outline-none focus:border focus:border-brand-500 focus:bg-brand-50 dark:focus:bg-brand-900/20"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                  />
                </td>
                <td className="border border-slate-600 dark:border-slate-500 p-1 bg-slate-100 dark:bg-slate-700 font-medium text-xs">{item.total || ""}</td>
                <td className="border border-slate-600 dark:border-slate-500 p-1 bg-slate-100 dark:bg-slate-700 font-medium text-xs">{item.total || ""}</td>
                <td className="border border-slate-600 dark:border-slate-500 p-1"></td>
                <td className="border border-slate-600 dark:border-slate-500 p-1"></td>
                <td className="border border-slate-600 dark:border-slate-500 p-1"></td>
                <td className="border border-slate-600 dark:border-slate-500 p-1"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 dark:bg-slate-700 font-bold">
              <td colSpan={6} className="border border-slate-600 dark:border-slate-500 p-1 text-left text-xs">مجموعه</td>
              <td className="border border-slate-600 dark:border-slate-500 p-1"></td>
              <td className="border border-slate-600 dark:border-slate-500 p-1 text-xs">{form.sumTotal}</td>
              <td colSpan={4} className="border border-slate-600 dark:border-slate-500 p-1"></td>
            </tr>
            <tr>
              <td colSpan={12} className="border border-slate-600 dark:border-slate-500 p-1 text-right text-xs">
                مبلغ مجموعی:{" "}
                <input
                  name="totalAmountWords"
                  value={form.totalAmountWords}
                  onChange={handleChange}
                  className="min-w-[150px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
                  placeholder="به حروف"
                />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 my-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">16- امضاء آمر منظور کننده:</span>
          <input
            name="approvingSignature"
            value={form.approvingSignature}
            onChange={handleChange}
            className="min-w-[120px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">نمبر خصوصی:</span>
          <input
            name="privateNumber"
            value={form.privateNumber}
            onChange={handleChange}
            className="w-[100px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">نمبر تخصیص:</span>
          <input
            name="allocationNumber"
            value={form.allocationNumber}
            onChange={handleChange}
            className="w-[100px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">شعبه محاسبه:</span>
          <input
            name="branchOffice"
            value={form.branchOffice}
            onChange={handleChange}
            className="w-[100px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/30 p-4 my-4 border-r-4 border-slate-600 dark:border-slate-500 rounded">
        <div className="mb-2">
          <span className="font-bold text-sm">25.</span>{" "}
          <textarea
            name="noteText"
            value={form.noteText}
            onChange={handleChange}
            className="w-full border-none bg-transparent text-sm p-1 focus:outline-none resize-y"
            rows={2}
          />
        </div>
        <div className="flex flex-wrap gap-6 mt-2">
          <span className="flex items-center gap-2">
            <span className="font-bold text-sm">مبلغ تعهد:</span>
            <input
              name="commitmentAmount"
              value={form.commitmentAmount}
              onChange={handleChange}
              className="w-[110px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </span>
          <span className="flex items-center gap-2">
            <span className="font-bold text-sm">امر تادیه:</span>
            <input
              name="paymentOrder"
              value={form.paymentOrder}
              onChange={handleChange}
              className="w-[120px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </span>
        </div>
      </div>

      <div className="my-4">
        <div className="font-bold text-sm mb-2">24. تصدیق می دارم پولیکه در ستون 19 ذکر شده موجود است.</div>
        <div className="flex flex-wrap gap-8 mt-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">تصدیق کننده امضاء</span>
            <input
              name="certifierSignature1"
              value={form.certifierSignature1}
              onChange={handleChange}
              className="w-[140px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">تصدیق کننده امضاء م-12</span>
            <input
              name="certifierSignatureM12"
              value={form.certifierSignatureM12}
              onChange={handleChange}
              className="w-[140px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">تصدیق کننده امضاء م-16</span>
            <input
              name="certifierSignatureM16"
              value={form.certifierSignatureM16}
              onChange={handleChange}
              className="w-[140px] border-none border-b border-slate-700 dark:border-slate-400 bg-transparent px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
