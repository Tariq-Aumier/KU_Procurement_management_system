import { useState, useEffect } from "react";
import { useI18n } from "../contexts/I18nContext";
import { useApp } from "../contexts/AppContext";
import { cn } from "../utils/cn";

type FormType = "comparison" | "m2" | "m3" | "m3h";

// ==================== COMPARISON SHEET TYPES ====================
interface ComparisonSheet {
  id: number;
  rfq_document_number?: string;
  rfq_date?: string;
  implementing_agency?: string;
  requesting_department?: string;
  funding_source?: string;
  funder?: string;
  estimated_price: number;
  award_recommendation?: string;
  status: string;
  fiscal_year: string;
  created_at: string;
}

interface ComparisonItem {
  id: number;
  line_no: number;
  item_name: string;
  technical_description?: string;
  unit: string;
  quantity: number;
}

interface ComparisonBidder {
  id: number;
  name: string;
  address?: string;
  is_winner: boolean;
  grand_total: number;
  rank?: number;
  remarks?: string;
}

interface ComparisonBidderPrice {
  id: number;
  unit_price: number;
  line_total: number;
  remarks?: string;
}

// ==================== M-2 FORM TYPES ====================
interface M2Form {
  id: number;
  serial_number: string;
  date: string;
  requester_person?: string;
  requester_branch?: string;
  request_number?: string;
  total_amount: number;
  amount_in_words?: string;
  purchase_from?: string;
  purchase_committee_location?: string;
  purchase_committee_date?: string;
  approval_officer?: string;
  calculation_branch?: string;
  allocation_number?: string;
  private_number?: string;
  commitment_amount?: number;
  payment_order?: string;
  description?: string;
  m16_certifier?: string;
  m12_certifier?: string;
  status: string;
  created_at: string;
}

interface M2Item {
  id: number;
  line_no: number;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  estimated_price: number;
  paid_price: number;
}

// ==================== M-3 FORM TYPES ====================
interface M3Form {
  id: number;
  number: string;
  ministry_organization?: string;
  issue_date: string;
  purchase_request_number?: string;
  contractor_id_number?: string;
  // Account Code breakdown
  org_code?: string;
  project_code?: string;
  program_code?: string;
  fund_code?: string;
  type_code?: string;
  classification_code?: string;
  delivery_date?: string;
  delivery_place?: string;
  total_rent: number;
  benefit_determination?: string;
  benefit_accessible?: boolean;
  lease_conditions_exist?: boolean;
  receipt_report_date?: string;
  receipt_report_number?: string;
  // Section B signatures
  procurement_dept_signature?: string;
  procurement_dept_date?: string;
  registry_dept_signature?: string;
  registry_dept_date?: string;
  authorized_officer_signature?: string;
  authorized_officer_date?: string;
  contractor_signature?: string;
  contractor_date?: string;
  // Section C
  financial_controller_signature?: string;
  financial_controller_date?: string;
  remarks?: string;
  status: string;
  created_at: string;
  items?: M3Item[];
}

interface M3Item {
  id: number;
  line_no: number;
  description: string;
  type_code?: string;
  classification_code?: string;
  code?: string;
  quantity: number;
  unit: string;
  rent_per_unit: number;
  total_rent_value: number;
}

// ==================== M-3 (H) FORM TYPES (بیع مطلق) ====================
interface M3HForm {
  id: number;
  order_number?: string;
  purchasing_ministry?: string;
  issue_date: string;
  purchase_request_number?: string;
  contract_id_number?: string;
  // Account Code breakdown
  org_code?: string;
  project_code?: string;
  program_code?: string;
  fund_code?: string;
  type_code?: string;
  classification_code?: string;
  reason_code?: string;
  item_type_code?: string;
  delivery_date?: string;
  delivery_place?: string;
  total_price: number;
  payment_deferred?: boolean;
  payment_installments?: string;
  payment_immediate?: boolean;
  receipt_report_date?: string;
  receipt_report_number?: string;
  // Section B signatures
  procurement_dept_signature?: string;
  procurement_dept_date?: string;
  registry_dept_signature?: string;
  registry_dept_date?: string;
  authorized_officer_signature?: string;
  authorized_officer_date?: string;
  contractor_signature?: string;
  contractor_date?: string;
  // Section C
  financial_controller_signature?: string;
  financial_controller_date?: string;
  remarks?: string;
  status: string;
  created_at: string;
  created_by?: number;
  items?: M3HItem[];
}

interface M3HItem {
  id: number;
  line_no: number;
  description: string;
  type_code?: string;
  classification_code?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  m3h_form_id?: number;
}

