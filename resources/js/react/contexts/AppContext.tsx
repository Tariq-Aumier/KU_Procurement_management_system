import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { AppData, User, AuditLog, Company, Contract, ProcurementOrder, Vendor, InventoryItem, OfficeCategory, Office, PurchaseRequest, LineItem, Vendor as FormVendor, OfficeItem } from "../types";
import { emptyData } from "../utils/storage";

const API_URL = "/api/v1";
const TOKEN_KEY = "pms_access_token";
const token = () => sessionStorage.getItem(TOKEN_KEY);
const BACKUP_KEY = "pms_auto_backup";
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Enhanced API with retry logic and better error handling
const api = async (path: string, init: RequestInit = {}, retries = 3): Promise<any> => {
  const headers: Record<string, string> = { Accept: "application/json", ...(init.headers as Record<string, string> || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  if (init.body && !(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${API_URL}${path}`, { ...init, headers });
      if (res.status === 204) return null;
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message || `API request failed: ${res.status}`);
      }
      return body.data;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (i < retries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  throw lastError || new Error("API request failed after retries");
};

// Data validation functions
const validateUser = (u: User): string[] => {
  const errors: string[] = [];
  if (!u.username || u.username.length < 3) errors.push("Username must be at least 3 characters");
  if (!u.fullName || u.fullName.length < 2) errors.push("Full name is required");
  if (u.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) errors.push("Invalid email format");
  if (!["admin", "manager", "user"].includes(u.role)) errors.push("Invalid role");
  return errors;
};

const validateCompany = (c: Company): string[] => {
  const errors: string[] = [];
  if (!c.name || c.name.length < 2) errors.push("Company name is required");
  if (!c.registrationNo) errors.push("Registration number is required");
  if (!c.contactPerson) errors.push("Contact person is required");
  return errors;
};

const validateContract = (c: Contract): string[] => {
  const errors: string[] = [];
  if (!c.contractNo) errors.push("Contract number is required");
  if (!c.title) errors.push("Contract title is required");
  if (c.amount <= 0) errors.push("Amount must be positive");
  if (!c.companyId) errors.push("Company is required");
  return errors;
};

// Backup and recovery functions
const createBackup = (): string => {
  const data = localStorage.getItem("pms_data");
  if (data) {
    const backup = {
      timestamp: new Date().toISOString(),
      data: JSON.parse(data)
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    return "Backup created successfully";
  }
  return "No data to backup";
};

const restoreFromBackup = (): boolean => {
  const backupStr = localStorage.getItem(BACKUP_KEY);
  if (backupStr) {
    try {
      const backup = JSON.parse(backupStr);
      if (backup.data && backup.timestamp) {
        localStorage.setItem("pms_data", JSON.stringify(backup.data));
        return true;
      }
    } catch (e) {
      console.error("Failed to restore backup:", e);
    }
  }
  return false;
};
const id = (v: unknown) => String(v);
const userFrom = (x: any): User => ({ id:id(x.id), username:x.username, fullName:x.fullName ?? x.name, email:x.email ?? "", role:(x.role === "manager" ? "manager" : x.role === "admin" ? "admin" : "user"), passwordHash:"", createdAt:x.created_at ?? new Date().toISOString(), lastLogin:x.lastLoginAt ?? x.last_login_at, active:Boolean(x.active) });
const companyFrom = (x:any):Company => ({id:id(x.id),name:x.legal_name,type:x.company_type,registrationNo:x.registration_no,contactPerson:x.contact_person,phone:x.phone??"",email:x.email??"",address:x.address??"",blacklisted:x.eligibility_status==="blacklisted",blacklistReason:x.blacklist_reason,violations:[],experience:x.experience??"",createdAt:x.created_at,createdBy:id(x.created_by??"")});
const contractFrom = (x:any):Contract => ({id:id(x.id),contractNo:x.contract_no,companyId:id(x.company_id),title:x.title,amount:Number(x.amount),currency:x.currency,tier:x.tier,startDate:x.start_date,endDate:x.end_date,status:x.status,progressPercent:Number(x.progress_percent),description:x.description??"",createdAt:x.created_at,createdBy:""});
const orderFrom = (x:any):ProcurementOrder => ({id:id(x.id),orderNo:x.order_no,title:x.title,companyId:x.company_id ? id(x.company_id):undefined,officeId:x.office_id ? id(x.office_id):undefined,category:x.category,priority:x.priority,status:x.status,requestedDate:x.requested_date,requiredDate:x.required_date,amount:Number(x.amount),equipment:Number(x.equipment||0),items:Number(x.items||0),currency:x.currency||"AFN",description:x.description??"",createdAt:x.created_at,createdBy:id(x.created_by??"")});
const itemFrom = (x:any):InventoryItem => ({id:id(x.id),code:x.code,name:x.name,type:x.item_type,category:x.category,description:x.description??"",unit:x.unit,quantity:Number(x.quantity_on_hand),minStock:Number(x.min_stock),maxStock:Number(x.max_stock??0),reorderPoint:Number(x.reorder_point),location:id(x.inventory_location_id),supplierId:x.supplier_company_id?id(x.supplier_company_id):undefined,batchNumber:x.batch_number,serialNumber:x.serial_number,receivedDate:x.received_date,expiryDate:x.expiry_date,condition:x.condition,notes:x.notes??"",createdAt:x.created_at,updatedAt:x.updated_at,createdBy:""});
const officeCategoryFrom = (x:any):OfficeCategory => ({id:id(x.id),name:x.name,code:x.code??"",createdAt:x.created_at});
const officeFrom = (x:any):Office => ({id:id(x.id),categoryId:id(x.office_category_id),code:x.code??"",name:x.name,namePs:x.name_ps??"",nameFa:x.name_fa??"",description:x.description??"",active:Boolean(x.active),createdAt:x.created_at});
const officeItemFrom = (x:any):OfficeItem => ({id:id(x.id),officeId:id(x.office_id),procurementOrderId:x.procurement_order_id?id(x.procurement_order_id):"",itemName:x.item_name,category:x.category,quantity:Number(x.quantity),unitPrice:Number(x.unit_price),currency:x.currency,totalValue:Number(x.total_value),receivedDate:x.received_date,condition:x.condition,createdAt:x.created_at});
const empty = (): AppData => emptyData();

interface AppContextValue { data: AppData; currentUser: User | null; loading: boolean; login:(username:string,password:string)=>Promise<{ok:boolean;error?:string}>; logout:()=>void; updateData:(updater:(d:AppData)=>AppData,audit?:Omit<AuditLog,"id"|"userId"|"username"|"timestamp">,immediateSync?:boolean)=>void; resetData:()=>Promise<void>; manageUser:(u:User,password?:string)=>Promise<void>; deleteUser:(id:string)=>Promise<void>; manageVendor:(v:Vendor)=>Promise<void>; deleteVendor:(id:string)=>Promise<void>; changePassword:(currentPassword:string,newPassword:string)=>Promise<{ok:boolean;error?:string}>; manageOfficeCategory:(c:OfficeCategory)=>Promise<void>; deleteOfficeCategory:(id:string)=>Promise<void>; manageOffice:(o:Office)=>Promise<void>; deleteOffice:(id:string)=>Promise<void>; createPurchaseRequest:(request:Omit<PurchaseRequest,"id"|"createdAt"|"createdBy"|"updatedAt">)=>Promise<any>; updatePurchaseRequest:(id:string,request:Partial<PurchaseRequest>)=>Promise<void>; deletePurchaseRequest:(id:string)=>Promise<void>; addLineItem:(requestId:string,item:Omit<LineItem,"id"|"createdAt">)=>Promise<void>; updateLineItem:(itemId:string,item:Partial<LineItem>)=>Promise<void>; deleteLineItem:(itemId:string)=>Promise<void>; addFormVendor:(requestId:string,vendor:Omit<FormVendor,"id"|"createdAt">)=>Promise<void>; submitVendorQuote:(requestId:string,vendorId:string,quotes:Record<string,number>)=>Promise<void>; getComparison:(requestId:string)=>Promise<any>; approveForm:(requestId:string,step:string,approval:{approverName:string;signature:string;date:string;remarks:string})=>Promise<void>; softDelete:(entityType:keyof AppData,id:string)=>Promise<void>; restore:(entityType:keyof AppData,id:string)=>Promise<void>; permanentDelete:(entityType:keyof AppData,id:string)=>Promise<void>; createBackup:()=>string; restoreFromBackup:()=>boolean; }
const AppContext=createContext<AppContextValue|null>(null);

export function AppProvider({children}:{children:ReactNode}) {
  const [data,setData]=useState<AppData>(empty()); const [currentUser,setCurrentUser]=useState<User|null>(null); const [loading,setLoading]=useState(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Automatic backup mechanism
  useEffect(() => {
    const startAutoBackup = () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
      backupIntervalRef.current = setInterval(() => {
        createBackup();
      }, BACKUP_INTERVAL);
    };
    
    startAutoBackup();
    
    return () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
    };
  }, []);
  
  const refresh=useCallback(async()=>{
    // Cancel any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    // Optimized parallel data fetching with error handling
    const fetchWithFallback = async (path: string, fallback: any = []) => {
      try {
        return await api(path);
      } catch (error) {
        console.warn(`Failed to fetch ${path}, using fallback data`);
        return { data: fallback };
      }
    };
    
    const [users,companies,contracts,orders,rawVendors,rawItems,audit,rawOfficeCategories,rawOffices,rawOfficeItems]=await Promise.all([
      fetchWithFallback("/users"),
      fetchWithFallback("/companies"),
      fetchWithFallback("/contracts"),
      fetchWithFallback("/orders"),
      fetchWithFallback("/vendors"),
      fetchWithFallback("/inventory-items"),
      fetchWithFallback("/audit-logs", []),
      fetchWithFallback("/office-categories", []),
      fetchWithFallback("/offices", []),
      fetchWithFallback("/office-items", [])
    ]);
    
    const cs=(companies.data??companies).map(companyFrom); 
    const vendorRows=rawVendors.data??rawVendors; 
    const vendors:Vendor[]=vendorRows.map((v:any)=>{const c=cs.find((x: Company)=>x.id===id(v.company_id));return{id:id(v.id),companyId:id(v.company_id),accountNo:v.account_no,vendorName:c?.name??"Vendor",type:c?.type??"services",taxId:v.tax_id??"",bankAccount:v.bank_account??"",contactInfo:v.contact_info??"",createdAt:v.created_at};});
    const officeCategories=(rawOfficeCategories.data??rawOfficeCategories).map(officeCategoryFrom);
    const offices=(rawOffices.data??rawOffices).map(officeFrom);
    const officeItems=(rawOfficeItems.data??rawOfficeItems).map(officeItemFrom);
    
    // Merge backend data with local data to preserve unsynced items (those with temporary IDs)
    const mergeWithLocal = <T extends {id:string}>(backendItems: T[], localItems: T[]): T[] => {
      const backendIds = new Set(backendItems.map(item => item.id));
      const localOnlyItems = localItems.filter(item => !backendIds.has(item.id));
      return [...localOnlyItems, ...backendItems];
    };
    
    setData(currentData => ({
      users: mergeWithLocal((users.data??users).map(userFrom), currentData.users),
      companies: mergeWithLocal(cs, currentData.companies),
      contracts: mergeWithLocal((contracts.data??contracts).map(contractFrom), currentData.contracts),
      orders: mergeWithLocal((orders.data??orders).map(orderFrom), currentData.orders),
      vendors: mergeWithLocal(vendors, currentData.vendors),
      auditLogs: mergeWithLocal((audit.data??audit??[]).map((x:any)=>({id:id(x.id),userId:id(x.actor_user_id??""),username:"",action:x.action,entity:x.entity_type,details:x.details??"",timestamp:x.created_at})), currentData.auditLogs),
      inventoryItems: mergeWithLocal((rawItems.data??rawItems).map(itemFrom), currentData.inventoryItems),
      inventoryMovements: currentData.inventoryMovements,
      officeCategories: mergeWithLocal(officeCategories, currentData.officeCategories),
      offices: mergeWithLocal(offices, currentData.offices),
      officeItems: mergeWithLocal(officeItems, currentData.officeItems),
      purchaseRequests: currentData.purchaseRequests,
      lineItems: currentData.lineItems,
      formVendors: currentData.formVendors,
      vendorQuoteLines: currentData.vendorQuoteLines,
      comparisonResults: currentData.comparisonResults,
      approvalWorkflows: currentData.approvalWorkflows,
      formAuditLogs: currentData.formAuditLogs
    }));
    
    // Create backup after successful refresh
    createBackup();
  },[]);
  
  useEffect(()=>{(async()=>{try{if(token()){const me=await api("/me");setCurrentUser(userFrom(me));await refresh();}}catch{sessionStorage.removeItem(TOKEN_KEY);}finally{setLoading(false);}})();},[refresh]);
  const login=useCallback(async(username:string,password:string)=>{try{const r=await api("/auth/login",{method:"POST",body:JSON.stringify({username,password})});sessionStorage.setItem(TOKEN_KEY,r.accessToken);setCurrentUser(userFrom(r.user));await refresh();return{ok:true};}catch(e){return{ok:false,error:e instanceof Error?e.message:"Login failed"};}},[refresh]);
  const logout=useCallback(()=>{void api("/auth/logout",{method:"POST"}).catch(()=>undefined);sessionStorage.removeItem(TOKEN_KEY);setCurrentUser(null);setData(empty());},[]);
  
  // Optimized updateData with debounced sync and performance improvements
  const updateData=useCallback((updater:(d:AppData)=>AppData,audit?:Omit<AuditLog,"id"|"userId"|"username"|"timestamp">,immediateSync=false)=>{
    setData(prev=>{const next=updater(prev); 
    
    // Sync office items when procurement orders with items are created
    const syncOfficeItems = () => {
      const newOfficeItems: OfficeItem[] = [];
      next.orders.forEach(order => {
        if (order.officeId && order.orderItems && order.orderItems.length > 0 && (order.category === "equipment" || order.category === "supplies")) {
          const officeId = order.officeId;
          order.orderItems.forEach(item => {
            const existingItem = prev.officeItems.find(oi => 
              oi.procurementOrderId === order.id && oi.itemName === item.name
            );
            if (!existingItem) {
              newOfficeItems.push({
                id: `oi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                officeId,
                procurementOrderId: order.id,
                itemName: item.name,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                currency: order.currency,
                totalValue: item.totalValue,
                receivedDate: new Date().toISOString(),
                condition: "new",
                createdAt: new Date().toISOString(),
              });
            }
          });
        }
      });
      if (newOfficeItems.length > 0) {
        next.officeItems = [...next.officeItems, ...newOfficeItems];
      }
    };
    syncOfficeItems();
    
    // Debounced sync for better performance (unless immediateSync is true)
    const sync=async()=>{try{
      const companyIdMap = await syncCollection(prev.companies,next.companies,"companies",companyPayload);
      await syncCollection(prev.contracts,next.contracts,"contracts",contractPayload);
      await syncCollection(prev.orders,next.orders,"orders",orderPayload);
      await syncCollection(prev.inventoryItems,next.inventoryItems,"inventory-items",itemPayload);
      await syncCollection(prev.officeCategories,next.officeCategories,"office-categories",(c:OfficeCategory)=>({name:c.name,code:c.code||null}));
      await syncCollection(prev.offices,next.offices,"offices",(o:Office)=>({office_category_id:o.categoryId,code:o.code||null,name:o.name,name_ps:o.namePs||null,name_fa:o.nameFa||null,active:o.active,description:o.description||null}));
      await syncCollection(prev.officeItems,next.officeItems,"office-items",(oi:OfficeItem)=>({office_id:oi.officeId,procurement_order_id:oi.procurementOrderId||null,item_name:oi.itemName,category:oi.category,quantity:oi.quantity,unit_price:oi.unitPrice,currency:oi.currency,total_value:oi.totalValue,received_date:oi.receivedDate,condition:oi.condition}));
      
      // Update local state with real backend IDs from the mappings
      if (companyIdMap.size > 0) {
        setData(currentData => ({
          ...currentData,
          companies: currentData.companies.map(c => {
            const realId = companyIdMap.get(c.id);
            return realId ? { ...c, id: realId } : c;
          })
        }));
      }
      
      // Only refresh if not using immediate sync to avoid overwriting recent changes
      if (!immediateSync) {
        await refresh();
      }
    }catch(e){console.error("Sync failed:", e);}};
    
    if (immediateSync) {
      // Sync immediately for critical operations like blacklist changes
      sync();
    } else {
      // Debounce sync to avoid excessive API calls
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        sync();
      }, 500); // 500ms debounce
    }
    
    return next;
  });},[refresh]);
  
  const resetData=useCallback(async()=>{await refresh();},[refresh]);
  const manageUser=useCallback(async(u:User,password?:string)=>{
    // Validate user data before API call
    const errors = validateUser(u);
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
    
    const payload={username:u.username,name:u.fullName,email:u.email||null,role:u.role,active:u.active,password};
    if(String(u.id).startsWith("usr_"))await api("/users",{method:"POST",body:JSON.stringify(payload)});else await api(`/users/${u.id}`,{method:"PATCH",body:JSON.stringify(payload)});
    await refresh();
  },[refresh]);
  const deleteUser=useCallback(async(uid:string)=>{
    try {
      await api(`/users/${uid}`,{method:"DELETE"});
      await refresh();
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },[refresh]);
  const manageVendor=useCallback(async(v:Vendor)=>{
    // Validate company data before API call
    const companyData: Company = {
      id: v.companyId || "",
      name: v.vendorName,
      type: v.type,
      registrationNo: `VENDOR-${v.accountNo}`,
      contactPerson: v.vendorName,
      phone: "",
      email: "",
      address: "",
      blacklisted: false,
      violations: [],
      experience: "",
      createdAt: new Date().toISOString(),
      createdBy: ""
    };
    
    const errors = validateCompany(companyData);
    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
    
    const companyPayload={legal_name:v.vendorName,company_type:v.type,registration_no:`VENDOR-${v.accountNo}`,contact_person:v.vendorName,phone:null,email:null,address:null,experience:null};
    let companyId=v.companyId;
    if(!companyId){
      const company=await api("/companies",{method:"POST",body:JSON.stringify(companyPayload)});
      companyId=id(company.id);
      await api("/vendors",{method:"POST",body:JSON.stringify({company_id:companyId,account_no:v.accountNo,tax_id:v.taxId||null,bank_account:v.bankAccount||null,contact_info:v.contactInfo||null})});
    }else{
      await api(`/companies/${companyId}`,{method:"PATCH",body:JSON.stringify(companyPayload)});
      await api(`/vendors/${v.id}`,{method:"PATCH",body:JSON.stringify({company_id:companyId,account_no:v.accountNo,tax_id:v.taxId||null,bank_account:v.bankAccount||null,contact_info:v.contactInfo||null})});
    }
    await refresh();
  },[refresh]);
  const deleteVendor=useCallback(async(vid:string)=>{await api(`/vendors/${vid}`,{method:"DELETE"});await refresh();},[refresh]);
  const changePassword=useCallback(async(currentPassword:string,newPassword:string)=>{try{await api("/me/change-password",{method:"POST",body:JSON.stringify({currentPassword,newPassword,newPassword_confirmation:newPassword})});return{ok:true};}catch(e){return{ok:false,error:e instanceof Error?e.message:"Password change failed"};}},[]);
  const manageOfficeCategory=useCallback(async(c:OfficeCategory)=>{const payload={name:c.name,code:c.code||null};if(String(c.id).startsWith("oc_"))await api("/office-categories",{method:"POST",body:JSON.stringify(payload)});else await api(`/office-categories/${c.id}`,{method:"PATCH",body:JSON.stringify(payload)});await refresh();},[refresh]);
  const deleteOfficeCategory=useCallback(async(cid:string)=>{await api(`/office-categories/${cid}`,{method:"DELETE"});await refresh();},[refresh]);
  const manageOffice=useCallback(async(o:Office)=>{const payload={office_category_id:o.categoryId,code:o.code||null,name:o.name,name_ps:o.namePs||null,name_fa:o.nameFa||null,active:o.active,description:o.description||null};if(String(o.id).startsWith("of_"))await api("/offices",{method:"POST",body:JSON.stringify(payload)});else await api(`/offices/${o.id}`,{method:"PATCH",body:JSON.stringify(payload)});await refresh();},[refresh]);
  const deleteOffice=useCallback(async(oid:string)=>{await api(`/offices/${oid}`,{method:"DELETE"});await refresh();},[refresh]);
  
  // Forms API functions
  const createPurchaseRequest=useCallback(async(request:Omit<PurchaseRequest,"id"|"createdAt"|"createdBy"|"updatedAt">)=>{const result=await api("/purchase-requests",{method:"POST",body:JSON.stringify(request)});await refresh();return result;},[refresh]);
  const updatePurchaseRequest=useCallback(async(id:string,request:Partial<PurchaseRequest>)=>{await api(`/purchase-requests/${id}`,{method:"PATCH",body:JSON.stringify(request)});await refresh();},[refresh]);
  const deletePurchaseRequest=useCallback(async(id:string)=>{await api(`/purchase-requests/${id}`,{method:"DELETE"});await refresh();},[refresh]);
  const addLineItem=useCallback(async(requestId:string,item:Omit<LineItem,"id"|"createdAt">)=>{await api(`/purchase-requests/${requestId}/items`,{method:"POST",body:JSON.stringify(item)});await refresh();},[refresh]);
  const updateLineItem=useCallback(async(itemId:string,item:Partial<LineItem>)=>{await api(`/line-items/${itemId}`,{method:"PATCH",body:JSON.stringify(item)});await refresh();},[refresh]);
  const deleteLineItem=useCallback(async(itemId:string)=>{await api(`/line-items/${itemId}`,{method:"DELETE"});await refresh();},[refresh]);
  const addFormVendor=useCallback(async(requestId:string,vendor:Omit<FormVendor,"id"|"createdAt">)=>{await api(`/purchase-requests/${requestId}/vendors`,{method:"POST",body:JSON.stringify(vendor)});await refresh();},[refresh]);
  const submitVendorQuote=useCallback(async(requestId:string,vendorId:string,quotes:Record<string,number>)=>{await api(`/purchase-requests/${requestId}/vendors/${vendorId}/quotes`,{method:"POST",body:JSON.stringify({quotes})});await refresh();},[refresh]);
  const getComparison=useCallback(async(requestId:string)=>{return await api(`/purchase-requests/${requestId}/comparison`);},[]);
  const approveForm=useCallback(async(requestId:string,step:string,approval:{approverName:string;signature:string;date:string;remarks:string})=>{await api(`/purchase-requests/${requestId}/approve`,{method:"POST",body:JSON.stringify({step,...approval})});await refresh();},[refresh]);
  
  // Soft delete function - marks item as deleted instead of removing it
  const softDelete=useCallback(async(entityType:keyof AppData,id:string)=>{
    const resourceMap: Record<keyof AppData, string> = {
      users: 'users',
      companies: 'companies',
      contracts: 'contracts',
      orders: 'orders',
      vendors: 'vendors',
      inventoryItems: 'inventory-items',
      inventoryMovements: 'inventory-movements',
      officeCategories: 'office-categories',
      offices: 'offices',
      officeItems: 'office-items',
      purchaseRequests: 'purchase-requests',
      lineItems: 'line-items',
      formVendors: 'form-vendors',
      vendorQuoteLines: 'vendor-quote-lines',
      comparisonResults: 'comparison-results',
      approvalWorkflows: 'approval-workflows',
      formAuditLogs: 'form-audit-logs',
      auditLogs: 'audit-logs',
    };
    const resource = resourceMap[entityType];
    if (!resource) {
      return;
    }
    
    try {
      await api(`/${resource}/${id}`, { method: 'DELETE' });
      updateData(prev=>{
        const collection=prev[entityType];
        if(!Array.isArray(collection))return prev;
        const updated=collection.map((item:any)=>item.id===id?{...item,deletedAt:new Date().toISOString(),deletedBy:currentUser?.id||""}:item);
        return{...prev,[entityType]:updated};
      });
    } catch (error) {
      throw error;
    }
  },[updateData,currentUser]);
  
  // Restore function - removes deletedAt and deletedBy
  const restore=useCallback(async(entityType:keyof AppData,id:string)=>{
    const resourceMap: Record<keyof AppData, string> = {
      users: 'users',
      companies: 'companies',
      contracts: 'contracts',
      orders: 'orders',
      vendors: 'vendors',
      inventoryItems: 'inventory-items',
      inventoryMovements: 'inventory-movements',
      officeCategories: 'office-categories',
      offices: 'offices',
      officeItems: 'office-items',
      purchaseRequests: 'purchase-requests',
      lineItems: 'line-items',
      formVendors: 'form-vendors',
      vendorQuoteLines: 'vendor-quote-lines',
      comparisonResults: 'comparison-results',
      approvalWorkflows: 'approval-workflows',
      formAuditLogs: 'form-audit-logs',
      auditLogs: 'audit-logs',
    };
    const resource = resourceMap[entityType];
    if (!resource) {
      return;
    }
    
    try {
      await api(`/${resource}/${id}/restore`, { method: 'POST' });
      updateData(prev=>{
        const collection=prev[entityType];
        if(!Array.isArray(collection))return prev;
        const updated=collection.map((item:any)=>item.id===id?{...item,deletedAt:undefined,deletedBy:undefined}:item);
        return{...prev,[entityType]:updated};
      });
    } catch (error) {
      throw error;
    }
  },[updateData]);
  
  // Permanent delete function - actually removes the item from the collection
  const permanentDelete=useCallback(async(entityType:keyof AppData,id:string)=>{
    const resourceMap: Record<keyof AppData, string> = {
      users: 'users',
      companies: 'companies',
      contracts: 'contracts',
      orders: 'orders',
      vendors: 'vendors',
      inventoryItems: 'inventory-items',
      inventoryMovements: 'inventory-movements',
      officeCategories: 'office-categories',
      offices: 'offices',
      officeItems: 'office-items',
      purchaseRequests: 'purchase-requests',
      lineItems: 'line-items',
      formVendors: 'form-vendors',
      vendorQuoteLines: 'vendor-quote-lines',
      comparisonResults: 'comparison-results',
      approvalWorkflows: 'approval-workflows',
      formAuditLogs: 'form-audit-logs',
      auditLogs: 'audit-logs',
    };
    const resource = resourceMap[entityType];
    if (!resource) {
      return;
    }
    
    try {
      await api(`/${resource}/${id}/force`, { method: 'DELETE' });
      updateData(prev=>{
        const collection=prev[entityType];
        if(!Array.isArray(collection))return prev;
        const updated=collection.filter((item:any)=>item.id!==id);
        return{...prev,[entityType]:updated};
      });
    } catch (error) {
      throw error;
    }
  },[updateData]);
  
  return <AppContext.Provider value={{data,currentUser,loading,login,logout,updateData,resetData,manageUser,deleteUser,manageVendor,deleteVendor,changePassword,manageOfficeCategory,deleteOfficeCategory,manageOffice,deleteOffice,createPurchaseRequest,updatePurchaseRequest,deletePurchaseRequest,addLineItem,updateLineItem,deleteLineItem,addFormVendor,submitVendorQuote,getComparison,approveForm,softDelete,restore,permanentDelete,createBackup,restoreFromBackup}}>{children}</AppContext.Provider>;
}
async function syncCollection<T extends {id:string}>(before:T[],after:T[],resource:string,payload:(x:T)=>unknown){
  const old=new Map(before.map(x=>[x.id,x])); 
  const now=new Map(after.map(x=>[x.id,x]));
  const idMap = new Map<string, string>(); // Map temporary IDs to real backend IDs
  
  for(const [key,value] of now){
    try {
      if(!old.has(key)){
        const result = await api(`/${resource}`,{method:"POST",body:JSON.stringify(payload(value))});
        // Store the mapping of temporary ID to real backend ID
        if (result && result.id) {
          idMap.set(key, String(result.id));
        }
      } else if(JSON.stringify(old.get(key))!==JSON.stringify(value)){
        await api(`/${resource}/${key}`,{method:"PATCH",body:JSON.stringify(payload(value))});
      }
    } catch(e) {
      console.error(`Sync failed for ${resource}/${key}:`, e);
    }
  }
  
  // Removed automatic deletion logic to prevent accidental data loss
  // Deletions should be handled explicitly through delete functions
  
  return idMap;
}
const companyPayload=(x:Company)=>({legal_name:x.name,company_type:x.type,registration_no:x.registrationNo,contact_person:x.contactPerson,phone:x.phone,email:x.email,address:x.address,experience:x.experience,eligibility_status:x.blacklisted?"blacklisted":"eligible",blacklist_reason:x.blacklistReason||null});
const contractPayload=(x:Contract)=>({contract_no:x.contractNo,company_id:x.companyId,title:x.title,amount:x.amount,currency:x.currency,start_date:x.startDate,end_date:x.endDate,status:x.status,progress_percent:x.progressPercent,description:x.description});
const orderPayload=(x:ProcurementOrder)=>({order_no:x.orderNo,title:x.title,company_id:x.companyId||null,office_id:x.officeId||null,category:x.category,priority:x.priority,status:x.status,requested_date:x.requestedDate,required_date:x.requiredDate,amount:x.amount,equipment:x.equipment,items:x.items,currency:x.currency,description:x.description});
const itemPayload=(x:InventoryItem)=>({code:x.code,name:x.name,item_type:x.type,category:x.category,description:x.description,unit:x.unit,min_stock:x.minStock,max_stock:x.maxStock,reorder_point:x.reorderPoint,inventory_location_id:Number(x.location),supplier_company_id:x.supplierId?Number(x.supplierId):null,batch_number:x.batchNumber,serial_number:x.serialNumber,received_date:x.receivedDate,expiry_date:x.expiryDate,condition:x.condition,notes:x.notes,currency:"AFN"});
export function useApp(){const ctx=useContext(AppContext);if(!ctx)throw new Error("useApp must be used within AppProvider");return ctx;}
