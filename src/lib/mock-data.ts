
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
  { id: 'u-choc-mgr', name: 'Sarah Mitchell', email: 'sarah.m@brandsbridge.com', role: 'manager', department: 'chocolate', status: 'active', joinDate: '2022-03-10' }
];

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
  }
];

export const MOCK_EMAILS = [];
export const MOCK_PURCHASES = [];
export const MOCK_UPLOAD_LOGS = [];
export const MOCK_LOGS = [];
export const MOCK_TASKS = [];
export const MOCK_LEADS = [];
export const MOCK_CAMPAIGNS = [];
export const MOCK_OFFERS_TRACKING = [];
export const MOCK_STOCKS = [];
export const MOCK_OFFERS = [];
export const MOCK_RESPONSES = [];
export const MOCK_CUSTOMERS = [];
export const MOCK_SUPPLIERS = [];
export const CHART_OF_ACCOUNTS = [];
export const MOCK_PAYMENTS = [];
export const MOCK_JOURNALS = [];
export const MOCK_EXPENSES = [];
export const MOCK_PURCHASE_ORDERS = [];
