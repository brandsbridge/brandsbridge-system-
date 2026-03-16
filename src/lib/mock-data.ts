
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
  { id: 'u-admin', name: 'Alex Export', email: 'admin@brandsbridge.com', role: 'admin', department: 'all', status: 'active', joinDate: '2022-01-15', lastLogin: new Date().toISOString() },
  { id: 'u-choc-mgr', name: 'Sarah Mitchell', email: 'sarah.m@brandsbridge.com', role: 'manager', department: 'chocolate', status: 'active', joinDate: '2022-03-10' },
  { id: 'u-cosm-mgr', name: 'James Wilson', email: 'james.w@brandsbridge.com', role: 'manager', department: 'cosmetics', status: 'active', joinDate: '2022-05-20' },
  { id: 'u-det-mgr', name: 'Elena Rodriguez', email: 'elena.r@brandsbridge.com', role: 'manager', department: 'detergents', status: 'active', joinDate: '2022-08-12' }
];

export const MOCK_EMPLOYEES: Employee[] = DEMO_USERS;

export const MOCK_PRODUCTS = [
  { id: 'p1', gtin: '4008400401021', name: 'Kinder Bueno 43g', brand: 'Kinder', category: 'Chocolate', packing: 30, weightNet: 1.29, weightGross: 1.5, department: 'chocolate' },
  { id: 'p2', gtin: '7622300440121', name: 'Milka Alpine Milk 100g', brand: 'Milka', category: 'Chocolate', packing: 20, weightNet: 2.0, weightGross: 2.3, department: 'chocolate' },
  { id: 'p3', gtin: '3017620422003', name: 'Nutella 400g Glass', brand: 'Nutella', category: 'Spreads', packing: 15, weightNet: 6.0, weightGross: 9.5, department: 'chocolate' },
  { id: 'p4', gtin: '5000159461122', name: 'KitKat 4 Finger 41.5g', brand: 'KitKat', category: 'Chocolate', packing: 24, weightNet: 1.0, weightGross: 1.2, department: 'chocolate' },
  { id: 'p5', gtin: '8000500003781', name: 'Ferrero Rocher T16 200g', brand: 'Ferrero', category: 'Chocolate', packing: 5, weightNet: 1.0, weightGross: 1.8, department: 'chocolate' }
];

// Helper to generate 40 line items for demo
const generateDemoLines = (basePrice: number) => {
  return Array.from({ length: 40 }).map((_, i) => {
    const product = MOCK_PRODUCTS[i % MOCK_PRODUCTS.length];
    const qtyCs = 10 + i;
    const qtyPcs = qtyCs * product.packing;
    const price = basePrice + (i * 0.05);
    return {
      gtin: product.gtin,
      description: `${product.name} - Bulk Pack Export`,
      packing: product.packing,
      quantityCs: qtyCs,
      quantityPcs: qtyPcs,
      priceNet: price,
      vatRate: 0,
      total: qtyPcs * price
    };
  });
};

export const MOCK_INVOICES = [
  {
    id: 'inv-exp-001',
    number: 'FSE-EXP/00000099/10/2025',
    type: 'EXP',
    status: 'sent',
    dateIssue: '2025-10-12',
    dateSale: '2025-10-10',
    customerName: 'Global Trade USA LLC',
    destinationCountry: 'USA',
    deliveryTerms: 'CIF',
    department: 'chocolate',
    createdBy: 'Alex Export',
    totals: {
      net: 45670.50,
      vat: 0,
      gross: 45670.50,
      weightNet: 1250.5,
      weightGross: 1400.2,
      totalBoxes: 450
    },
    shippingInfo: {
      shipmentDate: '2025-10-15',
      truckNumber: 'ABC-1234',
      containerNumber: 'MSCU998877',
      orderNumber: 'PO-US-992'
    },
    lineItems: generateDemoLines(0.85)
  },
  {
    id: 'inv-exp-002',
    number: 'FSE-EXP/00000100/10/2025',
    type: 'EXP',
    status: 'paid',
    dateIssue: '2025-10-14',
    dateSale: '2025-10-12',
    customerName: 'Gulf Food Distributors',
    destinationCountry: 'UAE',
    deliveryTerms: 'EXW',
    department: 'chocolate',
    createdBy: 'Alex Export',
    totals: {
      net: 82400.00,
      vat: 0,
      gross: 82400.00,
      weightNet: 2400.0,
      weightGross: 2650.0,
      totalBoxes: 800
    },
    shippingInfo: {
      shipmentDate: '2025-10-18',
      truckNumber: 'DXB-9921',
      containerNumber: 'CMAU112233',
      orderNumber: 'ORD-GULF-10'
    },
    lineItems: generateDemoLines(1.10)
  },
  {
    id: 'inv-exp-003',
    number: 'FSE-EXP/00000101/10/2025',
    type: 'EXP',
    status: 'overdue',
    dateIssue: '2025-10-15',
    dateSale: '2025-10-13',
    customerName: 'EuroRetail Group',
    destinationCountry: 'Germany',
    deliveryTerms: 'CIF',
    department: 'chocolate',
    createdBy: 'Alex Export',
    totals: {
      net: 12500.00,
      vat: 0,
      gross: 12500.00,
      weightNet: 500.0,
      weightGross: 550.0,
      totalBoxes: 120
    },
    shippingInfo: {
      shipmentDate: '2025-10-20',
      truckNumber: 'GER-1122',
      containerNumber: 'HAPAG-001',
      orderNumber: 'EU-9921'
    },
    lineItems: generateDemoLines(0.95).slice(0, 10)
  }
];

