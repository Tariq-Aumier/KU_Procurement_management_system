import { useState, useEffect } from 'react';
import { Button, Card, Input, Field, Select, Textarea } from '../../components/ui';
import { useI18n } from '../../contexts/I18nContext';

interface ContractFormItem {
  id: string;
  line_no: number;
  item_name: string;
  specifications: string;
  unit_id: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ContractFormData {
  id?: number;
  form_number?: string;
  form_date: string;
  customer_name: string;
  company_id?: number;
  office_id?: number;
  description: string;
  items: ContractFormItem[];
  status?: string;
}

interface DropdownData {
  companies: Array<{ id: number; name: string; name_en: string; name_ps: string; name_fa: string }>;
  offices: Array<{ id: number; name: string; name_en: string; name_ps: string; name_fa: string }>;
  units: Array<{ id: number; name: string; name_en: string; name_ps: string; name_fa: string; abbreviation: string }>;
}

export default function ContractForm() {
  const { lang } = useI18n();
  const [formData, setFormData] = useState<ContractFormData>({
    form_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    company_id: undefined,
    office_id: undefined,
    description: '',
    items: [
      {
        id: '1',
        line_no: 1,
        item_name: '',
        specifications: '',
        unit_id: null,
        quantity: 0,
        unit_price: 0,
        line_total: 0,
      },
    ],
  });
  const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);
  const [savedForms, setSavedForms] = useState<ContractFormData[]>([]);
  const [viewMode, setViewMode] = useState<'create' | 'saved' | 'view'>('create');
  const [selectedForm, setSelectedForm] = useState<ContractFormData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    fetchSavedForms();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('pms_access_token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/contract-forms/dropdown-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setDropdownData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchSavedForms = async () => {
    try {
      const token = localStorage.getItem('pms_access_token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/contract-forms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSavedForms(data.data.data);
      }
    } catch (error) {
      console.error('Error fetching saved forms:', error);
    }
  };