export default function Forms() {
  const { isRTL, t, lang } = useI18n();
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<FormType>("comparison");

  // Comparison Sheet State
  const [comparisonSheets, setComparisonSheets] = useState<ComparisonSheet[]>([]);
  const [comparisonPagination, setComparisonPagination] = useState({ current_page: 1, last_page: 1, per_page: 7, total: 0 });
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonModalMode, setComparisonModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedComparisonSheet, setSelectedComparisonSheet] = useState<ComparisonSheet | null>(null);
  const [showComparisonDeleteConfirm, setShowComparisonDeleteConfirm] = useState(false);
  const [comparisonSheetToDelete, setComparisonSheetToDelete] = useState<number | null>(null);
  const [comparisonFormData, setComparisonFormData] = useState({
    rfq_document_number: "",
    rfq_date: new Date().toISOString().split('T')[0],
    implementing_agency: "",
    requesting_department: "",
    funding_source: "",
    funder: "",
    estimated_price: 0,
    award_recommendation: "",
    status: "draft",
    fiscal_year: "1405",
  });
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [comparisonBidders, setComparisonBidders] = useState<ComparisonBidder[]>([]);
  const [comparisonBidderPrices, setComparisonBidderPrices] = useState<Record<number, Record<number, ComparisonBidderPrice>>>({});

  // M-2 Form State
  const [m2Forms, setM2Forms] = useState<M2Form[]>([]);
  const [m2Pagination, setM2Pagination] = useState({ current_page: 1, last_page: 1, per_page: 7, total: 0 });
  const [showM2Modal, setShowM2Modal] = useState(false);
  const [m2ModalMode, setM2ModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedM2Form, setSelectedM2Form] = useState<M2Form | null>(null);
  const [m2FormData, setM2FormData] = useState({
    serial_number: "",
    date: new Date().toISOString().split('T')[0],
    requester_person: "",
    requester_branch: "",
    request_number: "",
    total_amount: 0,
    amount_in_words: "",
    purchase_from: "",
    purchase_committee_location: "",
    purchase_committee_date: "",
    approval_officer: "",
    calculation_branch: "",
    allocation_number: "",
    private_number: "",
    commitment_amount: 0,
    payment_order: "",
    description: "",
    m16_certifier: "",
    m12_certifier: "",
    status: "draft",
  });
  const [m2Items, setM2Items] = useState<M2Item[]>([]);

  // M-3 Form State
  const [m3Forms, setM3Forms] = useState<M3Form[]>([]);
  const [showM3Modal, setShowM3Modal] = useState(false);
  const [m3ModalMode, setM3ModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedM3Form, setSelectedM3Form] = useState<M3Form | null>(null);
  const [showM3DeleteConfirm, setShowM3DeleteConfirm] = useState(false);
  const [m3FormToDelete, setM3FormToDelete] = useState<number | null>(null);
  const [m3FormData, setM3FormData] = useState({
    number: "",
    ministry_organization: "",
    issue_date: new Date().toISOString().split('T')[0],
    purchase_request_number: "",
    contractor_id_number: "",
    org_code: "",
    project_code: "",
    program_code: "",
    fund_code: "",
    type_code: "",
    classification_code: "",
    delivery_date: "",
    delivery_place: "",
    total_rent: 0,
    benefit_determination: "",
    benefit_accessible: false,
    lease_conditions_exist: false,
    receipt_report_date: "",
    receipt_report_number: "",
    procurement_dept_signature: "",
    procurement_dept_date: "",
    registry_dept_signature: "",
    registry_dept_date: "",
    authorized_officer_signature: "",
    authorized_officer_date: "",
    contractor_signature: "",
    contractor_date: "",
    financial_controller_signature: "",
    financial_controller_date: "",
    remarks: "",
    status: "draft",
  });
  const [m3Items, setM3Items] = useState<M3Item[]>([]);

  // M-3 (H) Form State (بیع مطلق)
  const [m3hForms, setM3hForms] = useState<M3HForm[]>([]);
  const [m3hPagination, setM3hPagination] = useState({ current_page: 1, last_page: 1, per_page: 7, total: 0 });
  const [showM3hModal, setShowM3hModal] = useState(false);
  const [m3hModalMode, setM3hModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedM3hForm, setSelectedM3hForm] = useState<M3HForm | null>(null);
  const [m3hFormData, setM3hFormData] = useState({
    order_number: "",
    purchasing_ministry: "",
    issue_date: new Date().toISOString().split('T')[0],
    purchase_request_number: "",
    contract_id_number: "",
    org_code: "",
    project_code: "",
    program_code: "",
    fund_code: "",
    type_code: "",
    classification_code: "",
    reason_code: "",
    item_type_code: "",
    delivery_date: "",
    delivery_place: "",
    total_price: 0,
    payment_deferred: false,
    payment_installments: "",
    payment_immediate: false,
    receipt_report_date: "",
    receipt_report_number: "",
    procurement_dept_signature: "",
    procurement_dept_date: "",
    registry_dept_signature: "",
    registry_dept_date: "",
    authorized_officer_signature: "",
    authorized_officer_date: "",
    contractor_signature: "",
    contractor_date: "",
    financial_controller_signature: "",
    financial_controller_date: "",
    remarks: "",
    status: "draft",
  });
  const [m3hItems, setM3hItems] = useState<M3HItem[]>([]);

  // Load data
  useEffect(() => {
    loadComparisonSheets();
    loadM2Forms();
    loadM3Forms();
    loadM3hForms();
  }, []);

  const loadComparisonSheets = async (page = 1) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-workflow/comparison?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComparisonSheets(data.data);
        setComparisonPagination(data.pagination);
      } else {
        console.error('Failed to load comparison sheets');
      }
    } catch (error) {
      console.error('Error loading comparison sheets:', error);
    }
  };

  const loadM2Forms = async (page = 1) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-forms/m2?page=${page}&per_page=7`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setM2Forms(data.data);
        setM2Pagination(data.pagination);
      } else {
        console.error('Failed to load M-2 forms');
      }
    } catch (error) {
      console.error('Error loading M-2 forms:', error);
    }
  };

  const loadM3Forms = () => {
    const mockForms: M3Form[] = [
      {
        id: 1,
        number: "M3-2026-001",
        ministry_organization: "Ministry of Finance",
        issue_date: "2026-10-27",
        purchase_request_number: "PR-001",
        contractor_id_number: "CID-001",
        account_code: "ACC-001",
        delivery_date: "2026-11-27",
        delivery_place: "Kabul",
        total_rent: 55000,
        benefit_determination: "Benefit can be realized",
        receipt_report_date: "2026-10-27",
        receipt_report_number: "RR-001",
        status: "submitted",
        created_at: "2026-10-27T10:00:00",
      },
    ];
    setM3Forms(mockForms);
  };

  // Print handlers
  const handlePrint = (contentId: string | null, formType: FormType) => {
    let printContent: HTMLElement | null = null;

    if (contentId) {
      printContent = document.getElementById(contentId);
    } else if (formType === 'm3h') {
      printContent = document.getElementById('m3h-print-area');
    }

    if (!printContent) return;

    const printWindow = window.open('', '', 'width=1000,height=800');
    if (!printWindow) return;

    let headerContent = '';
    let additionalStyles = '';

    if (formType === 'comparison') {
      headerContent = `
        <div style="text-align: center; margin-bottom: 20px; padding: 10px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">جدول مقایسه و م</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">پوهنتون کابل</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Kabul University</p>
        </div>
      `;
    } else if (formType === 'm2') {
      // For M-2, create custom print format matching the image
      const formData = printContent.querySelector('.form-section');
      const itemsTable = printContent.querySelector('table');

      // Extract data from the form
      const getFieldValue = (label) => {
        const spans = printContent.querySelectorAll('span');
        for (let span of spans) {
          if (span.textContent.includes(label)) {
            const nextSibling = span.nextElementSibling;
            if (nextSibling) return nextSibling.textContent.trim();
          }
        }
        return '';
      };

      const date = getFieldValue('مورخ') || '';
      const serialNumber = getFieldValue('نمبر مسلسل') || '';
      const requesterPerson = getFieldValue('توسط کدام شخص') || '';
      const requesterBranch = getFieldValue('اسم شعبه') || '';
      const purchaseFrom = getFieldValue('خریداری از شخص') || '';
      const totalAmount = getFieldValue('مبلغ مجموعی') || '';
      const amountInWords = getFieldValue('مبلغ به حروف') || '';
      const committeeLocation = getFieldValue('محل امضاء') || '';
      const committeeDate = getFieldValue('تاریخ امضاء') || '';
      const allocationNumber = getFieldValue('نمبر تعهد') || '';
      const privateNumber = getFieldValue('نمبر خصوصی') || '';
      const commitmentAmount = getFieldValue('مبلغ تعهد') || '';
      const paymentOrder = getFieldValue('امر تادیه') || '';
      const description = getFieldValue('توضیحات') || '';

      // Extract items from table
      let itemsHTML = '';
      if (itemsTable) {
        const rows = itemsTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 7) {
            itemsHTML += `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[0].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px;">${cells[1].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[2].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[3].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[4].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[5].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[6].textContent.trim()}</td>
              </tr>
            `;
          }
        });
      }

      const m2Content = `
        <div>
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px; padding: 10px; background: linear-gradient(135deg, #065f46 0%, #10b981 100%); color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">فورمه م-2 نمبر مسلسل</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">امر خریداری نقدی برای جنس خدمات (بيع مطلق معجل)</p>
          </div>

          <!-- Form Details -->
          <div style="margin-bottom: 20px; padding: 15px; background: #ffffff; border: 2px solid #374151; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px;">
              <div><strong>مورخ:</strong> ${date}</div>
              <div><strong>نمبر مسلسل:</strong> ${serialNumber}</div>
              <div><strong>توسط کدام شخص درخواست شده است:</strong> ${requesterPerson}</div>
              <div><strong>اسم شعبه شخص درخواست کننده و نمبر:</strong> ${requesterBranch}</div>
              <div><strong>خریداری از شخص:</strong> ${purchaseFrom}</div>
              <div><strong>مبلغ مجموعی:</strong> ${totalAmount}</div>
              <div><strong>مبلغ به حروف:</strong> ${amountInWords}</div>
              <div><strong>محل امضاء هیئت خریداری:</strong> ${committeeLocation}</div>
              <div><strong>تاریخ امضاء هیئت خریداری:</strong> ${committeeDate}</div>
              <div><strong>نمبر تعهد:</strong> ${allocationNumber}</div>
              <div><strong>نمبر خصوصی:</strong> ${privateNumber}</div>
              <div><strong>مبلغ تعهد:</strong> ${commitmentAmount}</div>
              <div><strong>امر تادیه:</strong> ${paymentOrder}</div>
              <div style="grid-column: span 2;"><strong>توضیحات:</strong> ${description}</div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
              <thead>
                <tr style="background: #ffffff;">
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">#</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">تشریحات</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">واحد</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">مقدار</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">فیات</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">قیمت تخمینی</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">قیمت تادیه شده</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <!-- Calculation Branch Section -->
            <div style="margin-bottom: 15px; padding: 15px; background: #f9fafb; border: 2px solid #374151; border-radius: 6px;">
              <h3 style="font-weight: bold; color: #1f2937; margin-bottom: 10px; font-size: 14px;">شعبه محاسبه</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                <div><strong>مبلغ تعهد:</strong> ${commitmentAmount}</div>
                <div><strong>امر تادیه:</strong> ${paymentOrder}</div>
              </div>
            </div>

            <!-- Signature Sections -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #374151; border-radius: 4px;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #374151;">امضاء آمر منظور کننده</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #374151; border-radius: 4px;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #374151;">شعبه محاسبه</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #374151; border-radius: 4px;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #374151;">تصدیق کننده امضاء م-16</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #374151; border-radius: 4px;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #374151;">تصدیق کننده امضاء م-12</p>
              </div>
            </div>

            <!-- Note -->
            <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border: 2px solid #374151; border-radius: 4px;">
              <p style="font-size: 12px; color: #374151;">پولیکه در ستون 19 ذکر شده موجود است</p>
            </div>
          </div>
        </div>
      `;

      additionalStyles = `
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          font-family: 'Arial', 'Noto Sans Arabic', sans-serif;
          padding: 0;
          margin: 0;
          direction: rtl;
          background: white;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
        }
      `;

      const printDocument = printWindow.document;
      printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Print M-2 Form</title>
          <style>
            ${additionalStyles}
          </style>
        </head>
        <body>
          ${m2Content}
        </body>
        </html>
      `);
      printDocument.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      return;
    } else if (formType === 'm3h') {
      // For M-3 (H) (بیع مطلق), create print format matching the provided images
      const formData = printContent.querySelector('.form-section-a');
      const itemsTable = printContent.querySelector('table');
      const sectionB = printContent.querySelector('.form-section-b');
      const sectionC = printContent.querySelector('.form-section-c');

      // Extract data from the form
      const getFieldValue = (label) => {
        const spans = printContent.querySelectorAll('span');
        for (let span of spans) {
          if (span.textContent.includes(label)) {
            const nextSibling = span.nextElementSibling;
            if (nextSibling) return nextSibling.textContent.trim();
          }
        }
        return '';
      };

      const number = getFieldValue('1. شماره امر') || getFieldValue('شماره امر');
      const ministry = getFieldValue('2. وزارت/ارگان خریداری') || getFieldValue('وزارت/ارگان');
      const date = getFieldValue('3. تاریخ صدور') || getFieldValue('تاریخ صدور');
      const requestNumber = getFieldValue('4. شماره درخواست خریداری') || getFieldValue('شماره درخواست');
      const contractorId = getFieldValue('5. شماره هویت قراردادی') || getFieldValue('شماره هویت');
      const deliveryDate = getFieldValue('7. تاریخ تسلیمی') || getFieldValue('تاریخ تسلیمی');
      const deliveryPlace = getFieldValue('8. محل تسلیمی') || getFieldValue('محل تسلیمی');
      const totalPrice = getFieldValue('17. مجموع') || '0';

      // Extract account codes
      const orgCode = getFieldValue('کود سازمان') || '';
      const projectCode = getFieldValue('کود پروژه') || '';
      const programCode = getFieldValue('کود برنامه') || '';
      const fundCode = getFieldValue('کود صندوق') || '';
      const typeCode = getFieldValue('کود نوع') || '';
      const classificationCode = getFieldValue('کود تصنیف') || '';
      const reasonCode = getFieldValue('کود وجه') || '';
      const itemTypeCode = getFieldValue('کود نوع جنس') || '';

      // Extract items from table
      let itemsHTML = '';
      if (itemsTable) {
        const rows = itemsTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 8) {
            itemsHTML += `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[0].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px;">${cells[1].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[2].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[3].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[4].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[5].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[6].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[7].textContent.trim()}</td>
              </tr>
            `;
          }
        });
      }

      // Page 1: Header and Form Details
      const page1Content = `
        <div style="page-break-after: always;">
          <!-- Logo and Header -->
          <div style="text-align: center; margin-bottom: 15px;">
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 15px;">
              <img src="/images/finance-logo.png" alt="Ministry of Finance Logo" style="width: 120px; height: 120px; border-radius: 50%; border: 3px solid #1e3a8a; box-shadow: 0 4px 6px rgba(0,0,0,0.2); object-fit: cover;" />
            </div>
            <div style="border: 3px solid #1e3a8a; padding: 12px 20px; background: #ffffff; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #1e3a8a;">وزارت مالیه - ریاست عمومی خزاین</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #1e3a8a; font-weight: 600;">فورم - م - 3 (ه) امر خریداری بر اساس <span style="color: #1e3a8a; font-weight: bold;">بیع مطلق</span></p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #6b7280;">Ministry of Finance - General Directorate of Treasury</p>
            </div>
          </div>

          <!-- Section A: Form Details -->
          <div style="margin-bottom: 20px; padding: 15px; background: #ffffff; border: 2px solid #1e3a8a;">
            <h3 style="font-weight: bold; color: #1e3a8a; margin-bottom: 12px; font-size: 13px; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px;">بخش الف: این بخش توسط شعبه تدارکات خانه پری گردد</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px;">
              <div><strong>1. شماره امر:</strong> ${number}</div>
              <div><strong>2. وزارت/ارگان خریداری:</strong> ${ministry}</div>
              <div><strong>3. تاریخ صدور:</strong> ${date}</div>
              <div><strong>4. شماره درخواست خریداری:</strong> ${requestNumber}</div>
              <div><strong>5. شماره هویت قراردادی:</strong> ${contractorId}</div>
              <div style="grid-column: span 2;"><strong>کود نوع جنس:</strong> ${itemTypeCode}</div>
            </div>

            <!-- Account Code -->
            <div style="margin-bottom: 15px; padding: 10px; background: #f3f4f6; border: 1px solid #1e3a8a;">
              <p style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 8px;">6. کود حسابی (تخصیص)</p>
              <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; font-size: 11px;">
                <div><strong>کود سازمان (6):</strong><br>${orgCode}</div>
                <div><strong>کود پروژه (6):</strong><br>${projectCode}</div>
                <div><strong>کود برنامه (3):</strong><br>${programCode}</div>
                <div><strong>کود صندوق (3):</strong><br>${fundCode}</div>
                <div><strong>کود نوع (1):</strong><br>${typeCode}</div>
                <div><strong>کود تصنیف (3):</strong><br>${classificationCode}</div>
                <div><strong>کود وجه (5):</strong><br>${reasonCode}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px;">
              <div><strong>7. تاریخ تسلیمی:</strong> ${deliveryDate}</div>
              <div><strong>8. محل تسلیمی:</strong> ${deliveryPlace}</div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
              <thead>
                <tr style="background: #e0e7ff;">
                  <th style="border: 2px solid #1e3a8a; padding: 8px; text-align: center; font-weight: bold;">9. شماره</th>
                  <th style="border: 2px solid #1e3a8a; padding: 8px; text-align: center; font-weight: bold;">10. توضیح</th>
                  <th style="border: 2px solid #1e3a8a; padding: 8px; text-align: center; font-weight: bold;">11. کود نوع(1)</th>
                  <th style="border: 2px solid #1e3a8a; padding: 8px; text-align: center; font-weight: bold;">12. کود تصنیف(5)</th>
                  <th style="border: 2px solid #1e3a8a; padding: 8px; text-align: center; font-weight: bold;">13. مقدار</th>
                  <th style="border: 2px solid #1e3a8a; padding: 8px; text-align: center; font-weight: bold;">14. واحد</th>
                  <th style="border: 2px solid #1e3a8a; padding: 8px; text-align: center; font-weight: bold;">15. فیات</th>
                  <th style="border: 2px solid #1e3a8a; padding: 8px; text-align: center; font-weight: bold;">16. قیمت</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <!-- Total -->
            <div style="margin-bottom: 15px; padding: 10px; background: #fef3c7; border: 2px solid #1e3a8a;">
              <div style="display: flex; justify-between items-center;">
                <span style="font-size: 12px; font-weight: bold; color: #1e3a8a;">17. مجموع (مجموع ثمن)</span>
                <span style="font-size: 16px; font-weight: bold; color: #1e3a8a;">${totalPrice} AFN</span>
              </div>
            </div>

            <!-- Payment Options -->
            <div style="margin-bottom: 15px; grid-template-columns: 1fr 1fr 1fr; gap: 10px; display: grid;">
              <div style="padding: 10px; background: #f3f4f6; border: 1px solid #1e3a8a;">
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px;">18. پرداخت بگونه مؤجل</p>
                <div style="height: 20px; border-bottom: 1px solid #000;"></div>
              </div>
              <div style="padding: 10px; background: #f3f4f6; border: 1px solid #1e3a8a;">
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px;">19. پرداخت بگونه بالتقسیط</p>
                <div style="height: 20px; border-bottom: 1px solid #000;"></div>
              </div>
              <div style="padding: 10px; background: #f3f4f6; border: 1px solid #1e3a8a;">
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px;">20. پرداخت بگونه معجل</p>
                <div style="height: 20px; border-bottom: 1px solid #000;"></div>
              </div>
            </div>

            <!-- Receipt Report -->
            <div style="padding: 10px; background: #f3f4f6; border: 1px solid #1e3a8a;">
              <p style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 8px;">21. راپور رسید (1)</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div><strong>تاریخ:</strong><div style="height: 20px; border-bottom: 1px solid #000; margin-top: 5px;"></div></div>
                <div><strong>شماره:</strong><div style="height: 20px; border-bottom: 1px solid #000; margin-top: 5px;"></div></div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Page 2: Signature Sections
      const page2Content = `
        <div>
          <!-- Section B: Signatures -->
          <div style="margin-bottom: 20px; padding: 15px; background: #ffffff; border: 2px solid #1e3a8a;">
            <h3 style="font-weight: bold; color: #1e3a8a; margin-bottom: 15px; font-size: 13px;">بخش ب: مرور و منظوری</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #1e3a8a;">
                <div style="height: 80px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a;">22. شعبه تداركات (امضا و تاریخ)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                </div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #1e3a8a;">
                <div style="height: 80px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a;">23. شعبه دفترداری (امضا و تاریخ)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                </div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #1e3a8a;">
                <div style="height: 80px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a;">24. آمر ذیصلاح (امضا و تاریخ)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                </div>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #1e3a8a;">
                <div style="height: 80px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a;">25. قراردادی (امضا و تاریخ)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section C: Financial Controller -->
          <div style="padding: 15px; background: #ffffff; border: 2px solid #1e3a8a;">
            <h3 style="font-weight: bold; color: #1e3a8a; margin-bottom: 15px; font-size: 13px;">بخش ج: این بخش توسط کنترولر مالی خانه پری گردد</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #1e3a8a;">
                <div style="height: 80px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a;">26. کنترولر مالی (امضا و تاریخ)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                  <div style="height: 20px; border-bottom: 1px solid #000;"></div>
                </div>
              </div>
              <div>
                <p style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px;">27. ملاحظات</p>
                <div style="padding: 10px; background: white; border: 2px solid #1e3a8a; min-height: 120px; font-size: 12px;"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      additionalStyles = `
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          font-family: 'Arial', 'Noto Sans Arabic', sans-serif;
          padding: 0;
          margin: 0;
          direction: rtl;
          background: white;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
        }
      `;

      const printDocument = printWindow.document;
      printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Print M-3 (H) Form</title>
          <style>
            ${additionalStyles}
          </style>
        </head>
        <body>
          ${page1Content}
          ${page2Content}
        </body>
        </html>
      `);
      printDocument.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      return;
    } else if (formType === 'm3') {
      // For M-3, we need to create a two-page print format
      // Get the form data from the print content
      const formData = printContent.querySelector('.form-section-a');
      const itemsTable = printContent.querySelector('table');
      const sectionB = printContent.querySelector('.form-section-b');
      const sectionC = printContent.querySelector('.form-section-c');

      // Extract data from the form
      const getFieldValue = (label) => {
        const spans = printContent.querySelectorAll('span');
        for (let span of spans) {
          if (span.textContent.includes(label)) {
            const nextSibling = span.nextElementSibling;
            if (nextSibling) return nextSibling.textContent.trim();
          }
        }
        return '';
      };

      const number = getFieldValue('1. شماره') || getFieldValue('شماره:');
      const ministry = getFieldValue('2. وزارت') || getFieldValue('وزارت/ارگان:');
      const date = getFieldValue('3. تاریخ صدور') || getFieldValue('تاریخ صدور:');
      const requestNumber = getFieldValue('4. شماره درخواست') || getFieldValue('شماره درخواست:');
      const contractorId = getFieldValue('5. شماره هویت') || getFieldValue('شماره هویت قراردادی:');
      const accountCode = getFieldValue('6. کود حسابی') || '';
      const deliveryDate = getFieldValue('7. تاریخ تسلیمی') || getFieldValue('تاریخ تسلیمی:');
      const deliveryPlace = getFieldValue('8. محل تسليمي') || getFieldValue('محل تسليمي:');
      const totalRent = getFieldValue('17. مجموع اجرت') || '';
      const benefitDetermination = getFieldValue('18. تعیین منفعت') || '';
      const benefitAccessible = getFieldValue('19. منفعت مقدور') || '';
      const leaseConditions = getFieldValue('20. موجودیت شروط') || '';
      const receiptDate = getFieldValue('21. راپور رسید')?.split('تاریخ')[1]?.trim() || '';
      const receiptNumber = getFieldValue('21. راپور رسید')?.split('شماره')[1]?.trim() || '';

      // Extract items from table
      let itemsHTML = '';
      if (itemsTable) {
        const rows = itemsTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 8) {
            itemsHTML += `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[0].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px;">${cells[1].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[2].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[3].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[4].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[5].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[6].textContent.trim()}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${cells[7].textContent.trim()}</td>
              </tr>
            `;
          }
        });
      }

      // Page 1: Header and Form Details
      const page1Content = `
        <div style="page-break-after: always;">
          <!-- Logo and Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 15px;">
              <img src="/images/finance-logo.png" alt="Ministry of Finance Logo" style="width: 120px; height: 120px; border-radius: 50%; border: 3px solid #000; box-shadow: 0 4px 6px rgba(0,0,0,0.2); object-fit: cover;" />
            </div>
            <div style="border: 3px solid #000; padding: 12px 20px; background: #ffffff; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #000;">وزارت مالیه - ریاست عمومی خزاین</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #374151; font-weight: 600;">فورم - م - 3 (د) امر خریداری بر اساس <span style="color: #000; font-weight: bold;">عقد اجاره</span></p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #6b7280;">Ministry of Finance - General Directorate of Treasury</p>
            </div>
          </div>

          <!-- Section A: Form Details -->
          <div style="margin-bottom: 20px; padding: 15px; background: #ffffff; border: 2px solid #000;">
            <h3 style="font-weight: bold; color: #000; margin-bottom: 12px; font-size: 13px; border-bottom: 2px solid #000; padding-bottom: 5px;">بخش الف: این بخش توسط شعبه تدارکات خانه پری گردد</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px;">
              <div><strong>1. شماره:</strong> ${number}</div>
              <div><strong>2. وزارت/ارگان:</strong> ${ministry}</div>
              <div><strong>3. تاریخ صدور:</strong> ${date}</div>
              <div><strong>4. شماره درخواست:</strong> ${requestNumber}</div>
              <div><strong>5. شماره هویت قراردادی:</strong> ${contractorId}</div>
              <div style="grid-column: span 2;"><strong>6. کود حسابی:</strong> ${accountCode}</div>
              <div><strong>7. تاریخ تسلیمی:</strong> ${deliveryDate}</div>
              <div><strong>8. محل تسليمي:</strong> ${deliveryPlace}</div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">9. شماره</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">10. تعیین چیزی که به اجاره داده میشود</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">11. کود نوع(1) تصنیف(5)</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">12. کود</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">13. مقدار</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">14. واحد</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">15. اجرت فی واحد</th>
                  <th style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold;">16. ارزش اجرت</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
              <div style="grid-column: span 2;"><strong>17. مجموع اجرت:</strong> ${totalRent}</div>
              <div style="grid-column: span 2;"><strong>18. تعیین منفعت:</strong> ${benefitDetermination}</div>
              <div><strong>19. منفعت مقدور الاستيفاء باشد:</strong> ${benefitAccessible}</div>
              <div><strong>20. موجودیت شروط انعقاد اجاره:</strong> ${leaseConditions}</div>
              <div><strong>21. راپور رسید (1) - تاریخ:</strong> ${receiptDate}</div>
              <div><strong>21. راپور رسید (1) - شماره:</strong> ${receiptNumber}</div>
            </div>
          </div>
        </div>
      `;

      // Page 2: Signature Sections
      const page2Content = `
        <div>
          <!-- Section B: Signatures -->
          <div style="margin-bottom: 20px; padding: 15px; background: #ffffff; border: 2px solid #000;">
            <h3 style="font-weight: bold; color: #000; margin-bottom: 15px; font-size: 13px;">بخش ب: مرور و منظوری، امضاً عاقدین بمنظور تثبیث رضایت عقد کننده گان</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #000;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #000;">22. شعبه تداركات (امضا و تاریخ)</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #000;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #000;">23. شعبه دفترداری (امضا و تاریخ)</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #000;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #000;">24. آمر ذیصلاح (امضا و تاریخ)</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #000;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #000;">25. قراردادی (امضا و تاریخ)</p>
              </div>
            </div>
          </div>

          <!-- Section C: Financial Controller -->
          <div style="padding: 15px; background: #ffffff; border: 2px solid #000;">
            <h3 style="font-weight: bold; color: #000; margin-bottom: 15px; font-size: 13px;">بخش ج: این بخش توسط کنترولر مالی خانه پری گردد</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center; padding: 15px; background: white; border: 2px solid #000;">
                <div style="height: 60px; border-bottom: 2px solid #000; margin-bottom: 10px;"></div>
                <p style="font-size: 12px; font-weight: bold; color: #000;">26. کنترولر مالی (امضا و تاریخ)</p>
              </div>
              <div>
                <p style="font-size: 12px; font-weight: bold; color: #000; margin-bottom: 5px;">27. ملاحظات</p>
                <div style="padding: 10px; background: white; border: 2px solid #000; min-height: 80px; font-size: 12px;"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      additionalStyles = `
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          font-family: 'Arial', 'Noto Sans Arabic', sans-serif;
          padding: 0;
          margin: 0;
          direction: rtl;
          background: white;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
        }
      `;

      const printDocument = printWindow.document;
      printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Print M-3 Form</title>
          <style>
            ${additionalStyles}
          </style>
        </head>
        <body>
          ${page1Content}
          ${page2Content}
        </body>
        </html>
      `);
      printDocument.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      return;
    }

    additionalStyles = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: 'Arial', 'Noto Sans Arabic', sans-serif;
        padding: 0;
        margin: 0;
        direction: ${isRTL ? 'rtl' : 'ltr'};
        background: white;
      }
      .print-header {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        color: white;
        padding: 15px;
        text-align: center;
        margin-bottom: 20px;
        border-radius: 8px;
      }
      .print-header h1 {
        margin: 0;
        font-size: 22px;
        font-weight: bold;
      }
      .print-header p {
        margin: 5px 0 0 0;
        font-size: 13px;
        opacity: 0.95;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
        font-size: 12px;
      }
      th {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        border: 2px solid #374151;
        padding: 8px;
        text-align: center;
        font-weight: bold;
        color: #1f2937;
      }
      td {
        border: 1px solid #4b5563;
        padding: 6px 8px;
        text-align: left;
      }
      .form-section {
        margin-bottom: 20px;
        padding: 15px;
        background: #f9fafb;
        border: 1px solid #d1d5db;
        border-radius: 6px;
      }
      .form-section-a {
        background: #f3f4f6;
        border: 1px solid #9ca3af;
      }
      .form-section-b {
        background: #f0fdf4;
        border: 2px solid #16a34a;
      }
      .form-section-c {
        background: #eff6ff;
        border: 2px solid #2563eb;
      }
      .form-section-title {
        font-weight: bold;
        color: #1f2937;
        margin-bottom: 10px;
        font-size: 14px;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 5px;
      }
      .form-row {
        display: flex;
        margin-bottom: 10px;
        gap: 15px;
      }
      .form-field {
        flex: 1;
      }
      .form-label {
        font-weight: bold;
        color: #374151;
        font-size: 11px;
        margin-bottom: 3px;
      }
      .form-value {
        padding: 5px;
        background: white;
        border: 1px solid #9ca3af;
        border-radius: 3px;
        font-size: 12px;
      }
      .signature-section {
        margin-top: 30px;
        padding: 20px;
        background: #f0fdf4;
        border: 2px solid #16a34a;
        border-radius: 6px;
      }
      .signature-box {
        text-align: center;
        padding: 15px;
        margin: 10px 0;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 4px;
      }
      .signature-line {
        height: 50px;
        border-bottom: 2px solid #374151;
        margin-bottom: 8px;
      }
      .signature-label {
        font-size: 11px;
        color: #6b7280;
        font-weight: bold;
      }

      .total-row {
        background: #fef3c7;
        font-weight: bold;
      }
      .winner-row {
        background: #dcfce7;
        font-weight: bold;
      }
    `;

    const printDocument = printWindow.document;
    printDocument.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Print Form</title>
        <style>
          ${additionalStyles}
        </style>
      </head>
      <body>
        ${headerContent}
        <div style="padding: 10px;">
          ${printContent.innerHTML}
        </div>
      </body>
      </html>
    `);
    printDocument.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Comparison Sheet handlers
  const handleCreateComparison = () => {
    setComparisonModalMode("create");
    setSelectedComparisonSheet(null);
    setComparisonFormData({
      rfq_document_number: "",
      rfq_date: new Date().toISOString().split('T')[0],
      implementing_agency: "",
      requesting_department: "",
      funding_source: "",
      funder: "",
      estimated_price: 0,
      award_recommendation: "",
      status: "draft",
      fiscal_year: "1405",
    });
    setComparisonItems([]);
    setComparisonBidders([]);
    setComparisonBidderPrices({});
    setShowComparisonModal(true);
  };

  const handleViewComparison = (sheet: ComparisonSheet) => {
    setComparisonModalMode("view");
    setSelectedComparisonSheet(sheet);
    setComparisonFormData({
      rfq_document_number: sheet.rfq_document_number || "",
      rfq_date: sheet.rfq_date || "",
      implementing_agency: sheet.implementing_agency || "",
      requesting_department: sheet.requesting_department || "",
      funding_source: sheet.funding_source || "",
      funder: sheet.funder || "",
      estimated_price: sheet.estimated_price,
      award_recommendation: sheet.award_recommendation || "",
      status: sheet.status,
      fiscal_year: sheet.fiscal_year,
    });
    loadComparisonSheetDetails(sheet.id);
    setShowComparisonModal(true);
  };

  const handleEditComparison = (sheet: ComparisonSheet) => {
    setComparisonModalMode("edit");
    setSelectedComparisonSheet(sheet);
    setComparisonFormData({
      rfq_document_number: sheet.rfq_document_number || "",
      rfq_date: sheet.rfq_date || "",
      implementing_agency: sheet.implementing_agency || "",
      requesting_department: sheet.requesting_department || "",
      funding_source: sheet.funding_source || "",
      funder: sheet.funder || "",
      estimated_price: sheet.estimated_price,
      award_recommendation: sheet.award_recommendation || "",
      status: sheet.status,
      fiscal_year: sheet.fiscal_year,
    });
    loadComparisonSheetDetails(sheet.id);
    setShowComparisonModal(true);
  };

  const handleDeleteComparison = (id: number) => {
    setComparisonSheetToDelete(id);
    setShowComparisonDeleteConfirm(true);
  };

  const confirmDeleteComparison = async () => {
    if (comparisonSheetToDelete) {
      try {
        const token = sessionStorage.getItem('pms_access_token');
        const response = await fetch(`/api/v1/procurement-workflow/comparison/${comparisonSheetToDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          loadComparisonSheets(comparisonPagination.current_page);
          setShowComparisonDeleteConfirm(false);
          setComparisonSheetToDelete(null);
        } else {
          console.error('Failed to delete comparison sheet');
        }
      } catch (error) {
        console.error('Error deleting comparison sheet:', error);
      }
    }
  };

  const loadComparisonSheetDetails = async (sheetId: number) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-workflow/comparison/${sheetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sheet = data.data;

        setComparisonItems(sheet.items || []);
        setComparisonBidders(sheet.bidders || []);

        const prices: Record<number, Record<number, ComparisonBidderPrice>> = {};
        sheet.bidders?.forEach((bidder: any) => {
          prices[bidder.id] = {};
          bidder.prices?.forEach((price: any) => {
            prices[bidder.id][price.comparison_item_id] = {
              id: price.id,
              unit_price: price.unit_price,
              line_total: price.line_total,
            };
          });
        });
        setComparisonBidderPrices(prices);
      } else {
        console.error('Failed to load comparison sheet details');
      }
    } catch (error) {
      console.error('Error loading comparison sheet details:', error);
    }
  };

  const handleSaveComparison = async () => {
    try {
      const token = sessionStorage.getItem('pms_access_token');

      const bidderPricesPayload: Record<number, Record<number, any>> = {};
      comparisonBidders.forEach((bidder, bidderIndex) => {
        bidderPricesPayload[bidderIndex] = {};
        comparisonItems.forEach((item, itemIndex) => {
          const price = comparisonBidderPrices[bidder.id]?.[item.id];
          bidderPricesPayload[bidderIndex][itemIndex] = {
            unit_price: price?.unit_price || 0,
            line_total: price?.line_total || 0,
          };
        });
      });

      const payload = {
        ...comparisonFormData,
        items: comparisonItems.map((item) => ({
          item_name: item.item_name,
          technical_description: item.technical_description,
          unit_id: item.unit_id,
          quantity: item.quantity,
        })),
        bidders: comparisonBidders.map(bidder => ({
          name: bidder.name,
          address: bidder.address,
          is_winner: bidder.is_winner,
        })),
        bidder_prices: bidderPricesPayload,
      };

      let response;
      if (comparisonModalMode === "create") {
        response = await fetch('/api/v1/procurement-workflow/comparison', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (comparisonModalMode === "edit" && selectedComparisonSheet) {
        response = await fetch(`/api/v1/procurement-workflow/comparison/${selectedComparisonSheet.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response && response.ok) {
        loadComparisonSheets(comparisonPagination.current_page);
        setShowComparisonModal(false);
      } else {
        console.error('Failed to save comparison sheet');
      }
    } catch (error) {
      console.error('Error saving comparison sheet:', error);
    }
  };

  // M-2 Form handlers
  const handleCreateM2 = () => {
    setM2ModalMode("create");
    setSelectedM2Form(null);
    setM2FormData({
      serial_number: "",
      date: new Date().toISOString().split('T')[0],
      requester_person: "",
      requester_branch: "",
      request_number: "",
      total_amount: 0,
      amount_in_words: "",
      purchase_from: "",
      purchase_committee_location: "",
      purchase_committee_date: "",
      approval_officer: "",
      calculation_branch: "",
      allocation_number: "",
      private_number: "",
      commitment_amount: 0,
      payment_order: "",
      description: "",
      m16_certifier: "",
      m12_certifier: "",
      status: "draft",
    });
    setM2Items([]);
    setShowM2Modal(true);
  };

  const loadM2FormDetails = async (id: number) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-forms/m2/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.request_rows) {
          setM2Items(data.data.request_rows.map((row: any) => ({
            id: row.id,
            line_no: row.line_no,
            description: row.description,
            unit: row.unit,
            quantity: row.quantity,
            rate: row.unit_price,
            estimated_price: row.estimated_price,
            paid_price: row.paid_price,
          })));
        }
      }
    } catch (error) {
      console.error('Error loading M-2 form details:', error);
    }
  };

  const handleViewM2 = (form: M2Form) => {
    setM2ModalMode("view");
    setSelectedM2Form(form);
    setM2FormData({ ...form });
    loadM2FormDetails(form.id);
    setShowM2Modal(true);
  };

  const handleEditM2 = (form: M2Form) => {
    setM2ModalMode("edit");
    setSelectedM2Form(form);
    setM2FormData({ ...form });
    loadM2FormDetails(form.id);
    setShowM2Modal(true);
  };

  const handleDeleteM2 = async (id: number) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-forms/m2/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadM2Forms(m2Pagination.current_page);
      } else {
        console.error('Failed to delete M-2 form');
      }
    } catch (error) {
      console.error('Error deleting M-2 form:', error);
    }
  };

  const handleSaveM2 = async () => {
    try {
      const token = sessionStorage.getItem('pms_access_token');

      if (!token) {
        alert('Please login first');
        return;
      }

      const url = m2ModalMode === "create"
        ? `/api/v1/procurement-forms/m2`
        : `/api/v1/procurement-forms/m2/${selectedM2Form?.id}`;

      const method = m2ModalMode === "create" ? "POST" : "PATCH";

      const payload = {
        ...m2FormData,
        items: m2Items.map((item, index) => ({
          line_no: index + 1,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          rate: item.rate,
          estimated_price: item.estimated_price,
          paid_price: item.paid_price,
        })),
      };

      console.log('Saving M-2 form:', { url, method, payload });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (response.ok) {
        await loadM2Forms(m2Pagination.current_page);
        setShowM2Modal(false);
        alert('Form saved successfully!');
      } else {
        console.error('Failed to save M-2 form:', responseData);
        alert('Failed to save: ' + (responseData.error || JSON.stringify(responseData)));
      }
    } catch (error) {
      console.error('Error saving M-2 form:', error);
      alert('Error: ' + error.message);
    }
  };

  // M-3 Form handlers
  const handleCreateM3 = () => {
    setM3ModalMode("create");
    setSelectedM3Form(null);
    setM3FormData({
      number: "",
      ministry_organization: "",
      issue_date: new Date().toISOString().split('T')[0],
      purchase_request_number: "",
      contractor_id_number: "",
      org_code: "",
      project_code: "",
      program_code: "",
      fund_code: "",
      type_code: "",
      classification_code: "",
      delivery_date: "",
      delivery_place: "",
      total_rent: 0,
      benefit_determination: "",
      benefit_accessible: false,
      lease_conditions_exist: false,
      receipt_report_date: "",
      receipt_report_number: "",
      procurement_dept_signature: "",
      procurement_dept_date: "",
      registry_dept_signature: "",
      registry_dept_date: "",
      authorized_officer_signature: "",
      authorized_officer_date: "",
      contractor_signature: "",
      contractor_date: "",
      financial_controller_signature: "",
      financial_controller_date: "",
      remarks: "",
      status: "draft",
    });
    setM3Items([]);
    setShowM3Modal(true);
  };

  const handleViewM3 = (form: M3Form) => {
    setM3ModalMode("view");
    setSelectedM3Form(form);
    setM3FormData({ ...form });
    setM3Items(form.items || []);
    setShowM3Modal(true);
  };

  const handleEditM3 = (form: M3Form) => {
    setM3ModalMode("edit");
    setSelectedM3Form(form);
    setM3FormData({ ...form });
    setM3Items(form.items || []);
    setShowM3Modal(true);
  };

  const handleDeleteM3 = (id: number) => {
    setM3FormToDelete(id);
    setShowM3DeleteConfirm(true);
  };

  const confirmDeleteM3 = () => {
    if (m3FormToDelete) {
      setM3Forms(m3Forms.filter(f => f.id !== m3FormToDelete));
      setShowM3DeleteConfirm(false);
      setM3FormToDelete(null);
    }
  };

  const loadM3FormDetails = (formId: number) => {
    const mockItems: M3Item[] = [
      {
        id: 1,
        line_no: 1,
        description: "ترمیم اساسی دیزل پمپ",
        type_code: "1",
        classification_code: "5",
        code: "CODE-001",
        quantity: 1,
        unit: "ترمیم",
        rent_per_unit: 20000,
        total_rent_value: 20000,
      },
      {
        id: 2,
        line_no: 2,
        description: "ویرنگ کاری مکمل",
        type_code: "1",
        classification_code: "5",
        code: "CODE-002",
        quantity: 1,
        unit: "و برنگ",
        rent_per_unit: 15000,
        total_rent_value: 15000,
      },
      {
        id: 3,
        line_no: 3,
        description: "کونکه ماشین",
        type_code: "1",
        classification_code: "5",
        code: "CODE-003",
        quantity: 1,
        unit: "عدد",
        rent_per_unit: 20000,
        total_rent_value: 20000,
      },
    ];
    setM3Items(mockItems);
  };

  const loadM3hForms = async (page = 1) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-forms/m3h?page=${page}&per_page=7`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setM3hForms(data.data);
        setM3hPagination(data.pagination);
      } else {
        console.error('Failed to load M-3 (H) forms');
      }
    } catch (error) {
      console.error('Error loading M-3 (H) forms:', error);
    }
  };

  const handleSaveM3 = () => {
    // Calculate total rent from items
    const totalRent = m3Items.reduce((sum: number, item: any) => sum + (item.total_rent_value || 0), 0);

    const formDataWithTotal = {
      ...m3FormData,
      total_rent: totalRent,
      items: m3Items
    };

    if (m3ModalMode === "create") {
      const newForm: M3Form = {
        id: Date.now(),
        ...formDataWithTotal,
        created_at: new Date().toISOString(),
      };
      setM3Forms([...m3Forms, newForm]);
    } else if (m3ModalMode === "edit" && selectedM3Form) {
      setM3Forms(m3Forms.map(f => f.id === selectedM3Form.id ? { ...f, ...formDataWithTotal } : f));
    }
    setShowM3Modal(false);
  };

  // M-3 (H) Form handlers (بیع مطلق)
  const handleCreateM3h = () => {
    setM3hModalMode("create");
    setSelectedM3hForm(null);
    setM3hFormData({
      order_number: "",
      purchasing_ministry: "",
      issue_date: new Date().toISOString().split('T')[0],
      purchase_request_number: "",
      contract_id_number: "",
      org_code: "",
      project_code: "",
      program_code: "",
      fund_code: "",
      type_code: "",
      classification_code: "",
      reason_code: "",
      item_type_code: "",
      delivery_date: "",
      delivery_place: "",
      total_price: 0,
      payment_deferred: false,
      payment_installments: "",
      payment_immediate: false,
      receipt_report_date: "",
      receipt_report_number: "",
      procurement_dept_signature: "",
      procurement_dept_date: "",
      registry_dept_signature: "",
      registry_dept_date: "",
      authorized_officer_signature: "",
      authorized_officer_date: "",
      contractor_signature: "",
      contractor_date: "",
      financial_controller_signature: "",
      financial_controller_date: "",
      remarks: "",
      status: "draft",
    });
    setM3hItems([]);
    setShowM3hModal(true);
  };

  const handleViewM3h = async (form: M3HForm) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-forms/m3h/${form.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setM3hModalMode("view");
        setSelectedM3hForm(data.data);
        setM3hFormData({ ...data.data });
        setM3hItems(data.items || []);
        setShowM3hModal(true);
      } else {
        alert('Failed to load form details');
      }
    } catch (error) {
      console.error('Error loading M-3 (H) form details:', error);
      alert('Error loading form details');
    }
  };

  const handleEditM3h = async (form: M3HForm) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-forms/m3h/${form.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setM3hModalMode("edit");
        setSelectedM3hForm(data.data);
        setM3hFormData({ ...data.data });
        setM3hItems(data.items || []);
        setShowM3hModal(true);
      } else {
        alert('Failed to load form details');
      }
    } catch (error) {
      console.error('Error loading M-3 (H) form details:', error);
      alert('Error loading form details');
    }
  };

  const handleDeleteM3h = async (id: number) => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const response = await fetch(`/api/v1/procurement-forms/m3h/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        loadM3hForms(m3hPagination.current_page);
      } else {
        alert('Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting M-3 (H) form:', error);
      alert('Error deleting form');
    }
  };

  const handleSaveM3h = async () => {
    try {
      const token = sessionStorage.getItem('pms_access_token');
      const totalPrice = m3hItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);

      const formDataWithTotal = {
        ...m3hFormData,
        total_price: totalPrice,
        items: m3hItems
      };

      let response;
      if (m3hModalMode === "create") {
        response = await fetch('/api/v1/procurement-forms/m3h', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataWithTotal),
        });
      } else if (m3hModalMode === "edit" && selectedM3hForm) {
        response = await fetch(`/api/v1/procurement-forms/m3h/${selectedM3hForm.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataWithTotal),
        });
      }

      if (response && response.ok) {
        setShowM3hModal(false);
        loadM3hForms(m3hPagination.current_page);
      } else {
        const errorData = await response?.json();
        alert(errorData?.error || 'Failed to save form');
      }
    } catch (error) {
      console.error('Error saving M-3 (H) form:', error);
      alert('Error saving form');
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
      <main className="max-w-[1600px] mx-auto px-5 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {lang === "ps" || lang === "fa" ? "فرم‌ها" : "Forms"}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("comparison")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === "comparison"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {lang === "ps" || lang === "fa" ? "جدول مقایسه" : "Comparison Sheet"}
          </button>
          <button
            onClick={() => setActiveTab("m2")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === "m2"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            فورم M-2
          </button>
          <button
            onClick={() => setActiveTab("m3")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === "m3"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            فورم M-3 /بیع اجاره
          </button>
          <button
            onClick={() => setActiveTab("m3h")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === "m3h"
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            فورم - م-3 (ه)/بیع مطلق
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "comparison" && (
          <ComparisonSheetTab
            sheets={comparisonSheets}
            pagination={comparisonPagination}
            onPageChange={loadComparisonSheets}
            onCreate={handleCreateComparison}
            onView={handleViewComparison}
            onEdit={handleEditComparison}
            onDelete={handleDeleteComparison}
            onPrint={(sheet: any) => handleViewComparison(sheet)}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {activeTab === "m2" && (
          <M2FormTab
            forms={m2Forms}
            pagination={m2Pagination}
            onPageChange={loadM2Forms}
            onCreate={handleCreateM2}
            onView={handleViewM2}
            onEdit={handleEditM2}
            onDelete={handleDeleteM2}
            onPrint={(form: any) => handleViewM2(form)}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {activeTab === "m3" && (
          <M3FormTab
            forms={m3Forms}
            onCreate={handleCreateM3}
            onView={handleViewM3}
            onEdit={handleEditM3}
            onDelete={handleDeleteM3}
            onPrint={(form: any) => handleViewM3(form)}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {activeTab === "m3h" && (
          <M3HFormTab
            forms={m3hForms}
            pagination={m3hPagination}
            onPageChange={loadM3hForms}
            onCreate={handleCreateM3h}
            onView={handleViewM3h}
            onEdit={handleEditM3h}
            onDelete={handleDeleteM3h}
            onPrint={(form: any) => handleViewM3h(form)}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {/* Comparison Sheet Modal */}
        {showComparisonModal && (
          <ComparisonSheetModal
            mode={comparisonModalMode}
            formData={comparisonFormData}
            items={comparisonItems}
            bidders={comparisonBidders}
            bidderPrices={comparisonBidderPrices}
            onChangeFormData={setComparisonFormData}
            onChangeItems={setComparisonItems}
            onChangeBidders={setComparisonBidders}
            onChangeBidderPrices={setComparisonBidderPrices}
            onSave={handleSaveComparison}
            onClose={() => setShowComparisonModal(false)}
            onPrint={() => handlePrint("comparison-print-area", "comparison")}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {/* M-2 Form Modal */}
        {showM2Modal && (
          <M2FormModal
            mode={m2ModalMode}
            formData={m2FormData}
            items={m2Items}
            onChangeFormData={setM2FormData}
            onChangeItems={setM2Items}
            onSave={handleSaveM2}
            onClose={() => setShowM2Modal(false)}
            onPrint={() => handlePrint("m2-print-area", "m2")}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {/* M-3 Form Modal */}
        {showM3Modal && (
          <M3FormModal
            mode={m3ModalMode}
            formData={m3FormData}
            items={m3Items}
            onChangeFormData={setM3FormData}
            onChangeItems={setM3Items}
            onSave={() => handleSaveM3()}
            onClose={() => setShowM3Modal(false)}
            onPrint={() => handlePrint("m3-print-area", "m3")}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {/* M-3 (H) Form Modal */}
        {showM3hModal && (
          <M3HFormModal
            mode={m3hModalMode}
            formData={m3hFormData}
            items={m3hItems}
            onChangeFormData={setM3hFormData}
            onChangeItems={setM3hItems}
            onSave={() => handleSaveM3h()}
            onClose={() => setShowM3hModal(false)}
            onPrint={() => handlePrint("m3h-print-area", "m3h")}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {/* Delete Confirmation Modals */}
        {showComparisonDeleteConfirm && (
          <DeleteConfirmModal
            title={lang === "ps" || lang === "fa" ? "تایید حذف" : "Confirm Delete"}
            message={lang === "ps" || lang === "fa" ? "آیا مطمئن هستید که می‌خواهید این جدول مقایسه را حذف کنید؟" : "Are you sure you want to delete this comparison sheet?"}
            onConfirm={confirmDeleteComparison}
            onCancel={() => setShowComparisonDeleteConfirm(false)}
            lang={lang}
          />
        )}



        {showM3DeleteConfirm && (
          <DeleteConfirmModal
            title={lang === "ps" || lang === "fa" ? "تایید حذف" : "Confirm Delete"}
            message={lang === "ps" || lang === "fa" ? "آیا مطمئن هستید که می‌خواهید این فرم M-3 /بیع اجاره را حذف کنید؟" : "Are you sure you want to delete this M-3 / بیع اجاره form?"}
            onConfirm={confirmDeleteM3}
            onCancel={() => setShowM3DeleteConfirm(false)}
            lang={lang}
          />
        )}
      </main>
    </div>
  );
}

// ==================== TAB COMPONENTS ====================

function ComparisonSheetTab({ sheets, pagination, onPageChange, onCreate, onView, onEdit, onDelete, onPrint, lang, isRTL }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {lang === "ps" || lang === "fa" ? "جدول مقایسه" : "Comparison Sheets"}
        </h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {lang === "ps" || lang === "fa" ? "جدید +" : "+ New"}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {lang === "ps" || lang === "fa" ? "شماره سند" : "Document No"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {lang === "ps" || lang === "fa" ? "تاریخ" : "Date"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {lang === "ps" || lang === "fa" ? "اداره" : "Agency"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {lang === "ps" || lang === "fa" ? "قیمت تخمینی" : "Est. Price"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {lang === "ps" || lang === "fa" ? "وضعیت" : "Status"}
              </th>
              <th className={cn(
                "py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                lang === "ps" || lang === "fa" ? "pl-16 text-left" : "px-4 text-right"
              )}>
                {lang === "ps" || lang === "fa" ? "عملیات" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {sheets.map((sheet: any) => (
              <tr key={sheet.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{sheet.rfq_document_number}</td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{sheet.rfq_date}</td>
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{sheet.implementing_agency}</td>
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{sheet.estimated_price.toLocaleString()} AFN</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                    sheet.status === "submitted" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                    sheet.status === "draft" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" :
                    "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                  )}>
                    {sheet.status}
                  </span>
                </td>
                <td className={cn(
                  "py-3",
                  lang === "ps" || lang === "fa" ? "pl-16 text-left" : "px-4 text-right"
                )}>
                  <div className={cn("flex items-center gap-2", lang === "ps" || lang === "fa" ? "justify-start" : "justify-end")}>
                    <button onClick={() => onView(sheet)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "لید" : lang === "fa" ? "مشاهده" : "View"}
                    </button>
                    <button onClick={() => onEdit(sheet)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "سمون" : lang === "fa" ? "ویرایش" : "Edit"}
                    </button>
                    <button onClick={() => onPrint && onPrint(sheet)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "چاپ" : lang === "fa" ? "چاپ" : "Print"}
                    </button>
                    <button onClick={() => onDelete(sheet.id)} className="px-2 py-1 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors">
                      {lang === "ps" ? "حذف" : lang === "fa" ? "حذف" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {lang === "ps" || lang === "fa"
              ? `صفحه ${pagination.current_page} از ${pagination.last_page} - مجموع ${pagination.total}`
              : `Page ${pagination.current_page} of ${pagination.last_page} - Total ${pagination.total}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              {lang === "ps" || lang === "fa" ? "قبلی" : "Previous"}
            </button>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "px-3 py-1 text-sm rounded transition-colors",
                  page === pagination.current_page
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              {lang === "ps" || lang === "fa" ? "بعدی" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function M2FormTab({ forms, pagination, onPageChange, onCreate, onView, onEdit, onDelete, onPrint, lang, isRTL }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">فورم M-2</h2>
        <button onClick={onCreate} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">{lang === "ps" || lang === "fa" ? "جدید +" : "+ New"}</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="pr-12 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "نمبر مسلسل" : "Serial No"}</th>
              <th className="pr-12 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "تاریخ" : "Date"}</th>
              <th className="pr-12 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "شخص درخواست کننده" : "Requester"}</th>
              <th className="pr-12 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "مبلغ" : "Amount"}</th>
              <th className="pr-12 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "وضعیت" : "Status"}</th>
              <th className={cn(
                "py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                lang === "ps" || lang === "fa" ? "pl-16 text-left" : "px-4 text-right"
              )}>{lang === "ps" || lang === "fa" ? "عملیات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {forms.map((form: any) => (
              <tr key={form.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="pr-12 py-3 text-sm text-slate-900 dark:text-slate-100 text-right">{form.serial_number}</td>
                <td className="pr-12 py-3 text-sm text-slate-600 dark:text-slate-400 text-right">{form.date}</td>
                <td className="pr-12 py-3 text-sm text-slate-900 dark:text-slate-100 text-right">{form.requester_person}</td>
                <td className="pr-12 py-3 text-sm text-slate-900 dark:text-slate-100 text-right">{form.total_amount.toLocaleString()} AFN</td>
                <td className="pr-12 py-3 text-right">
                  <span className={cn("inline-flex px-2 py-1 text-xs font-medium rounded-full", form.status === "submitted" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300")}>{form.status}</span>
                </td>
                <td className={cn(
                  "py-3",
                  lang === "ps" || lang === "fa" ? "pl-16 text-left" : "px-4 text-right"
                )}>
                  <div className={cn("flex items-center gap-2", lang === "ps" || lang === "fa" ? "justify-start" : "justify-end")}>
                    <button onClick={() => onView(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "لید" : lang === "fa" ? "مشاهده" : "View"}
                    </button>
                    <button onClick={() => onEdit(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "سمون" : lang === "fa" ? "ویرایش" : "Edit"}
                    </button>
                    <button onClick={() => onPrint && onPrint(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "چاپ" : lang === "fa" ? "چاپ" : "Print"}
                    </button>
                    <button onClick={() => onDelete(form.id)} className="px-2 py-1 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors">
                      {lang === "ps" ? "حذف" : lang === "fa" ? "حذف" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {lang === "ps" || lang === "fa"
              ? `صفحه ${pagination.current_page} از ${pagination.last_page} - مجموع ${pagination.total}`
              : `Page ${pagination.current_page} of ${pagination.last_page} - Total ${pagination.total}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              {lang === "ps" || lang === "fa" ? "قبلی" : "Previous"}
            </button>
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "px-3 py-1 text-sm rounded transition-colors",
                  page === pagination.current_page
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              {lang === "ps" || lang === "fa" ? "بعدی" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function M3FormTab({ forms, onCreate, onView, onEdit, onDelete, onPrint, lang, isRTL }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const totalPages = Math.ceil(forms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentForms = forms.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">فورم M-3 /بیع اجاره</h2>
        <button onClick={onCreate} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">{lang === "ps" || lang === "fa" ? "جدید +" : "+ New"}</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className={cn(
                "py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                lang === "ps" || lang === "fa" ? "pr-16 text-right" : "px-4 text-left"
              )}>{lang === "ps" || lang === "fa" ? "شماره" : "Number"}</th>
              <th className={cn(
                "py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                lang === "ps" || lang === "fa" ? "pr-12 text-right" : "px-4 text-left"
              )}>{lang === "ps" || lang === "fa" ? "تاریخ صدور" : "Issue Date"}</th>
              <th className={cn(
                "py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                lang === "ps" || lang === "fa" ? "pr-12 text-right" : "px-4 text-left"
              )}>{lang === "ps" || lang === "fa" ? "وزارت/ارگان" : "Ministry/Org"}</th>
              <th className={cn(
                "py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                lang === "ps" || lang === "fa" ? "pr-8 text-right" : "px-4 text-left"
              )}>{lang === "ps" || lang === "fa" ? "مجموع اجرت" : "Total Rent"}</th>
              <th className={cn(
                "py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                lang === "ps" || lang === "fa" ? "pr-12 text-right" : "px-4 text-left"
              )}>{lang === "ps" || lang === "fa" ? "وضعیت" : "Status"}</th>
              <th className={cn(
                "py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider",
                lang === "ps" || lang === "fa" ? "pl-16 text-left" : "px-4 text-right"
              )}>{lang === "ps" || lang === "fa" ? "عملیات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {currentForms.map((form: any) => (
              <tr key={form.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className={cn(
                  "py-3 text-sm text-slate-900 dark:text-slate-100",
                  lang === "ps" || lang === "fa" ? "pr-16 text-right" : "px-4 text-left"
                )}>{form.number}</td>
                <td className={cn(
                  "py-3 text-sm text-slate-600 dark:text-slate-400",
                  lang === "ps" || lang === "fa" ? "pr-12 text-right" : "px-4 text-left"
                )}>{form.issue_date}</td>
                <td className={cn(
                  "py-3 text-sm text-slate-900 dark:text-slate-100",
                  lang === "ps" || lang === "fa" ? "pr-12 text-right" : "px-4 text-left"
                )}>{form.ministry_organization}</td>
                <td className={cn(
                  "py-3 text-sm text-slate-900 dark:text-slate-100",
                  lang === "ps" || lang === "fa" ? "pr-8 text-right" : "px-4 text-left"
                )}>{form.total_rent.toLocaleString()} AFN</td>
                <td className={cn(
                  "py-3",
                  lang === "ps" || lang === "fa" ? "pr-12 text-right" : "px-4 text-left"
                )}>
                  <span className={cn("inline-flex px-2 py-1 text-xs font-medium rounded-full", form.status === "submitted" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300")}>{form.status}</span>
                </td>
                <td className={cn(
                  "py-3",
                  lang === "ps" || lang === "fa" ? "pl-16 text-left" : "px-4 text-right"
                )}>
                  <div className={cn("flex items-center gap-2", lang === "ps" || lang === "fa" ? "justify-start" : "justify-end")}>
                    <button onClick={() => onView(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "لید" : lang === "fa" ? "مشاهده" : "View"}
                    </button>
                    <button onClick={() => onEdit(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "سمون" : lang === "fa" ? "ویرایش" : "Edit"}
                    </button>
                    <button onClick={() => onPrint && onPrint(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "چاپ" : lang === "fa" ? "چاپ" : "Print"}
                    </button>
                    <button onClick={() => onDelete(form.id)} className="px-2 py-1 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors">
                      {lang === "ps" ? "حذف" : lang === "fa" ? "حذف" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {lang === "ps" || lang === "fa" ? "صفحه" : "Page"} {currentPage} {lang === "ps" || lang === "fa" ? "از" : "of"} {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-slate-700 dark:text-slate-300 transition-colors"
            >
              {lang === "ps" || lang === "fa" ? "قبلی" : "Previous"}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  currentPage === page
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-slate-700 dark:text-slate-300 transition-colors"
            >
              {lang === "ps" || lang === "fa" ? "بعدی" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MODAL COMPONENTS ====================

function ComparisonSheetModal({ mode, formData, items, bidders, bidderPrices, onChangeFormData, onChangeItems, onChangeBidders, onChangeBidderPrices, onSave, onClose, onPrint, lang, isRTL }: any) {
  const addItem = () => {
    const newItem = { id: Date.now(), line_no: items.length + 1, item_name: "", technical_description: "", unit_id: null, quantity: 0 };
    onChangeItems([...items, newItem]);
  };

  const addBidder = () => {
    const newBidder = { id: Date.now(), name: "", address: "", is_winner: false, grand_total: 0, rank: bidders.length + 1 };
    onChangeBidders([...bidders, newBidder]);
  };

  const updateBidderPrice = (bidderId: number, itemId: number, field: string, value: number) => {
    const newPrices = { ...bidderPrices };
    if (!newPrices[bidderId]) {
      newPrices[bidderId] = {};
    }
    if (!newPrices[bidderId][itemId]) {
      newPrices[bidderId][itemId] = { id: Date.now(), unit_price: 0, line_total: 0 };
    }
    newPrices[bidderId][itemId][field] = value;
    onChangeBidderPrices(newPrices);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {mode === "view" ? (lang === "ps" || lang === "fa" ? "مشاهده جدول مقایسه" : "View Comparison Sheet") :
             mode === "edit" ? (lang === "ps" || lang === "fa" ? "ویرایش جدول مقایسه" : "Edit Comparison Sheet") :
             (lang === "ps" || lang === "fa" ? "جدید جدول مقایسه" : "New Comparison Sheet")}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div id="comparison-print-area" className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
            <div className="text-center mb-6 pb-4 border-b-2 border-slate-800 dark:border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{lang === "ps" || lang === "fa" ? "جدول مقایسه" : "Comparison Sheet"}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">{lang === "ps" || lang === "fa" ? "پوهنتون کابل" : "Kabul University"}</p>
            </div>

            {mode !== "view" ? (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "شماره سند درخواست نرخ گیری" : "RFQ Document No"}</label>
                  <input type="text" value={formData.rfq_document_number} onChange={(e) => onChangeFormData({ ...formData, rfq_document_number: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "تاریخ" : "Date"}</label>
                  <input type="date" value={formData.rfq_date} onChange={(e) => onChangeFormData({ ...formData, rfq_date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "اداره تطبیق کننده" : "Implementing Agency"}</label>
                  <input type="text" value={formData.implementing_agency} onChange={(e) => onChangeFormData({ ...formData, implementing_agency: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "اداره درخواست کننده" : "Requesting Department"}</label>
                  <input type="text" value={formData.requesting_department} onChange={(e) => onChangeFormData({ ...formData, requesting_department: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "منبع وجوه مالی" : "Funding Source"}</label>
                  <input type="text" value={formData.funding_source} onChange={(e) => onChangeFormData({ ...formData, funding_source: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "تمویل کننده" : "Funder"}</label>
                  <input type="text" value={formData.funder} onChange={(e) => onChangeFormData({ ...formData, funder: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "قیمت تخمینی" : "Estimated Price"}</label>
                  <input type="number" value={formData.estimated_price} onChange={(e) => onChangeFormData({ ...formData, estimated_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "سال مالی" : "Fiscal Year"}</label>
                  <input type="text" value={formData.fiscal_year} onChange={(e) => onChangeFormData({ ...formData, fiscal_year: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><span className="font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "شماره سند:" : "Document No:"}</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.rfq_document_number}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "تاریخ:" : "Date:"}</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.rfq_date}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "اداره تطبیق کننده:" : "Implementing Agency:"}</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.implementing_agency}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "اداره درخواست کننده:" : "Requesting Department:"}</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.requesting_department}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "منبع وجوه مالی:" : "Funding Source:"}</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.funding_source}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "تمویل کننده:" : "Funder:"}</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.funder}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "قیمت تخمینی:" : "Estimated Price:"}</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.estimated_price.toLocaleString()} AFN</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "سال مالی:" : "Fiscal Year:"}</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.fiscal_year}</span></div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lang === "ps" || lang === "fa" ? "اقلام" : "Items"}</h3>
                {mode !== "view" && <button onClick={addItem} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors">{lang === "ps" || lang === "fa" ? "+ افزودن" : "+ Add Item"}</button>}
              </div>
              <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">#</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "نام قلم" : "Item Name"}</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "توضیحات فنی" : "Technical Description"}</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "واحد" : "Unit"}</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "مقدار" : "Quantity"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {items.map((item: any, index: number) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{index + 1}</td>
                        <td className="px-3 py-2">
                          {mode !== "view" ? (
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].item_name = e.target.value;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          ) : (
                            <span className="text-slate-900 dark:text-slate-100">{item.item_name}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode !== "view" ? (
                            <input
                              type="text"
                              value={item.technical_description || ""}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].technical_description = e.target.value;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          ) : (
                            <span className="text-slate-900 dark:text-slate-100">{item.technical_description || "-"}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode !== "view" ? (
                            <input
                              type="text"
                              value={item.unit || ""}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].unit = e.target.value;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          ) : (
                            <span className="text-slate-900 dark:text-slate-100">{item.unit || "-"}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode !== "view" ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].quantity = parseFloat(e.target.value) || 0;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          ) : (
                            <span className="text-slate-900 dark:text-slate-100">{item.quantity}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lang === "ps" || lang === "fa" ? "شرکت‌ها" : "Companies"}</h3>
                {mode !== "view" && <button onClick={addBidder} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors">{lang === "ps" || lang === "fa" ? "+ افزودن شرکت" : "+ Add Company"}</button>}
              </div>
              <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "نام شرکت" : "Company Name"}</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "آدرس" : "Address"}</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">{lang === "ps" || lang === "fa" ? "برنده" : "Winner"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {bidders.map((bidder: any, index: number) => (
                      <tr key={bidder.id}>
                        <td className="px-3 py-2">
                          {mode !== "view" ? (
                            <input
                              type="text"
                              value={bidder.name}
                              onChange={(e) => {
                                const newBidders = [...bidders];
                                newBidders[index].name = e.target.value;
                                onChangeBidders(newBidders);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          ) : (
                            <span className="text-slate-900 dark:text-slate-100">{bidder.name}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode !== "view" ? (
                            <input
                              type="text"
                              value={bidder.address || ""}
                              onChange={(e) => {
                                const newBidders = [...bidders];
                                newBidders[index].address = e.target.value;
                                onChangeBidders(newBidders);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          ) : (
                            <span className="text-slate-900 dark:text-slate-100">{bidder.address || "-"}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode !== "view" ? (
                            <input
                              type="checkbox"
                              checked={bidder.is_winner}
                              onChange={(e) => {
                                const newBidders = [...bidders];
                                newBidders[index].is_winner = e.target.checked;
                                onChangeBidders(newBidders);
                              }}
                              className="rounded border-slate-300 dark:border-slate-600"
                            />
                          ) : (
                            <span className={bidder.is_winner ? "text-green-600 font-bold" : "text-slate-600"}>
                              {bidder.is_winner ? (lang === "ps" || lang === "fa" ? "بله" : "Yes") : (lang === "ps" || lang === "fa" ? "خیر" : "No")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{lang === "ps" || lang === "fa" ? "جدول مقایسه قیمت" : "Price Comparison Table"}</h3>
              <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">{lang === "ps" || lang === "fa" ? "قلم" : "Item"}</th>
                      {bidders.map((bidder: any) => (
                        <th key={bidder.id} className="px-3 py-2 text-center font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">{bidder.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600">{item.item_name}</td>
                        {bidders.map((bidder: any) => (
                          <td key={bidder.id} className="px-3 py-2 text-center border border-slate-300 dark:border-slate-600">
                            {mode !== "view" ? (
                              <input
                                type="number"
                                step="0.01"
                                value={bidderPrices[bidder.id]?.[item.id]?.unit_price || 0}
                                onChange={(e) => updateBidderPrice(bidder.id, item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs text-center"
                              />
                            ) : (
                              <span className="text-slate-900 dark:text-slate-100">{(bidderPrices[bidder.id]?.[item.id]?.unit_price || 0).toFixed(2)}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === "ps" || lang === "fa" ? "پیشنهاد اعطا" : "Award Recommendation"}</label>
              {mode === "view" ? <p className="text-slate-900 dark:text-slate-100">{formData.award_recommendation || "-"}</p> : <textarea value={formData.award_recommendation} onChange={(e) => onChangeFormData({ ...formData, award_recommendation: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 dark:border-slate-600 mb-2"></div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{lang === "ps" || lang === "fa" ? "تایید کننده" : "Certifier"}</p>
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 dark:border-slate-600 mb-2"></div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{lang === "ps" || lang === "fa" ? "منظور کننده ۱" : "Approver 1"}</p>
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 dark:border-slate-600 mb-2"></div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{lang === "ps" || lang === "fa" ? "منظور کننده ۲" : "Approver 2"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          {mode === "view" && <button onClick={onPrint} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">{lang === "ps" || lang === "fa" ? "چاپ" : "Print"}</button>}
          {mode !== "view" && <button onClick={onSave} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">{lang === "ps" || lang === "fa" ? "ذخیره" : "Save"}</button>}
          <button onClick={onClose} className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">{lang === "ps" || lang === "fa" ? "بستن" : "Close"}</button>
        </div>
      </div>
    </div>
  );
}

function M2FormModal({ mode, formData, items, onChangeFormData, onChangeItems, onSave, onClose, onPrint, lang, isRTL }: any) {
  const addItem = () => {
    const newItem = { id: Date.now(), line_no: items.length + 1, description: "", unit: "", quantity: 0, rate: 0, estimated_price: 0, paid_price: 0 };
    onChangeItems([...items, newItem]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">فورم M-2 {mode === "view" ? "(مشاهده)" : mode === "edit" ? "(ویرایش)" : "(جدید)"}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div id="m2-print-area" className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
            <div className="text-center mb-6 pb-4 border-b-2 border-slate-800 dark:border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">فورمه م-2 نمبر مسلسل</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">امر خریداری نقدی برای جنس خدمات (بيع مطلق معجل)</p>
            </div>

            {mode !== "view" ? (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مورخ</label>
                  <input type="date" value={formData.date} onChange={(e) => onChangeFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نمبر مسلسل</label>
                  <input type="text" value={formData.serial_number} onChange={(e) => onChangeFormData({ ...formData, serial_number: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توسط کدام شخص درخواست شده است</label>
                  <input type="text" value={formData.requester_person} onChange={(e) => onChangeFormData({ ...formData, requester_person: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم شعبه شخص درخواست کننده و نمبر</label>
                  <input type="text" value={formData.requester_branch} onChange={(e) => onChangeFormData({ ...formData, requester_branch: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">خریداری از شخص</label>
                  <input type="text" value={formData.purchase_from} onChange={(e) => onChangeFormData({ ...formData, purchase_from: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مبلغ مجموعی</label>
                  <input type="number" value={formData.total_amount} onChange={(e) => onChangeFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مبلغ به حروف</label>
                  <input type="text" value={formData.amount_in_words} onChange={(e) => onChangeFormData({ ...formData, amount_in_words: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">محل امضاء هیئت خریداری</label>
                  <input type="text" value={formData.purchase_committee_location} onChange={(e) => onChangeFormData({ ...formData, purchase_committee_location: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاریخ امضاء هیئت خریداری</label>
                  <input type="date" value={formData.purchase_committee_date} onChange={(e) => onChangeFormData({ ...formData, purchase_committee_date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نمبر تعهد</label>
                  <input type="text" value={formData.allocation_number} onChange={(e) => onChangeFormData({ ...formData, allocation_number: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نمبر خصوصی</label>
                  <input type="text" value={formData.private_number} onChange={(e) => onChangeFormData({ ...formData, private_number: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مبلغ تعهد</label>
                  <input type="number" value={formData.commitment_amount} onChange={(e) => onChangeFormData({ ...formData, commitment_amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">امر تادیه</label>
                  <input type="text" value={formData.payment_order} onChange={(e) => onChangeFormData({ ...formData, payment_order: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
                  <textarea value={formData.description} onChange={(e) => onChangeFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><span className="font-medium text-slate-700 dark:text-slate-300">مورخ:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.date}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">نمبر مسلسل:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.serial_number}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">توسط کدام شخص درخواست شده است:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.requester_person}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">اسم شعبه شخص درخواست کننده و نمبر:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.requester_branch}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">خریداری از شخص:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.purchase_from}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">مبلغ مجموعی:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.total_amount.toLocaleString()} AFN</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">مبلغ به حروف:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.amount_in_words}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">محل امضاء هیئت خریداری:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.purchase_committee_location}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">تاریخ امضاء هیئت خریداری:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.purchase_committee_date}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">نمبر تعهد:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.allocation_number}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">نمبر خصوصی:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.private_number}</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">مبلغ تعهد:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.commitment_amount?.toLocaleString()} AFN</span></div>
                <div><span className="font-medium text-slate-700 dark:text-slate-300">امر تادیه:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.payment_order}</span></div>
                <div className="col-span-2"><span className="font-medium text-slate-700 dark:text-slate-300">توضیحات:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.description}</span></div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">اقلام</h3>
                {mode !== "view" && <button onClick={addItem} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors">{lang === "ps" ? "دقلم اضافه" : lang === "fa" ? "افزودن قلم" : "+ Add Item"}</button>}
              </div>
              <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">#</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">تشریحات</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">واحد</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">مقدار</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">فیات</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">قیمت تخمینی</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">قیمت تادیه شده</th>
                      {mode !== "view" && <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">عملیات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {items.map((item: any, index: number) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{item.line_no}</td>
                        <td className="px-3 py-2">
                          {mode === "view" ? (
                            <span className="text-slate-900 dark:text-slate-100">{item.description}</span>
                          ) : (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].description = e.target.value;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode === "view" ? (
                            <span className="text-slate-900 dark:text-slate-100">{item.unit}</span>
                          ) : (
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].unit = e.target.value;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode === "view" ? (
                            <span className="text-slate-900 dark:text-slate-100">{item.quantity}</span>
                          ) : (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].quantity = parseFloat(e.target.value) || 0;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode === "view" ? (
                            <span className="text-slate-900 dark:text-slate-100">{item.rate}</span>
                          ) : (
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].rate = parseFloat(e.target.value) || 0;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode === "view" ? (
                            <span className="text-slate-900 dark:text-slate-100">{item.estimated_price}</span>
                          ) : (
                            <input
                              type="number"
                              value={item.estimated_price}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].estimated_price = parseFloat(e.target.value) || 0;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {mode === "view" ? (
                            <span className="text-slate-900 dark:text-slate-100">{item.paid_price}</span>
                          ) : (
                            <input
                              type="number"
                              value={item.paid_price}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].paid_price = parseFloat(e.target.value) || 0;
                                onChangeItems(newItems);
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          )}
                        </td>
                        {mode !== "view" && (
                          <td className="px-3 py-2">
                            <button
                              onClick={() => {
                                const newItems = items.filter((_: any, i: number) => i !== index);
                                onChangeItems(newItems);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                            >
                              حذف
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculation Branch Section */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-300 dark:border-gray-700 rounded-lg">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">شعبه محاسبه</h3>
              {mode !== "view" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">مبلغ تعهد</label>
                    <input type="number" value={formData.commitment_amount} onChange={(e) => onChangeFormData({ ...formData, commitment_amount: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">امر تادیه</label>
                    <input type="text" value={formData.payment_order} onChange={(e) => onChangeFormData({ ...formData, payment_order: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">مبلغ تعهد:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.commitment_amount?.toLocaleString()} AFN</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">امر تادیه:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.payment_order}</span></div>
                </div>
              )}
            </div>

            {/* Signature Sections */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 dark:border-slate-600 mb-2"></div>
                <p className="text-xs text-slate-600 dark:text-slate-400">امضاء آمر منظور کننده</p>
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 dark:border-slate-600 mb-2"></div>
                <p className="text-xs text-slate-600 dark:text-slate-400">شعبه محاسبه</p>
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 dark:border-slate-600 mb-2"></div>
                <p className="text-xs text-slate-600 dark:text-slate-400">تصدیق کننده امضاء م-16</p>
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-slate-300 dark:border-slate-600 mb-2"></div>
                <p className="text-xs text-slate-600 dark:text-slate-400">تصدیق کننده امضاء م-12</p>
              </div>
            </div>

            {/* Note */}
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <p className="text-xs text-slate-700 dark:text-slate-300">پولیکه در ستون 19 ذکر شده موجود است</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          {mode === "view" && <button onClick={onPrint} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">چاپ</button>}
          {mode !== "view" && <button onClick={onSave} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">ذخیره</button>}
          <button onClick={onClose} className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">بستن</button>
        </div>
      </div>
    </div>
  );
}

function M3FormModal({ mode, formData, items, onChangeFormData, onChangeItems, onSave, onClose, onPrint, lang, isRTL }: any) {
  const addItem = () => {
    const newItem = { id: Date.now(), line_no: items.length + 1, description: "", type_code: "", classification_code: "", code: "", quantity: 0, unit: "", rent_per_unit: 0, total_rent_value: 0 };
    onChangeItems([...items, newItem]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-calculate total rent value when quantity or rent_per_unit changes
    if (field === 'quantity' || field === 'rent_per_unit') {
      newItems[index].total_rent_value = (newItems[index].quantity || 0) * (newItems[index].rent_per_unit || 0);
    }

    // Auto-calculate total rent for the form
    const totalRent = newItems.reduce((sum: number, item: any) => sum + (item.total_rent_value || 0), 0);
    onChangeFormData({ ...formData, total_rent: totalRent });

    onChangeItems(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index);
    // Recalculate line numbers
    newItems.forEach((item: any, i: number) => {
      item.line_no = i + 1;
    });
    onChangeItems(newItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">فورم M-3 /بیع اجاره {mode === "view" ? "(مشاهده)" : mode === "edit" ? "(ویرایش)" : "(جدید)"}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div id="m3-print-area" className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
            {/* Logo and Header */}
            <div className="mb-6">
              {/* Circular Logo */}
              <div className="flex justify-center mb-4">
                <img src="/images/finance-logo.png" alt="Ministry of Finance Logo" className="w-24 h-24 rounded-full border-4 border-amber-400 shadow-lg object-cover" />
              </div>
              {/* Header Box */}
              <div className="border-3 border-blue-800 p-3 bg-gradient-to-r from-amber-100 to-amber-200 rounded-md">
                <h1 className="text-lg font-bold text-blue-900 text-center mb-1">وزارت مالیه - ریاست عمومی خزاین</h1>
                <p className="text-sm text-blue-800 text-center font-semibold">فورم - م - 3 (د) امر خریداری بر اساس <span className="text-green-700 font-bold">عقد اجاره</span></p>
                <p className="text-xs text-slate-600 text-center mt-1">Ministry of Finance - General Directorate of Treasury</p>
              </div>
            </div>

            {/* Section A */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-300 dark:border-gray-700 rounded-lg">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 border-b-2 border-blue-600 pb-2">بخش الف: این بخش توسط شعبه تدارکات خانه پری گردد</h3>
              
              {mode !== "view" ? (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">1. شماره</label>
                    <input type="text" value={formData.number} onChange={(e) => onChangeFormData({ ...formData, number: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">2. وزارت/ارگان امر خریداری</label>
                    <input type="text" value={formData.ministry_organization} onChange={(e) => onChangeFormData({ ...formData, ministry_organization: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">3. تاریخ صدور</label>
                    <input type="date" value={formData.issue_date} onChange={(e) => onChangeFormData({ ...formData, issue_date: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">4. شماره درخواست خریداری</label>
                    <input type="text" value={formData.purchase_request_number} onChange={(e) => onChangeFormData({ ...formData, purchase_request_number: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">5. شماره هویت قراردادی</label>
                    <input type="text" value={formData.contractor_id_number} onChange={(e) => onChangeFormData({ ...formData, contractor_id_number: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">6. کود حسابی (تخصیص)</label>
                    <div className="grid grid-cols-6 gap-2">
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">کود ارگان (6)</label>
                        <input type="text" value={formData.org_code} onChange={(e) => onChangeFormData({ ...formData, org_code: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">کود پروژه (6)</label>
                        <input type="text" value={formData.project_code} onChange={(e) => onChangeFormData({ ...formData, project_code: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">کود برنامه (3)</label>
                        <input type="text" value={formData.program_code} onChange={(e) => onChangeFormData({ ...formData, program_code: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">کود وجه (5)</label>
                        <input type="text" value={formData.fund_code} onChange={(e) => onChangeFormData({ ...formData, fund_code: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">کود نوع (1)</label>
                        <input type="text" value={formData.type_code} onChange={(e) => onChangeFormData({ ...formData, type_code: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">کود تصنیف (3)</label>
                        <input type="text" value={formData.classification_code} onChange={(e) => onChangeFormData({ ...formData, classification_code: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">7. تاریخ تسلیمی</label>
                    <input type="date" value={formData.delivery_date} onChange={(e) => onChangeFormData({ ...formData, delivery_date: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">8. محل تسليمي</label>
                    <input type="text" value={formData.delivery_place} onChange={(e) => onChangeFormData({ ...formData, delivery_place: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">1. شماره:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.number}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">2. وزارت/ارگان:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.ministry_organization}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">3. تاریخ صدور:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.issue_date}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">4. شماره درخواست:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.purchase_request_number}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">5. شماره هویت قراردادی:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.contractor_id_number}</span></div>
                  <div className="col-span-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">6. کود حسابی:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-100">{formData.org_code}-{formData.project_code}-{formData.program_code}-{formData.fund_code}-{formData.type_code}-{formData.classification_code}</span>
                  </div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">7. تاریخ تسلیمی:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.delivery_date}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">8. محل تسليمي:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.delivery_place}</span></div>
                </div>
              )}

              {/* Items Table */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">جدول اقلام</h4>
                  {mode !== "view" && <button onClick={addItem} className="px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs transition-colors">{lang === "ps" ? "دقلم اضافه" : lang === "fa" ? "افزودن قلم" : "+ Add Item"}</button>}
                </div>
                <div className="border border-slate-300 dark:border-slate-600 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-700">
                      <tr>
                        <th className="px-2 py-1.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-600">9. شماره</th>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-600">10. تعیین چیزی که به اجاره داده میشود</th>
                        <th className="px-2 py-1.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-600">11. کود نوع(1) تصنیف(5)</th>
                        <th className="px-2 py-1.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-600">12. کود</th>
                        <th className="px-2 py-1.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-600">13. مقدار</th>
                        <th className="px-2 py-1.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-600">14. واحد</th>
                        <th className="px-2 py-1.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-600">15. اجرت فی واحد</th>
                        <th className="px-2 py-1.5 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-600">16. ارزش اجرت</th>
                        {mode !== "view" && <th className="px-2 py-1.5 text-center font-medium text-slate-700 dark:text-slate-300">عملیات</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                      {items.map((item: any, index: number) => (
                        <tr key={item.id}>
                          <td className="px-2 py-1.5 text-center text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-600">{item.line_no}</td>
                          <td className="px-2 py-1.5 border-r border-slate-300 dark:border-slate-600">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.description}</span>
                            ) : (
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                              />
                            )}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-300 dark:border-slate-600">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.type_code} / {item.classification_code}</span>
                            ) : (
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={item.type_code}
                                  onChange={(e) => updateItem(index, 'type_code', e.target.value)}
                                  className="w-12 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs text-center"
                                  placeholder="نوع"
                                />
                                <span className="text-slate-400">/</span>
                                <input
                                  type="text"
                                  value={item.classification_code}
                                  onChange={(e) => updateItem(index, 'classification_code', e.target.value)}
                                  className="w-12 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs text-center"
                                  placeholder="تصنیف"
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-300 dark:border-slate-600">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.code}</span>
                            ) : (
                              <input
                                type="text"
                                value={item.code}
                                onChange={(e) => updateItem(index, 'code', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs text-center"
                              />
                            )}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-300 dark:border-slate-600">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.quantity}</span>
                            ) : (
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs text-center"
                              />
                            )}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-300 dark:border-slate-600">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.unit}</span>
                            ) : (
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs text-center"
                              />
                            )}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-300 dark:border-slate-600">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.rent_per_unit}</span>
                            ) : (
                              <input
                                type="number"
                                value={item.rent_per_unit}
                                onChange={(e) => updateItem(index, 'rent_per_unit', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs text-center"
                              />
                            )}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-300 dark:border-slate-600">
                            <span className="text-slate-900 dark:text-slate-100 font-bold">{item.total_rent_value.toFixed(2)}</span>
                          </td>
                          {mode !== "view" && (
                            <td className="px-2 py-1.5">
                              <button
                                onClick={() => deleteItem(index)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                              >
                                حذف
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section A additional fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">17. مجموع اجرت</label>
                  {mode === "view" ? (
                    <span className="text-slate-900 dark:text-slate-100 font-bold">{formData.total_rent.toLocaleString()} AFN</span>
                  ) : (
                    <input type="number" value={formData.total_rent} onChange={(e) => onChangeFormData({ ...formData, total_rent: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold" />
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">18. تعیین منفعت</label>
                  {mode === "view" ? (
                    <p className="text-slate-900 dark:text-slate-100">{formData.benefit_determination}</p>
                  ) : (
                    <textarea value={formData.benefit_determination} onChange={(e) => onChangeFormData({ ...formData, benefit_determination: e.target.value })} rows={2} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">19. منفعت مقدور الاستيفاء باشد (قابل دسترسی باشد)</label>
                  {mode === "view" ? (
                    <span className="text-slate-900 dark:text-slate-100">{formData.benefit_accessible ? "بله" : "خیر"}</span>
                  ) : (
                    <select value={formData.benefit_accessible ? "true" : "false"} onChange={(e) => onChangeFormData({ ...formData, benefit_accessible: e.target.value === "true" })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs">
                      <option value="false">خیر</option>
                      <option value="true">بله</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">20. موجودیت شروط انعقاد اجاره</label>
                  {mode === "view" ? (
                    <span className="text-slate-900 dark:text-slate-100">{formData.lease_conditions_exist ? "بله" : "خیر"}</span>
                  ) : (
                    <select value={formData.lease_conditions_exist ? "true" : "false"} onChange={(e) => onChangeFormData({ ...formData, lease_conditions_exist: e.target.value === "true" })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs">
                      <option value="false">خیر</option>
                      <option value="true">بله</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">21. راپور رسید (1) - تاریخ</label>
                  {mode === "view" ? (
                    <span className="text-slate-900 dark:text-slate-100">{formData.receipt_report_date}</span>
                  ) : (
                    <input type="date" value={formData.receipt_report_date} onChange={(e) => onChangeFormData({ ...formData, receipt_report_date: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">21. راپور رسید (1) - شماره</label>
                  {mode === "view" ? (
                    <span className="text-slate-900 dark:text-slate-100">{formData.receipt_report_number}</span>
                  ) : (
                    <input type="text" value={formData.receipt_report_number} onChange={(e) => onChangeFormData({ ...formData, receipt_report_number: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  )}
                </div>
              </div>
            </div>

            {/* Section B */}
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-700 rounded-lg">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">بخش ب: مرور و منظوری، امضاً عاقدین بمنظور تثبیث رضایت عقد کننده گان</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-green-600 dark:border-green-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">22. شعبه تداركات (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.procurement_dept_signature} onChange={(e) => onChangeFormData({ ...formData, procurement_dept_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.procurement_dept_date} onChange={(e) => onChangeFormData({ ...formData, procurement_dept_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-green-600 dark:border-green-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">23. شعبه دفترداری (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.registry_dept_signature} onChange={(e) => onChangeFormData({ ...formData, registry_dept_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.registry_dept_date} onChange={(e) => onChangeFormData({ ...formData, registry_dept_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-green-600 dark:border-green-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">24. آمر ذیصلاح (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.authorized_officer_signature} onChange={(e) => onChangeFormData({ ...formData, authorized_officer_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.authorized_officer_date} onChange={(e) => onChangeFormData({ ...formData, authorized_officer_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-green-600 dark:border-green-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">25. قراردادی (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.contractor_signature} onChange={(e) => onChangeFormData({ ...formData, contractor_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.contractor_date} onChange={(e) => onChangeFormData({ ...formData, contractor_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section C */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600 dark:border-blue-700 rounded-lg">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">بخش ج: این بخش توسط کنترولر مالی خانه پری گردد</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-blue-600 dark:border-blue-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">26. کنترولر مالی (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.financial_controller_signature} onChange={(e) => onChangeFormData({ ...formData, financial_controller_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.financial_controller_date} onChange={(e) => onChangeFormData({ ...formData, financial_controller_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">27. ملاحظات</label>
                  {mode === "view" ? (
                    <p className="text-slate-900 dark:text-slate-100 p-2 bg-white dark:bg-slate-700 rounded border-2 border-blue-600 dark:border-blue-500 text-xs">{formData.remarks}</p>
                  ) : (
                    <textarea value={formData.remarks} onChange={(e) => onChangeFormData({ ...formData, remarks: e.target.value })} rows={3} className="w-full px-2 py-1.5 border-2 border-blue-600 dark:border-blue-500 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          {mode === "view" && <button onClick={onPrint} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">چاپ</button>}
          {mode !== "view" && <button onClick={onSave} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">ذخیره</button>}
          <button onClick={onClose} className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">بستن</button>
        </div>
      </div>
    </div>
  );
}

function M3HFormTab({ forms, pagination, onPageChange, onCreate, onView, onEdit, onDelete, onPrint, lang, isRTL }: any) {
  const { current_page, last_page, per_page, total } = pagination;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">فورم - م-3 (ه)/بیع مطلق</h2>
        <button onClick={onCreate} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">{lang === "ps" || lang === "fa" ? "جدید +" : "+ New"}</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "شماره امر" : "Order No"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "تاریخ" : "Date"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "وزارت" : "Ministry"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "مبلغ" : "Amount"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "وضعیت" : "Status"}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{lang === "ps" || lang === "fa" ? "عملیات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {forms.map((form: any) => (
              <tr key={form.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{form.order_number}</td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{form.issue_date}</td>
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{form.purchasing_ministry}</td>
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{form.total_price.toLocaleString()} AFN</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex px-2 py-1 text-xs font-medium rounded-full", form.status === "submitted" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300")}>{form.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onView(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "لید" : lang === "fa" ? "مشاهده" : "View"}
                    </button>
                    <button onClick={() => onEdit(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "سمون" : lang === "fa" ? "ویرایش" : "Edit"}
                    </button>
                    <button onClick={() => onPrint && onPrint(form)} className="px-2 py-1 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20 rounded transition-colors">
                      {lang === "ps" ? "چاپ" : lang === "fa" ? "چاپ" : "Print"}
                    </button>
                    <button onClick={() => onDelete(form.id)} className="px-2 py-1 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors">
                      {lang === "ps" ? "حذف" : lang === "fa" ? "حذف" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {last_page > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {lang === "ps" || lang === "fa"
              ? `صفحه ${current_page} از ${last_page} - مجموع ${total}`
              : `Page ${current_page} of ${last_page} - Total ${total}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, current_page - 1))}
              disabled={current_page === 1}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              {lang === "ps" || lang === "fa" ? "قبلی" : "Previous"}
            </button>
            {Array.from({ length: last_page }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "px-3 py-1 text-sm rounded transition-colors",
                  page === current_page
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(Math.min(last_page, current_page + 1))}
              disabled={current_page === last_page}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              {lang === "ps" || lang === "fa" ? "بعدی" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function M3HFormModal({ mode, formData, items, onChangeFormData, onChangeItems, onSave, onClose, onPrint, lang, isRTL }: any) {
  const addItem = () => {
    const newItem = { id: Date.now(), line_no: items.length + 1, description: "", type_code: "", classification_code: "", quantity: 0, unit: "", unit_price: 0, total_price: 0 };
    const newItems = [...items, newItem];
    onChangeItems(newItems);
    // Update form total price
    const newTotal = newItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
    onChangeFormData({ ...formData, total_price: newTotal });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Recalculate total price when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }

    onChangeItems(newItems);

    // Update form total price
    const newTotal = newItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
    onChangeFormData({ ...formData, total_price: newTotal });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">فورم - م-3 (ه)/بیع مطلق {mode === "view" ? "(مشاهده)" : mode === "edit" ? "(ویرایش)" : "(جدید)"}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div id="m3h-print-area" className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
            {/* Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-slate-800 dark:border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">وزارت مالیه - ریاست عمومی خزاین</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">فورم - م-3 (ه) امر خریداری بر اساس بیع مطلق</p>
            </div>

            {/* Section A */}
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-600 dark:border-orange-700 rounded-lg form-section-a">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">بخش الف: این بخش توسط شعبه تدارکات خانه پری گردد</h3>
              
              {mode !== "view" ? (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">1. شماره امر</label>
                    <input type="text" value={formData.order_number} onChange={(e) => onChangeFormData({ ...formData, order_number: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">2. وزارت/ارگان خریداری</label>
                    <input type="text" value={formData.purchasing_ministry} onChange={(e) => onChangeFormData({ ...formData, purchasing_ministry: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">3. تاریخ صدور</label>
                    <input type="date" value={formData.issue_date} onChange={(e) => onChangeFormData({ ...formData, issue_date: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">1. شماره امر:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.order_number}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">2. وزارت/ارگان خریداری:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.purchasing_ministry}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">3. تاریخ صدور:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.issue_date}</span></div>
                </div>
              )}

              {/* Account Code */}
              <div className="mb-4 p-3 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">6. کود حسابی (تخصیص)</p>
                {mode !== "view" ? (
                  <div className="grid grid-cols-7 gap-2">
                    <input type="text" placeholder="کود سازمان (6)" value={formData.org_code} onChange={(e) => onChangeFormData({ ...formData, org_code: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    <input type="text" placeholder="کود پروژه (6)" value={formData.project_code} onChange={(e) => onChangeFormData({ ...formData, project_code: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    <input type="text" placeholder="کود برنامه (3)" value={formData.program_code} onChange={(e) => onChangeFormData({ ...formData, program_code: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    <input type="text" placeholder="کود صندوق (3)" value={formData.fund_code} onChange={(e) => onChangeFormData({ ...formData, fund_code: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    <input type="text" placeholder="کود نوع (1)" value={formData.type_code} onChange={(e) => onChangeFormData({ ...formData, type_code: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    <input type="text" placeholder="کود تصنیف (3)" value={formData.classification_code} onChange={(e) => onChangeFormData({ ...formData, classification_code: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    <input type="text" placeholder="کود وجه (5)" value={formData.reason_code} onChange={(e) => onChangeFormData({ ...formData, reason_code: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-2 text-xs">
                    <span className="text-slate-900 dark:text-slate-100">{formData.org_code}</span>
                    <span className="text-slate-900 dark:text-slate-100">{formData.project_code}</span>
                    <span className="text-slate-900 dark:text-slate-100">{formData.program_code}</span>
                    <span className="text-slate-900 dark:text-slate-100">{formData.fund_code}</span>
                    <span className="text-slate-900 dark:text-slate-100">{formData.type_code}</span>
                    <span className="text-slate-900 dark:text-slate-100">{formData.classification_code}</span>
                    <span className="text-slate-900 dark:text-slate-100">{formData.reason_code}</span>
                  </div>
                )}
              </div>

              {mode !== "view" ? (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">4. شماره درخواست خریداری</label>
                    <input type="text" value={formData.purchase_request_number} onChange={(e) => onChangeFormData({ ...formData, purchase_request_number: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">5. شماره هویت قراردادی</label>
                    <input type="text" value={formData.contract_id_number} onChange={(e) => onChangeFormData({ ...formData, contract_id_number: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">کود نوع جنس (1)</label>
                    <input type="text" value={formData.item_type_code} onChange={(e) => onChangeFormData({ ...formData, item_type_code: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">4. شماره درخواست خریداری:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.purchase_request_number}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">5. شماره هویت قراردادی:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.contract_id_number}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">کود نوع جنس:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.item_type_code}</span></div>
                </div>
              )}

              {mode !== "view" ? (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">7. تاریخ تسلیمی</label>
                    <input type="date" value={formData.delivery_date} onChange={(e) => onChangeFormData({ ...formData, delivery_date: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">8. محل تسلیمی</label>
                    <input type="text" value={formData.delivery_place} onChange={(e) => onChangeFormData({ ...formData, delivery_place: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">7. تاریخ تسلیمی:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.delivery_date}</span></div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">8. محل تسلیمی:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.delivery_place}</span></div>
                </div>
              )}

              {/* Items Table */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">اقلام</h3>
                  {mode !== "view" && <button onClick={addItem} className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors">+ Add Item</button>}
                </div>
                <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-700">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">شماره</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">10. توضیح</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">11. کود نوع (1)</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">12. کود تصنیف (5)</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">13. مقدار</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">14. واحد</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">15. فیات</th>
                        <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">16. قیمت</th>
                        {mode !== "view" && <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">عملیات</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                      {items.map((item: any, index: number) => (
                        <tr key={item.id}>
                          <td className="px-2 py-2 text-slate-900 dark:text-slate-100">{item.line_no}</td>
                          <td className="px-2 py-2">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.description}</span>
                            ) : (
                              <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.type_code}</span>
                            ) : (
                              <input type="text" value={item.type_code} onChange={(e) => updateItem(index, 'type_code', e.target.value)} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.classification_code}</span>
                            ) : (
                              <input type="text" value={item.classification_code} onChange={(e) => updateItem(index, 'classification_code', e.target.value)} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.quantity}</span>
                            ) : (
                              <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.unit}</span>
                            ) : (
                              <input type="text" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {mode === "view" ? (
                              <span className="text-slate-900 dark:text-slate-100">{item.unit_price}</span>
                            ) : (
                              <input type="number" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                            )}
                          </td>
                          <td className="px-2 py-2 text-slate-900 dark:text-slate-100">{item.total_price.toLocaleString()}</td>
                          {mode !== "view" && (
                            <td className="px-2 py-2">
                              <button onClick={() => {
                                const newItems = items.filter((_: any, i: number) => i !== index);
                                // Update line numbers
                                newItems.forEach((item: any, i: number) => item.line_no = i + 1);
                                onChangeItems(newItems);
                                // Update form total price
                                const newTotal = newItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
                                onChangeFormData({ ...formData, total_price: newTotal });
                              }} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors">حذف</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-600 dark:border-yellow-700 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">17. مجموع (مجموع ثمن)</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{(items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)).toLocaleString()} AFN</span>
                </div>
              </div>

              {/* Payment Options */}
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">18. پرداخت بگونه مؤجل</label>
                  {mode === "view" ? (
                    <span className="text-slate-900 dark:text-slate-100">{formData.payment_deferred ? "بله" : "نه"}</span>
                  ) : (
                    <input type="checkbox" checked={formData.payment_deferred} onChange={(e) => onChangeFormData({ ...formData, payment_deferred: e.target.checked })} className="w-4 h-4" />
                  )}
                </div>
                <div className="p-3 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">19. پرداخت بگونه بالتقسیط</label>
                  {mode === "view" ? (
                    <span className="text-slate-900 dark:text-slate-100">{formData.payment_installments}</span>
                  ) : (
                    <input type="text" value={formData.payment_installments} onChange={(e) => onChangeFormData({ ...formData, payment_installments: e.target.value })} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  )}
                </div>
                <div className="p-3 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">20. پرداخت بگونه معجل</label>
                  {mode === "view" ? (
                    <span className="text-slate-900 dark:text-slate-100">{formData.payment_immediate ? "بله" : "نه"}</span>
                  ) : (
                    <input type="checkbox" checked={formData.payment_immediate} onChange={(e) => onChangeFormData({ ...formData, payment_immediate: e.target.checked })} className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Receipt Report */}
              <div className="mb-4 p-3 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">21. راپور رسید (1)</p>
                {mode !== "view" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">تاریخ</label>
                      <input type="date" value={formData.receipt_report_date} onChange={(e) => onChangeFormData({ ...formData, receipt_report_date: e.target.value })} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">شماره</label>
                      <input type="text" value={formData.receipt_report_number} onChange={(e) => onChangeFormData({ ...formData, receipt_report_number: e.target.value })} className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><span className="font-medium text-slate-700 dark:text-slate-300">تاریخ:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.receipt_report_date}</span></div>
                    <div><span className="font-medium text-slate-700 dark:text-slate-300">شماره:</span><span className="ml-2 text-slate-900 dark:text-slate-100">{formData.receipt_report_number}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* Section B */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-700 rounded-lg form-section-b">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">بخش ب: مرور و منظوری</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-green-600 dark:border-green-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">22. شعبه تدارکات (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.procurement_dept_signature} onChange={(e) => onChangeFormData({ ...formData, procurement_dept_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.procurement_dept_date} onChange={(e) => onChangeFormData({ ...formData, procurement_dept_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-green-600 dark:border-green-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">23. شعبه دفترداری (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.registry_dept_signature} onChange={(e) => onChangeFormData({ ...formData, registry_dept_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.registry_dept_date} onChange={(e) => onChangeFormData({ ...formData, registry_dept_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-green-600 dark:border-green-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">24. آمر ذیصلاح (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.authorized_officer_signature} onChange={(e) => onChangeFormData({ ...formData, authorized_officer_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.authorized_officer_date} onChange={(e) => onChangeFormData({ ...formData, authorized_officer_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-green-600 dark:border-green-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">25. قراردادی (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.contractor_signature} onChange={(e) => onChangeFormData({ ...formData, contractor_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.contractor_date} onChange={(e) => onChangeFormData({ ...formData, contractor_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section C */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600 dark:border-blue-700 rounded-lg form-section-c">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">بخش ج: این بخش توسط کنترولر مالی خانه پری گردد</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white dark:bg-slate-700 rounded border-2 border-blue-600 dark:border-blue-500">
                  <div className="h-12 border-b-2 border-slate-400 dark:border-slate-500 mb-2"></div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">26. کنترولر مالی (امضا و تاریخ)</p>
                  {mode !== "view" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="text" placeholder="امضا" value={formData.financial_controller_signature} onChange={(e) => onChangeFormData({ ...formData, financial_controller_signature: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                      <input type="date" value={formData.financial_controller_date} onChange={(e) => onChangeFormData({ ...formData, financial_controller_date: e.target.value })} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">27. ملاحظات</label>
                  {mode === "view" ? (
                    <p className="text-slate-900 dark:text-slate-100 p-2 bg-white dark:bg-slate-700 rounded border-2 border-blue-600 dark:border-blue-500 text-xs">{formData.remarks}</p>
                  ) : (
                    <textarea value={formData.remarks} onChange={(e) => onChangeFormData({ ...formData, remarks: e.target.value })} rows={3} className="w-full px-2 py-1.5 border-2 border-blue-600 dark:border-blue-500 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          {mode === "view" && <button onClick={() => onPrint("m3h-print-area", "m3h")} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">چاپ</button>}
          {mode !== "view" && <button onClick={onSave} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">ذخیره</button>}
          <button onClick={onClose} className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">بستن</button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ title, message, onConfirm, onCancel, lang }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">{lang === "ps" || lang === "fa" ? "لغو" : "Cancel"}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">{lang === "ps" || lang === "fa" ? "حذف" : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}
