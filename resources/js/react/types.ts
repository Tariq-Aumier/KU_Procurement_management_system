export type Role = "admin" | "manager" | "user";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
  active: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export type CompanyType = "construction" | "logistics" | "retail" | "services" | "logistics_construction" | "medical" | "equipment";

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  registrationNo: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  blacklisted: boolean;
  blacklistReason?: string;
  violations: Violation[];
  experience: string;
  createdAt: string;
  createdBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Violation {
  id: string;
  date: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export type ContractTier = "tier1" | "tier2" | "tier3" | "tier4";
export type ContractStatus = "draft" | "active" | "completed" | "cancelled";

export interface Contract {
  id: string;
  contractNo: string;
  companyId: string;
  title: string;
  amount: number;
  currency: "AFN" | "USD" | "EUR";
  tier: ContractTier;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  progressPercent: number;
  description: string;
  attachmentName?: string;
  attachmentType?: "excel" | "pdf";
  createdAt: string;
  createdBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

export type Priority = "low" | "medium" | "high" | "urgent";
export type OrderStatus = "draft" | "pending" | "approved" | "in_progress" | "completed" | "incomplete" | "cancelled";

export interface ProcurementOrder {
  id: string;
  orderNo: string;
  title: string;
  companyId?: string;
  officeId?: string;
  category: "retail" | "contract" | "equipment" | "supplies";
  priority: Priority;
  status: OrderStatus;
  requestedDate: string;
  requiredDate: string;
  amount: number;
  equipment: number;
  items: number;
  currency: "AFN" | "USD" | "EUR";
  description: string;
  orderItems?: OrderItem[];
  createdAt: string;
  createdBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  category: "equipment" | "supplies";
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

export interface Vendor {
  id: string;
  companyId?: string;
  accountNo: string;
  vendorName: string;
  type: CompanyType;
  taxId: string;
  bankAccount: string;
  contactInfo: string;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface OfficeCategory {
  id: string;
  name: string;
  code?: string;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Office {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  namePs?: string;
  nameFa?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface OfficeItem {
  id: string;
  officeId: string;
  procurementOrderId: string;
  itemName: string;
  category: "equipment" | "supplies";
  quantity: number;
  unitPrice: number;
  currency: "AFN" | "USD" | "EUR";
  totalValue: number;
  receivedDate: string;
  condition: "new" | "used" | "damaged";
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface AppData {
  users: User[];
  companies: Company[];
  contracts: Contract[];
  orders: ProcurementOrder[];
  vendors: Vendor[];
  auditLogs: AuditLog[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  officeCategories: OfficeCategory[];
  offices: Office[];
  officeItems: OfficeItem[];
  purchaseRequests: PurchaseRequest[];
  lineItems: LineItem[];
  formVendors: Vendor[];
  vendorQuoteLines: VendorQuoteLine[];
  comparisonResults: ComparisonResult[];
  approvalWorkflows: ApprovalWorkflow[];
  formAuditLogs: FormAuditLog[];
}

// Inventory Types
export type InventoryItemType = "sample" | "equipment" | "supply" | "asset";
export type ItemCondition = "new" | "used" | "damaged" | "returned" | "disposed";
export type ItemStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  type: InventoryItemType;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  location: string;
  supplierId?: string;
  batchNumber?: string;
  serialNumber?: string;
  receivedDate?: string;
  expiryDate?: string;
  condition: ItemCondition;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

export type MovementType = "stock_in" | "stock_out" | "adjustment" | "transfer";

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reference?: string;
  notes: string;
  date: string;
  performedBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

export const TIER_LIMITS = {
  tier1: { min: 0, max: 5000, label: { en: "0 – 5,000", ps: "۰ – ۵,۰۰۰", fa: "۰ – ۵,۰۰۰" }, labelEn: "Small (0 – 5K)" },
  tier2: { min: 5000, max: 50000, label: { en: "5,000 – 50,000", ps: "۵,۰۰۰ – ۵۰,۰۰۰", fa: "۵,۰۰۰ – ۵۰,۰۰۰" }, labelEn: "Medium (5K – 50K)" },
  tier3: { min: 50000, max: 500000, label: { en: "50,000 – 500,000", ps: "۵۰,۰۰۰ – ۵۰۰,۰۰۰", fa: "۵۰,۰۰۰ – ۵۰۰,۰۰۰" }, labelEn: "Large (50K – 500K)" },
  tier4: { min: 500000, max: Infinity, label: { en: "500,000+", ps: "۵۰۰,۰۰۰ +", fa: "۵۰۰,۰۰۰ +" }, labelEn: "Enterprise (500K+)" },
} as const;

export function getTierFromAmount(amount: number): ContractTier {
  if (amount < 5000) return "tier1";
  if (amount < 50000) return "tier2";
  if (amount < 500000) return "tier3";
  return "tier4";
}

// ============================================================
// Ministry of Finance Forms (M-3)
// ============================================================

export type FormType = "absolute_sale" | "lease" | "comparison";
export type FormStatus = "draft" | "pending_approval" | "approved" | "rejected" | "completed";
export type ApprovalStep = "procurement" | "accounting" | "authorized_officer" | "contractor" | "financial_controller";

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  ministryOrg: string;
  issueDate: string;
  requestingDepartment: string;
  fundingSource: string;
  budgetCode: string;
  formType: FormType;
  status: FormStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface LineItem {
  id: string;
  itemNo: number;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  technicalSpec: string;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Vendor {
  id: string;
  vendorName: string;
  address: string;
  createdAt: string;
}

export interface VendorQuoteLine {
  id: string;
  itemId: string;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ComparisonResult {
  id: string;
  vendorId: string;
  grandTotal: number;
  rank: number;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ApprovalWorkflow {
  id: string;
  step: ApprovalStep;
  approverName: string;
  signature: string;
  date: string;
  remarks: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface FormAuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
  deletedAt?: string;
  deletedBy?: string;
}