  const handleAddItem = () => {
    const newItem: ContractFormItem = {
      id: Date.now().toString(),
      line_no: formData.items.length + 1,
      item_name: '',
      specifications: '',
      unit_id: null,
      quantity: 0,
      unit_price: 0,
      line_total: 0,
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const handleRemoveItem = (id: string) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, line_no: index + 1 }));
      setFormData({
        ...formData,
        items: updatedItems,
      });
    }
  };

  const handleItemChange = (id: string, field: keyof ContractFormItem, value: any) => {
    const updatedItems = formData.items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    });
    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pms_access_token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/contract-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        alert('Form saved successfully!');
        fetchSavedForms();
        resetForm();
      } else {
        alert('Failed to save form: ' + data.message);
      }
    } catch (error) {
      alert('Error saving form');
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = async (id: number) => {
    try {
      const token = localStorage.getItem('pms_access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/contract-forms/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSelectedForm(data.data);
        setViewMode('view');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setFormData({
      form_date: new Date().toISOString().split('T')[0],
      customer_name: '',
      company_id: undefined,
      office_id: undefined,
      description: '',
      items: [
        {
          id: '1',
          line_no: 1,
          item_name: '',
          specifications: '',
          unit_id: null,
          quantity: 0,
          unit_price: 0,
          line_total: 0,
        },
      ],
    });
  };

  const getCompanyName = () => {
    if (!formData.company_id || !dropdownData) return '';
    const company = dropdownData.companies.find((c) => c.id === formData.company_id);
    if (!company) return '';
    return lang === 'en' ? company.name_en : lang === 'ps' ? company.name_ps : company.name_fa;
  };

  const getUnitName = (unitId: string | null) => {
    if (!unitId || !dropdownData) return '';
    const unit = dropdownData.units.find((u) => u.id === parseInt(unitId));
    if (!unit) return '';
    return lang === 'en' ? unit.name_en : lang === 'ps' ? unit.name_ps : unit.name_fa;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.line_total, 0);
  };

  if (viewMode === 'view' && selectedForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button onClick={() => setViewMode('saved')} variant="secondary" className="mb-4">
          {lang === 'en' ? 'Back to Saved Forms' : lang === 'ps' ? 'بازگشت به فرم‌های ذخیره شده' : 'برگشت به فرم‌های ذخیره شده'}
        </Button>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200" dir={lang === 'en' ? 'ltr' : 'rtl'}>
          <div className="flex justify-between items-start mb-6">
            <div className="text-left">
              <div className="text-lg font-bold">
                {lang === 'en' ? 'Date:' : lang === 'ps' ? 'ناریخ:' : 'تاریخ:'}
              </div>
              <div className="text-xl font-semibold">{selectedForm.form_date}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                {lang === 'en' ? 'Customer Name:' : lang === 'ps' ? 'نام مشتری:' : 'نام مشتری:'}
              </div>
              <div className="text-xl font-semibold">{selectedForm.customer_name}</div>
            </div>
          </div>

          {selectedForm.company_id && (
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-blue-800">
                {dropdownData?.companies.find((c) => c.id === selectedForm.company_id)?.name}
              </h2>
            </div>
          )}

          {selectedForm.form_number && (
            <div className="mb-4 text-center">
              <div className="text-lg font-bold">
                {lang === 'en' ? 'Form Number:' : lang === 'ps' ? 'نمبر فرم:' : 'شماره فرم:'}
              </div>
              <div className="text-xl font-semibold">{selectedForm.form_number}</div>
            </div>
          )}

          <table className="w-full mb-6 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'No.' : lang === 'ps' ? 'نمبر' : 'شماره'}</th>
                <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Item Name' : lang === 'ps' ? 'نام جنس' : 'اسم جنس'}</th>
                <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Specifications' : lang === 'ps' ? 'مشخصات' : 'مشخصات'}</th>
                <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Unit' : lang === 'ps' ? 'واحد' : 'واحد'}</th>
                <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Quantity' : lang === 'ps' ? 'مقدار' : 'مقدار'}</th>
                <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Unit Price' : lang === 'ps' ? 'قیمت فی واحد' : 'قیمت فی واحد'}</th>
                <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Total' : lang === 'ps' ? 'مجموع' : 'مجموع'}</th>
              </tr>
            </thead>
            <tbody>
              {selectedForm.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="text-center px-4 py-3">{item.line_no}</td>
                  <td className="text-center px-4 py-3">{item.item_name}</td>
                  <td className="text-center px-4 py-3">{item.specifications}</td>
                  <td className="text-center px-4 py-3">{getUnitName(item.unit_id)}</td>
                  <td className="text-center px-4 py-3">{item.quantity}</td>
                  <td className="text-center px-4 py-3">{item.unit_price}</td>
                  <td className="text-center px-4 py-3 font-bold">{item.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-6 text-right">
            <div className="text-lg font-bold">
              {lang === 'en' ? 'Grand Total:' : lang === 'ps' ? 'مجموع کل:' : 'مجموع کل:'}
            </div>
            <div className="text-2xl font-bold text-green-600">{calculateGrandTotal()}</div>
          </div>

          {selectedForm.description && (
            <div className="mb-6">
              <div className="text-lg font-bold">
                {lang === 'en' ? 'Description:' : lang === 'ps' ? 'تشریحات:' : 'تشریحات:'}
              </div>
              <div className="text-base">{selectedForm.description}</div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button onClick={handlePrint}>
              {lang === 'en' ? 'Print' : lang === 'ps' ? 'چاپ' : 'چاپ'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'saved') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {lang === 'en' ? 'Saved Contract Forms' : lang === 'ps' ? 'فرم‌های قرارداد ذخیره شده' : 'فرم‌های قرارداد ذخیره شده'}
          </h1>
          <Button onClick={() => setViewMode('create')}>
            {lang === 'en' ? 'Create New' : lang === 'ps' ? 'ایجاد جدید' : 'ایجاد جدید'}
          </Button>
        </div>

        <div className="grid gap-4">
          {savedForms.map((form) => (
            <Card key={form.id}>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{form.form_number}</h3>
                    <p className="text-sm text-slate-600">{form.customer_name}</p>
                    <p className="text-sm text-slate-600">{form.form_date}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-md mt-2 ${
                      form.status === 'draft' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      form.status === 'submitted' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      form.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {form.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleViewForm(form.id!)}>
                      {lang === 'en' ? 'View' : lang === 'ps' ? 'مشاهده' : 'مشاهده'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setSelectedForm(form); setViewMode('view'); }}>
                      🖨
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {lang === 'en' ? 'Contract Form' : lang === 'ps' ? 'فرم قرارداد' : 'فرم قرارداد'}
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setViewMode('saved')}>
            {lang === 'en' ? 'View Saved' : lang === 'ps' ? 'مشاهده ذخیره شده' : 'مشاهده ذخیره شده'}
          </Button>
          <Button onClick={handlePrint}>
            {lang === 'en' ? 'Print' : lang === 'ps' ? 'چاپ' : 'چاپ'}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="p-6">
          {formData.company_id && (
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-blue-800">{getCompanyName()}</h2>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <Field label={lang === 'en' ? 'Date:' : lang === 'ps' ? 'ناریخ:' : 'تاریخ:'}>
              <Input
                type="date"
                value={formData.form_date}
                onChange={(e) => setFormData({ ...formData, form_date: e.target.value })}
              />
            </Field>
            <Field label={lang === 'en' ? 'Customer Name:' : lang === 'ps' ? 'نام مشتری:' : 'نام مشتری:'}>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder={lang === 'en' ? 'e.g., ریاست پوهنتون کابل' : lang === 'ps' ? 'مثال: ریاست پوهنتون کابل' : 'مثال: ریاست پوهنتون کابل'}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <Field label={lang === 'en' ? 'Company (Optional):' : lang === 'ps' ? 'شرکت (اختیاری):' : 'شرکت (اختیاری):'}>
              <Select
                value={formData.company_id?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">{lang === 'en' ? 'Select Company' : lang === 'ps' ? 'شرکت را انتخاب کنید' : 'شرکت را انتخاب کنید'}</option>
                {dropdownData?.companies.map((company) => (
                  <option key={company.id} value={company.id.toString()}>
                    {company.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={lang === 'en' ? 'Office (Optional):' : lang === 'ps' ? 'دفتر (اختیاری):' : 'دفتر (اختیاری):'}>
              <Select
                value={formData.office_id?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, office_id: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">{lang === 'en' ? 'Select Office' : lang === 'ps' ? 'دفتر را انتخاب کنید' : 'دفتر را انتخاب کنید'}</option>
                {dropdownData?.offices.map((office) => (
                  <option key={office.id} value={office.id.toString()}>
                    {office.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-center px-4 py-3 text-sm font-semibold w-20">{lang === 'en' ? 'No.' : lang === 'ps' ? 'نمبر' : 'شماره'}</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Item Name' : lang === 'ps' ? 'نام جنس' : 'اسم جنس'}</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Specifications' : lang === 'ps' ? 'مشخصات' : 'مشخصات'}</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Unit' : lang === 'ps' ? 'واحد' : 'واحد'}</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Quantity' : lang === 'ps' ? 'مقدار' : 'مقدار'}</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Unit Price' : lang === 'ps' ? 'قیمت فی واحد' : 'قیمت فی واحد'}</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">{lang === 'en' ? 'Total' : lang === 'ps' ? 'مجموع' : 'مجموع'}</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="text-center px-4 py-3">{item.line_no}</td>
                    <td className="px-4 py-3">
                      <Input
                        value={item.item_name}
                        onChange={(e) => handleItemChange(item.id, 'item_name', e.target.value)}
                        placeholder={lang === 'en' ? 'Item name' : lang === 'ps' ? 'نام جنس' : 'اسم جنس'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={item.specifications}
                        onChange={(e) => handleItemChange(item.id, 'specifications', e.target.value)}
                        placeholder={lang === 'en' ? 'Specifications' : lang === 'ps' ? 'مشخصات' : 'مشخصات'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={item.unit_id?.toString() || ''}
                        onChange={(e) => handleItemChange(item.id, 'unit_id', e.target.value)}
                      >
                        <option value="">{lang === 'en' ? 'Unit' : lang === 'ps' ? 'واحد' : 'واحد'}</option>
                        {dropdownData?.units.map((unit) => (
                          <option key={unit.id} value={unit.id.toString()}>
                            {unit.name} ({unit.abbreviation})
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </td>
                    <td className="text-center px-4 py-3 font-bold">
                      {item.line_total.toFixed(2)}
                    </td>
                    <td className="text-center px-4 py-3">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={formData.items.length === 1}
                      >
                        🗑
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button onClick={handleAddItem} className="mt-4">
              ➕ {lang === 'en' ? 'Add Item' : lang === 'ps' ? 'افزودن آیتم' : 'افزودن آیتم'}
            </Button>
          </div>

          <div className="mb-6 text-right">
            <div className="text-lg font-bold">
              {lang === 'en' ? 'Grand Total:' : lang === 'ps' ? 'مجموع کل:' : 'مجموع کل:'}
            </div>
            <div className="text-2xl font-bold text-green-600">{calculateGrandTotal().toFixed(2)}</div>
          </div>

          <Field label={lang === 'en' ? 'Description:' : lang === 'ps' ? 'تشریحات:' : 'تشریحات:'}>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={lang === 'en' ? 'Enter description...' : lang === 'ps' ? 'تشریحات را وارد کنید...' : 'تشریحات را وارد کنید...'}
              rows={4}
            />
          </Field>

          <div className="flex justify-center">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (lang === 'en' ? 'Saving...' : lang === 'ps' ? 'در حال ذخیره...' : 'در حال ذخیره...') : (lang === 'en' ? 'Save Form' : lang === 'ps' ? 'ذخیره فرم' : 'ذخیره فرم')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