export const MOCK_SUPPLIERS = [
  { id: 's1', name: 'Istanbul Industrial Group', country: 'Turkey', email: 'sales@istanbul-ind.com', natureOfBusiness: 'Manufacturer', recordStatus: 'Active - Verified', departments: ['chocolate', 'cosmetics'], ratings: { frequency: 5, speed: 4, price: 4 }, leadTime: 14, contractStatus: 'active' },
  { id: 's2', name: 'Dubai Global Logistics', country: 'UAE', email: 'procurement@dubai-log.ae', natureOfBusiness: 'Distributor', recordStatus: 'Active - Verified', departments: ['chocolate', 'detergents'], ratings: { frequency: 4, speed: 5, price: 3 }, leadTime: 3, contractStatus: 'active' },
  { id: 's3', name: 'Swiss Choc S.A.', country: 'Switzerland', email: 'export@swisschoc.ch', natureOfBusiness: 'Manufacturer', recordStatus: 'Active - Verified', departments: ['chocolate'], ratings: { frequency: 5, speed: 3, price: 2 }, leadTime: 21, contractStatus: 'active' }
];

export const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'Global Trade USA LLC', country: 'USA', city: 'New York', email: 'ops@globaltrade-usa.com', accountStatus: 'active', accountHealth: 'healthy', totalRevenue: 150000, departments: ['chocolate'], ratings: { responseTime: 5, activity: 4, volume: 5 }, internalRating: 5, dataCompleteness: 95, assignedManager: 'Sarah Mitchell' },
  { id: 'c2', name: 'Gulf Food Distributors', country: 'UAE', city: 'Dubai', email: 'buyer@gulffood.ae', accountStatus: 'key account', accountHealth: 'healthy', totalRevenue: 450000, departments: ['chocolate', 'detergents'], ratings: { responseTime: 4, activity: 5, volume: 5 }, internalRating: 5, dataCompleteness: 88, assignedManager: 'Alex Export' },
  { id: 'c3', name: 'EuroRetail Group', country: 'Germany', city: 'Berlin', email: 'procurement@euroretail.de', accountStatus: 'at risk', accountHealth: 'dormant', totalRevenue: 85000, departments: ['chocolate', 'cosmetics'], ratings: { responseTime: 2, activity: 2, volume: 3 }, internalRating: 3, dataCompleteness: 75, assignedManager: 'James Wilson' }
];

export const MOCK_STOCKS = [
  { id: 'st1', productId: 'p1', supplierId: 's1', quantity: 500, price: 0.75, leadTime: 14, department: 'chocolate' },
  { id: 'st2', productId: 'p1', supplierId: 's2', quantity: 150, price: 0.82, leadTime: 3, department: 'chocolate' },
  { id: 'st3', productId: 'p2', supplierId: 's3', quantity: 1000, price: 1.10, leadTime: 21, department: 'chocolate' },
  { id: 'st4', productId: 'p3', supplierId: 's2', quantity: 200, price: 4.50, leadTime: 5, department: 'chocolate' }
];

export const MOCK_OFFERS = [
  { id: 'o1', productId: 'p1', supplierId: 's1', bestPrice: 0.75, leadTime: 14, calculatedAt: { seconds: Date.now() / 1000 } },
  { id: 'o2', productId: 'p2', supplierId: 's3', bestPrice: 1.10, leadTime: 21, calculatedAt: { seconds: Date.now() / 1000 } }
];

export const MOCK_RESPONSES = [
  { id: 'r1', customerId: 'c1', bestOfferId: 'o1', responseType: 'order', createdAt: { seconds: Date.now() / 1000 } },
  { id: 'r2', customerId: 'c2', bestOfferId: 'o2', responseType: 'quote', createdAt: { seconds: Date.now() / 1000 } }
];

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
