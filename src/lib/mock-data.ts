export const MOCK_DEPARTMENTS = [
  { id: 'chocolate', name: 'Chocolate Market', icon: '🍫', manager: 'Sarah Mitchell' },
  { id: 'cosmetics', name: 'Cosmetics Market', icon: '💄', manager: 'David Rahman' },
  { id: 'detergents', name: 'Detergents Market', icon: '🧴', manager: 'Maria Garcia' }
];

export type UserRole = 'admin' | 'manager' | 'sales' | 'viewer';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin?: string;
}

export const DEMO_USERS: Employee[] = [
  { id: 'u-saleh', name: 'Saleh Admin', email: 'saleh@gmail.com', role: 'admin', department: 'all', status: 'active', joinDate: '2024-03-13', lastLogin: new Date().toISOString() },
  { id: 'u-admin', name: 'Alex Johnson', email: 'admin@brandsbridge.com', role: 'admin', department: 'all', status: 'active', joinDate: '2022-01-15', lastLogin: '2024-05-20T10:30:00Z' },
  { id: 'u-choc-mgr', name: 'Sarah Mitchell', email: 'sarah.m@brandsbridge.com', role: 'manager', department: 'chocolate', status: 'active', joinDate: '2022-03-10', lastLogin: '2024-05-21T09:15:00Z' },
  { id: 'u-cosm-mgr', name: 'David Rahman', email: 'david.r@brandsbridge.com', role: 'manager', department: 'cosmetics', status: 'active', joinDate: '2022-05-20', lastLogin: '2024-05-21T08:00:00Z' },
  { id: 'u-det-mgr', name: 'Maria Garcia', email: 'maria.g@brandsbridge.com', role: 'manager', department: 'detergents', status: 'active', joinDate: '2022-08-15', lastLogin: '2024-05-21T07:45:00Z' },
];

export const MOCK_EMPLOYEES = DEMO_USERS;

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  flag: string;
  departments: string[];
  natureOfBusiness: string;
  website: string;
  socialLinks: { linkedin?: string; instagram?: string; facebook?: string; whatsapp?: string };
  specializedProducts: string[];
  topSellingProducts: { name: string; unit: string; avgPrice: string }[];
  contacts: {
    sales: { name: string; email: string; phone: string; whatsapp: string };
    export: { name: string; email: string; phone: string; whatsapp: string };
    support: { phone: string; email: string; hours: string; language: string };
  };
  overview: string;
  yearEstablished: number;
  employeeCount: string;
  annualExportVolume: string;
  marketsServed: string[];
  certifications: {
    organic: { has: boolean; expiry?: string };
    halal: { has: boolean; expiry?: string; body?: string };
    iso: { has: boolean; expiry?: string; number?: string };
    fda: { has: boolean };
  };
  pricing: {
    tier: 'Budget' | 'Mid-Range' | 'Premium' | 'Luxury';
    moq: string;
    mov: number;
    paymentTerms: string[];
    currency: string;
    incoterms: string[];
    leadTime: number;
    samplePolicy: string;
  };
  strategicNotes: string;
  recordStatus: string;
  priorityLevel: 'High' | 'Medium' | 'Low';
  internalRating: number;
  dataCompleteness: number;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
  verifiedBy?: string;
  ratings: { frequency: number; speed: number; price: number };
  productsOffered: string[];
  leadTime?: number;
  contractStatus?: string;
}

export const MOCK_SUPPLIERS: Supplier[] = [];

export interface Customer {
  id: string;
  name: string;
  email: string;
  country: string;
  city: string;
  flag: string;
  departments: string[];
  companyType: string;
  natureOfBusiness: string;
  yearEstablished: number;
  companySize: string;
  website: string;
  socialLinks: { linkedin?: string; instagram?: string; facebook?: string; whatsapp?: string };
  contacts: {
    primary: { name: string; designation: string; email: string; phone: string; whatsapp: string; linkedin?: string; preferredTime: string; language: string };
    secondary: { name: string; designation: string; email: string; phone: string; whatsapp: string };
    finance: { name: string; designation: string; email: string; phone: string };
  };
  interests: {
    categories: string[];
    products: string[];
    brands: string[];
    quality: string;
    certifications: string[];
  };
  buyingBehavior: {
    frequency: string;
    valueRange: string;
    typicalQuantity: string;
    seasonalMonths: string[];
    decisionTime: string;
    priceSensitivity: string;
    foundVia: string;
  };
  commercial: {
    paymentTerms: string[];
    currency: string;
    incoterms: string[];
    destination: string;
    shippingMethod: string;
    specialRequirements: string;
  };
  accountStatus: string;
  accountPriority: 'High' | 'Medium' | 'Low';
  assignedManager: string;
  assignedSales: string;
  internalRating: number;
  recordStatus: string;
  dataCompleteness: number;
  overview: string;
  targetMarkets: string[];
  keyProducts: string[];
  competitiveAdvantages: string[];
  strategicImportance: string;
  strategicNotes: string;
  lastContactDate: string;
  lastPurchaseDate: string;
  totalRevenue: number;
  accountHealth: string;
  ratings: { responseTime: number; activity: number; volume: number };
  interestedProducts: string[];
}

export const MOCK_CUSTOMERS: Customer[] = [];

export const MOCK_PRODUCTS: any[] = [];
export const MOCK_STOCKS: any[] = [];
export const MOCK_OFFERS: any[] = [];
export const MOCK_RESPONSES: any[] = [];

// --- ACCOUNTING STRUCTURE (KEEP ESSENTIAL) ---

export const CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Cash & Bank Accounts', type: 'Asset', group: 'Assets' },
  { code: '1100', name: 'Accounts Receivable', type: 'Asset', group: 'Assets' },
  { code: '1200', name: 'Inventory Value', type: 'Asset', group: 'Assets' },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', group: 'Liabilities' },
  { code: '2200', name: 'Tax Payable (VAT)', type: 'Liability', group: 'Liabilities' },
  { code: '3000', name: 'Sales Revenue (Chocolate)', type: 'Revenue', group: 'Revenue' },
  { code: '3100', name: 'Sales Revenue (Cosmetics)', type: 'Revenue', group: 'Revenue' },
  { code: '3200', name: 'Sales Revenue (Detergents)', type: 'Revenue', group: 'Revenue' },
  { code: '4000', name: 'Cost of Goods Sold (COGS)', type: 'Expense', group: 'Expenses' },
  { code: '4100', name: 'Shipping & Freight', type: 'Expense', group: 'Expenses' },
  { code: '4200', name: 'Marketing Expenses', type: 'Expense', group: 'Expenses' },
  { code: '4300', name: 'Salaries & Wages', type: 'Expense', group: 'Expenses' },
];

export const MOCK_INVOICES: any[] = [];
export const MOCK_PURCHASE_ORDERS: any[] = [];
export const MOCK_PAYMENTS: any[] = [];
export const MOCK_JOURNALS: any[] = [];
export const MOCK_EXPENSES: any[] = [];
export const MOCK_UPLOAD_LOGS: any[] = [];
export const MOCK_LOGS: any[] = [];
export const MOCK_TASKS: any[] = [];
export const MOCK_LEADS: any[] = [];
export const MOCK_CAMPAIGNS: any[] = [];
export const MOCK_EMAILS: any[] = [];
export const MOCK_OFFERS_TRACKING: any[] = [];
export const MOCK_PURCHASES: any[] = [];
