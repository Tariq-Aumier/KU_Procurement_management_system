// Dashboard API using the existing api function from AppContext
// This will be imported and used within components that have access to AppContext

export interface DashboardStats {
  companies: Array<{
    id: number;
    name: string;
    blacklisted: boolean;
  }>;
  contracts: Array<{
    id: number;
    title: string;
    contract_no: string;
    company_id: number;
    amount: number;
    currency: string;
    status: string;
    tier: string;
    progressPercent: number;
    created_at: string;
  }>;
  orders: Array<{
    id: number;
    title: string;
    order_no: string;
    priority: string;
    status: string;
    required_date: string;
  }>;
  stats: {
    totalCompanies: number;
    blacklistedCompanies: number;
    activeContracts: number;
    totalContractValue: number;
    pendingOrders: number;
    urgentOrders: number;
    incompleteOrders: number;
    tierCounts: {
      tier1: number;
      tier2: number;
      tier3: number;
      tier4: number;
    };
  };
}

export interface DashboardResponse {
  data: DashboardStats;
}
