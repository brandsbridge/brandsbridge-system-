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
  { id: 'u-admin', name: 'Super Admin', email: 'admin@bizflow.com', role: 'admin', department: 'all', status: 'active', joinDate: '2022-01-15', lastLogin: new Date().toISOString() },
  { id: 'u-choc-mgr', name: 'DIA Manager', email: 'dia@bizflow.com', role: 'manager', department: 'chocolate', status: 'active', joinDate: '2022-03-10' },
  { id: 'u-cosm-mgr', name: 'Musaed Manager', email: 'musaed@bizflow.com', role: 'manager', department: 'cosmetics', status: 'active', joinDate: '2022-05-20' },
  { id: 'u-det-mgr', name: 'Saddam Manager', email: 'saddam@bizflow.com', role: 'manager', department: 'detergents', status: 'active', joinDate: '2022-08-12' }
];

export const MOCK_EMPLOYEES: Employee[] = DEMO_USERS;

export const MOCK_PRODUCTS = [
  { id: 'p1', gtin: '4008400401021', name: 'Kinder Bueno 43g', brand: 'Kinder', category: 'Chocolate', packing: 30, weightNet: 1.29, weightGross: 1.5, department: 'chocolate' },
  { id: 'p2', gtin: '7622300440121', name: 'Milka Alpine Milk 100g', brand: 'Milka', category: 'Chocolate', packing: 20, weightNet: 2.0, weightGross: 2.3, department: 'chocolate' },
  { id: 'p3', gtin: '3017620422003', name: 'Nutella 400g Glass', brand: 'Nutella', category: 'Spreads', packing: 15, weightNet: 6.0, weightGross: 9.5, department: 'chocolate' },
  { id: 'p4', gtin: '5000159461122', name: 'KitKat 4 Finger 41.5g', brand: 'KitKat', category: 'Chocolate', packing: 24, weightNet: 1.0, weightGross: 1.2, department: 'chocolate' },
  { id: 'p5', gtin: '8000500003781', name: 'Ferrero Rocher T16 200g', brand: 'Ferrero', category: 'Chocolate', packing: 5, weightNet: 1.0, weightGross: 1.8, department: 'chocolate' }
];

export const MOCK_INVOICES = [];
export const MOCK_SUPPLIERS = [];
export const MOCK_CUSTOMERS = [];
export const MOCK_STOCKS = [];
export const MOCK_OFFERS = [];
export const MOCK_RESPONSES = [];
export const CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Cash', group: 'Assets' },
  { code: '1100', name: 'Accounts Receivable', group: 'Assets' },
  { code: '1200', name: 'Inventory', group: 'Assets' },
  { code: '2000', name: 'Accounts Payable', group: 'Liabilities' },
  { code: '4000', name: 'Sales Revenue', group: 'Income' },
  { code: '5000', name: 'Cost of Goods Sold', group: 'Expenses' },
  { code: '6000', name: 'Salaries and Wages', group: 'Expenses' },
  { code: '6100', name: 'Rent Expense', group: 'Expenses' }
];

export const MOCK_EMAILS = [];
export const MOCK_PURCHASES = [];
export const MOCK_UPLOAD_LOGS = [];
export const MOCK_LOGS = [];
export const MOCK_TASKS = [];
export const MOCK_LEADS = [];
export const MOCK_CAMPAIGNS = [];
export const MOCK_OFFERS_TRACKING = [];
export const MOCK_PAYMENTS = [];
export const MOCK_JOURNALS = [];
export const MOCK_EXPENSES = [];
export const MOCK_PURCHASE_ORDERS = [];
