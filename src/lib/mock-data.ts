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
  { id: 'u-admin', name: 'Alex Johnson', email: 'admin@brandsbridge.com', role: 'admin', department: 'all', status: 'active', joinDate: '2022-01-15', lastLogin: '2024-05-20T10:30:00Z' },
  { id: 'u-choc-mgr', name: 'Sarah Mitchell', email: 'sarah.m@brandsbridge.com', role: 'manager', department: 'chocolate', status: 'active', joinDate: '2022-03-10', lastLogin: '2024-05-21T09:15:00Z' },
  { id: 'u-choc-sales1', name: 'James Carter', email: 'james.c@brandsbridge.com', role: 'manager', department: 'chocolate', status: 'active', joinDate: '2023-01-05', lastLogin: '2024-05-20T14:45:00Z' },
  { id: 'u-choc-sales2', name: 'Lisa Wong', email: 'lisa.w@brandsbridge.com', role: 'sales', department: 'chocolate', status: 'active', joinDate: '2023-06-12', lastLogin: '2024-05-19T11:20:00Z' },
  { id: 'u-choc-view', name: 'Tom Baker', email: 'tom.b@brandsbridge.com', role: 'viewer', department: 'chocolate', status: 'active', joinDate: '2024-02-01', lastLogin: '2024-05-18T16:00:00Z' },
  { id: 'u-cosm-mgr', name: 'David Rahman', email: 'david.r@brandsbridge.com', role: 'manager', department: 'cosmetics', status: 'active', joinDate: '2022-05-20', lastLogin: '2024-05-21T08:00:00Z' },
  { id: 'u-cosm-sales1', name: 'Emma Davis', email: 'emma.d@brandsbridge.com', role: 'manager', department: 'cosmetics', status: 'active', joinDate: '2023-02-15', lastLogin: '2024-05-20T13:30:00Z' },
  { id: 'u-cosm-sales2', name: 'Noah Smith', email: 'noah.s@brandsbridge.com', role: 'sales', department: 'cosmetics', status: 'active', joinDate: '2023-08-20', lastLogin: '2024-05-19T10:10:00Z' },
  { id: 'u-cosm-view', name: 'Olivia Brown', email: 'olivia.b@brandsbridge.com', role: 'viewer', department: 'cosmetics', status: 'active', joinDate: '2024-01-10', lastLogin: '2024-05-18T15:20:00Z' },
  { id: 'u-det-mgr', name: 'Maria Garcia', email: 'maria.g@brandsbridge.com', role: 'manager', department: 'detergents', status: 'active', joinDate: '2022-08-15', lastLogin: '2024-05-21T07:45:00Z' },
  { id: 'u-det-sales1', name: 'Chris Lee', email: 'chris.l@brandsbridge.com', role: 'manager', department: 'detergents', status: 'active', joinDate: '2023-04-10', lastLogin: '2024-05-20T12:00:00Z' },
  { id: 'u-det-sales2', name: 'Anna White', email: 'anna.w@brandsbridge.com', role: 'sales', department: 'detergents', status: 'active', joinDate: '2023-11-05', lastLogin: '2024-05-19T09:40:00Z' },
  { id: 'u-det-view', name: 'Ryan Taylor', email: 'ryan.t@brandsbridge.com', role: 'viewer', department: 'detergents', status: 'active', joinDate: '2024-03-20', lastLogin: '2024-05-18T14:15:00Z' },
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
  recordStatus: 'Active - Verified' | 'Active - Pending Verification' | 'Under Review' | 'Inactive' | 'Blacklisted' | 'Checking Data';
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

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'Cocoa Bean Co.',
    email: 'sales@cocoabean.com',
    phone: '+90 555 123 4567',
    country: 'Turkey',
    flag: '🇹🇷',
    departments: ['chocolate'],
    natureOfBusiness: 'Manufacturer',
    website: 'https://cocoabean.tr',
    socialLinks: { linkedin: 'linkedin.com/company/cocoabean', whatsapp: '+90 555 123 4567' },
    specializedProducts: ['Cocoa Butter', 'Pralines', 'Mass Cocoa'],
    topSellingProducts: [
      { name: 'Premium Cocoa Butter', unit: 'Metric Ton', avgPrice: '$12.50/kg' },
      { name: 'Hazelnut Pralines', unit: 'Box', avgPrice: '$45.00' }
    ],
    contacts: {
      sales: { name: 'Ahmet Yilmaz', email: 'ahmet@cocoabean.tr', phone: '+90 555 123 4567', whatsapp: '+90 555 123 4567' },
      export: { name: 'Zeynep Kaya', email: 'export@cocoabean.tr', phone: '+ Turkish export', whatsapp: '+90 555 123 4568' },
      support: { phone: '+90 555 123 4500', email: 'support@cocoabean.tr', hours: '09:00 - 18:00 (GMT+3)', language: 'English, Turkish' }
    },
    overview: 'Established in 1995, Cocoa Bean Co. is a leading manufacturer of premium cocoa products in the region.',
    yearEstablished: 1995,
    employeeCount: '201-500',
    annualExportVolume: '$5-20M',
    marketsServed: ['GCC', 'Europe', 'Asia'],
    certifications: {
      organic: { has: true, expiry: '2024-12-31' },
      halal: { has: true, expiry: '2025-06-15', body: 'Turkish Halal Authority' },
      iso: { has: true, expiry: '2024-10-20', number: 'ISO 9001:2015' },
      fda: { has: true }
    },
    pricing: {
      tier: 'Mid-Range',
      moq: '500 KG',
      mov: 5000,
      paymentTerms: ['TT in advance', 'LC at sight'],
      currency: 'USD',
      incoterms: ['FOB', 'EXW'],
      leadTime: 5,
      samplePolicy: 'Paid samples'
    },
    strategicNotes: 'Exclusive distributor agreement for KSA pending.',
    recordStatus: 'Active - Verified',
    priorityLevel: 'High',
    internalRating: 5,
    dataCompleteness: 95,
    lastUpdatedBy: 'Sarah Mitchell',
    lastUpdatedDate: '2024-05-20T10:30:00Z',
    verifiedBy: 'Alex Johnson',
    ratings: { frequency: 5, speed: 4, price: 4 },
    productsOffered: ['Cocoa Butter'],
    leadTime: 5,
    contractStatus: 'active'
  }
];

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
  accountStatus: 'prospect' | 'active' | 'key account' | 'dormant' | 'at risk' | 'churned' | 'blacklisted';
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
  accountHealth: 'healthy' | 'at risk' | 'dormant' | 'churned';
  ratings: { responseTime: number; activity: number; volume: number };
  interestedProducts: string[];
}

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Sweet Tooth Retail',
    email: 'purchasing@sweettooth.com',
    country: 'UAE',
    city: 'Dubai',
    flag: '🇦🇪',
    departments: ['chocolate'],
    companyType: 'Supermarket Chain',
    natureOfBusiness: 'Retail distribution of high-end confectionery',
    yearEstablished: 2010,
    companySize: '200+ employees',
    website: 'https://sweettooth.ae',
    socialLinks: { linkedin: 'linkedin.com/company/sweettooth', instagram: 'instagram.com/sweettooth_ae' },
    contacts: {
      primary: { name: 'Mariam Al-Farsi', designation: 'Procurement Director', email: 'mariam@sweettooth.ae', phone: '+971 50 123 4567', whatsapp: '+971 50 123 4567', preferredTime: '09:00 - 11:00 AM', language: 'Arabic, English' },
      secondary: { name: 'John Doe', designation: 'Operations Manager', email: 'john@sweettooth.ae', phone: '+971 50 123 4568', whatsapp: '+971 50 123 4568' },
      finance: { name: 'Sarah Smith', designation: 'Finance Manager', email: 'accounts@sweettooth.ae', phone: '+971 4 555 6666' }
    },
    interests: {
      categories: ['chocolate'],
      products: ['Milk Chocolate', 'Dark Chocolate 70%', 'Cocoa Butter'],
      brands: ['Lindt', 'Godiva', 'Local Premium'],
      quality: 'Premium',
      certifications: ['Halal', 'ISO']
    },
    buyingBehavior: {
      frequency: 'Monthly',
      valueRange: '$5K-20K',
      typicalQuantity: '500 KG',
      seasonalMonths: ['December', 'April', 'October'],
      decisionTime: 'Fast <1 week',
      priceSensitivity: 'Balanced',
      foundVia: 'Exhibition'
    },
    commercial: {
      paymentTerms: ['TT in advance', 'LC'],
      currency: 'AED',
      incoterms: ['DDP'],
      destination: 'Jebel Ali Free Zone, Dubai',
      shippingMethod: 'Sea',
      specialRequirements: 'Temperature controlled storage required'
    },
    accountStatus: 'active',
    accountPriority: 'High',
    assignedManager: 'Sarah Mitchell',
    assignedSales: 'James Carter',
    internalRating: 5,
    recordStatus: 'Active - Verified',
    dataCompleteness: 98,
    overview: 'Sweet Tooth Retail is the fastest-growing premium chocolate retailer in the UAE with 15 locations.',
    targetMarkets: ['UAE', 'Oman'],
    keyProducts: ['Specialty Chocolate', 'Gift Boxes'],
    competitiveAdvantages: ['Prime locations', 'Excellent cold chain'],
    strategicImportance: 'Gateway to high-end UAE consumers.',
    strategicNotes: 'Very quality focused. Mariam prefers direct WhatsApp communication for urgent quotes.',
    lastContactDate: '2024-05-15T10:00:00Z',
    lastPurchaseDate: '2024-05-01T14:30:00Z',
    totalRevenue: 125000,
    accountHealth: 'healthy',
    ratings: { responseTime: 5, activity: 5, volume: 4 },
    interestedProducts: ['Milk Choc']
  },
  {
    id: 'c-shared',
    name: 'EuroRetail Group',
    email: 'purchasing@euroretail.eu',
    country: 'Netherlands',
    city: 'Amsterdam',
    flag: '🇳🇱',
    departments: ['chocolate', 'cosmetics'],
    companyType: 'Distributor',
    natureOfBusiness: 'Pan-European consumer goods distributor',
    yearEstablished: 1985,
    companySize: '200+ employees',
    website: 'https://euroretail.eu',
    socialLinks: { linkedin: 'linkedin.com/group/euroretail' },
    contacts: {
      primary: { name: 'Hans De Vries', designation: 'Purchasing Manager', email: 'hans@euroretail.eu', phone: '+31 20 123 4567', whatsapp: '+31 6 123 45678', preferredTime: 'Morning', language: 'English, Dutch' },
      secondary: { name: 'Elena Petrova', designation: 'Logistics', email: 'elena@euroretail.eu', phone: '+31 20 123 4569', whatsapp: '' },
      finance: { name: 'Mark Jansen', designation: 'Accounts', email: 'invoice@euroretail.eu', phone: '+31 20 123 4500' }
    },
    interests: {
      categories: ['chocolate', 'cosmetics'],
      products: ['Raw Cocoa', 'Hyaluronic Acid', 'Shea Butter'],
      brands: [],
      quality: 'Mid-Range',
      certifications: ['Organic', 'ISO']
    },
    buyingBehavior: {
      frequency: 'Quarterly',
      valueRange: '$50K+',
      typicalQuantity: '5 Tons',
      seasonalMonths: ['January', 'June'],
      decisionTime: 'Slow 1-3 months',
      priceSensitivity: 'Very Price Sensitive',
      foundVia: 'Cold Outreach'
    },
    commercial: {
      paymentTerms: ['TT 30 days', 'Open Account'],
      currency: 'EUR',
      incoterms: ['FOB', 'CIF'],
      destination: 'Rotterdam Port',
      shippingMethod: 'Sea',
      specialRequirements: ''
    },
    accountStatus: 'key account',
    accountPriority: 'High',
    assignedManager: 'David Rahman',
    assignedSales: 'Emma Davis',
    internalRating: 4,
    recordStatus: 'Active - Verified',
    dataCompleteness: 85,
    overview: 'One of the largest European distributors with a massive network across 12 countries.',
    targetMarkets: ['EU', 'Eastern Europe'],
    keyProducts: ['Private Label Confectionery', 'Skincare'],
    competitiveAdvantages: ['Huge network', 'Strong logistics'],
    strategicImportance: 'High volume account, key for moving large stocks.',
    strategicNotes: 'Always negotiates hard on price. Volume is their leverage.',
    lastContactDate: '2024-05-18T09:00:00Z',
    lastPurchaseDate: '2024-04-10T11:00:00Z',
    totalRevenue: 450000,
    accountHealth: 'healthy',
    ratings: { responseTime: 5, activity: 5, volume: 5 },
    interestedProducts: ['Milk Choc', 'Serum']
  },
];

export const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Premium Cocoa Butter', category: 'Raw Materials', department: 'chocolate', margin: 15, isFeatured: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'p2', name: 'Hyaluronic Serum', category: 'Skincare', department: 'cosmetics', margin: 25, isFeatured: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
];

export const MOCK_STOCKS = [
  { id: 'st1', productId: 'p1', supplierId: 's1', quantity: 1000, price: 12.50, leadTime: 5, department: 'chocolate' },
];

export const MOCK_OFFERS = [
  { id: 'off1', productId: 'p1', supplierId: 's1', bestPrice: 11.50, leadTime: 5, calculatedAt: { seconds: Date.now() / 1000 - 86400 * 2 } },
];

export const MOCK_RESPONSES = Array.from({ length: 10 }).map((_, i) => ({
  id: `res-${i}`,
  customerId: MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length].id,
  bestOfferId: 'off1',
  responseType: i % 2 === 0 ? 'order' : 'quote',
  createdAt: { seconds: Date.now() / 1000 - i * 86400 }
}));

// --- ACCOUNTING MOCK DATA ---

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

export const MOCK_INVOICES = Array.from({ length: 50 }).map((_, i) => {
  const amount = 500 + Math.random() * 5000;
  const vat = amount * 0.05;
  const total = amount + vat;
  const status = ['paid', 'pending', 'overdue', 'partially paid'][Math.floor(Math.random() * 4)];
  const date = new Date(Date.now() - Math.random() * 180 * 86400000);
  const dueDate = new Date(date.getTime() + 30 * 86400000);
  const department = MOCK_DEPARTMENTS[i % 3].id;
  
  return {
    id: `INV-2024-${String(i + 1).padStart(4, '0')}`,
    number: `INV-2024-${String(i + 1).padStart(4, '0')}`,
    customerName: MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length].name,
    date: { seconds: date.getTime() / 1000 },
    dueDate: { seconds: dueDate.getTime() / 1000 },
    amount,
    vat,
    total,
    status,
    department,
    createdBy: DEMO_USERS[i % DEMO_USERS.length].name,
    lineItems: [
      { name: 'Product ' + (i + 1), description: 'High quality raw material', quantity: 10, unitPrice: amount / 10, total: amount }
    ]
  };
});

export const MOCK_PURCHASE_ORDERS = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date(Date.now() - Math.random() * 180 * 86400000);
  const status = ['Confirmed', 'Sent to Supplier', 'Partially Received', 'Fully Received', 'Closed'][Math.floor(Math.random() * 5)];
  const amount = 1000 + Math.random() * 10000;
  
  return {
    id: `PO-2024-${String(i + 1).padStart(4, '0')}`,
    number: `PO-2024-${String(i + 1).padStart(4, '0')}`,
    supplierName: MOCK_SUPPLIERS[0].name,
    date: { seconds: date.getTime() / 1000 },
    status,
    total: amount,
    department: MOCK_DEPARTMENTS[i % 3].id,
    approvedBy: 'Alex Johnson'
  };
});

export const MOCK_PAYMENTS = Array.from({ length: 65 }).map((_, i) => {
  const isReceived = i < 40;
  const date = new Date(Date.now() - Math.random() * 180 * 86400000);
  const amount = 200 + Math.random() * 2000;
  
  return {
    id: `PAY-${i}`,
    date: { seconds: date.getTime() / 1000 },
    type: isReceived ? 'received' : 'made',
    partyName: isReceived ? MOCK_CUSTOMERS[0].name : MOCK_SUPPLIERS[0].name,
    amount,
    method: ['TT Bank Transfer', 'Cash', 'LC'][Math.floor(Math.random() * 3)],
    reference: `REF-${Math.floor(Math.random() * 100000)}`,
    currency: 'USD',
    department: MOCK_DEPARTMENTS[i % 3].id
  };
});

export const MOCK_JOURNALS = Array.from({ length: 60 }).map((_, i) => ({
  id: `JE-${i}`,
  date: { seconds: (Date.now() - Math.random() * 180 * 86400000) / 1000 },
  reference: `JE-REF-${i}`,
  description: i % 2 === 0 ? 'Monthly Salary Payment' : 'Office Rent Allocation',
  entries: [
    { accountCode: '1000', accountName: 'Cash', debit: 0, credit: 1000 },
    { accountCode: '4300', accountName: 'Salaries', debit: 1000, credit: 0 },
  ],
  type: i < 40 ? 'System' : 'Manual',
  status: 'Approved'
}));

export const MOCK_EXPENSES = Array.from({ length: 30 }).map((_, i) => ({
  id: `EXP-${i}`,
  date: { seconds: (Date.now() - Math.random() * 180 * 86400000) / 1000 },
  category: ['Shipping', 'Marketing', 'Travel', 'Office Supplies', 'Subscriptions'][Math.floor(Math.random() * 5)],
  amount: 50 + Math.random() * 1500,
  department: MOCK_DEPARTMENTS[i % 3].id,
  description: 'Expense for ' + MOCK_DEPARTMENTS[i % 3].name,
  status: 'Approved',
  submittedBy: 'James Carter'
}));

export const MOCK_UPLOAD_LOGS = [
  { id: 'ul1', fileName: 'suppliers_june.csv', uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(), totalRows: 50, successCount: 48, failCount: 2, uploadedBy: 'Sarah Mitchell', department: 'chocolate', type: 'suppliers' },
];

export const MOCK_LOGS = [
  { id: 'l1', pipelineName: 'Price Recalculation', event: 'Daily Check', status: 'success', timestamp: { seconds: Date.now() / 1000 }, details: 'Processed 500 products' }
];

export const MOCK_TASKS = [
  { id: 't1', title: 'Update Cocoa Butter Pricing', status: 'In Progress', priority: 'high', assignee: 'James Carter', dueDate: '2024-06-01' }
];

export const MOCK_LEADS = [
  { id: 'ld1', name: 'Organic Bites', company: 'Organic Bites Ltd', value: 5000, stage: 'Negotiating' }
];

export const MOCK_CAMPAIGNS = [
  { id: 'cp1', name: 'Summer Chocolate Special', department: 'chocolate', type: 'price offer', status: 'active', startDate: '2024-05-01', endDate: '2024-06-01', createdBy: 'Sarah Mitchell', goal: 50, stats: { sent: 150, opened: 80, replied: 35, revenue: 15000 } },
  { id: 'cp2', name: 'New Skincare Launch', department: 'cosmetics', type: 'new product', status: 'active', startDate: '2024-05-10', endDate: '2024-06-10', createdBy: 'David Rahman', goal: 30, stats: { sent: 120, opened: 60, replied: 18, revenue: 8000 } },
  { id: 'cp3', name: 'Q1 Bulk Detergent', department: 'detergents', type: 'seasonal', status: 'completed', startDate: '2024-01-01', endDate: '2024-03-31', createdBy: 'Maria Garcia', goal: 100, stats: { sent: 300, opened: 150, replied: 45, revenue: 45000 } },
  { id: 'cp4', name: 'Belgium Re-engagement', department: 'chocolate', type: 'follow-up', status: 'completed', startDate: '2024-02-15', endDate: '2024-03-15', createdBy: 'James Carter', goal: 20, stats: { sent: 80, opened: 40, replied: 12, revenue: 5000 } },
  { id: 'cp5', name: 'Autumn Logistics Prep', department: 'detergents', type: 'seasonal', status: 'draft', startDate: '2024-09-01', endDate: '2024-10-01', createdBy: 'Anna White', goal: 40, stats: { sent: 0, opened: 0, replied: 0, revenue: 0 } },
];

export const MOCK_EMAILS = Array.from({ length: 200 }).map((_, i) => {
  const emp = DEMO_USERS[i % DEMO_USERS.length];
  const cust = MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length];
  const camp = MOCK_CAMPAIGNS[i % MOCK_CAMPAIGNS.length];
  const date = new Date(Date.now() - Math.random() * 30 * 86400000);
  const isReplied = Math.random() > 0.75;
  const status = isReplied ? 'replied' : (Math.random() > 0.5 ? 'opened' : 'sent');
  
  return {
    id: `em-${i}`,
    date: { seconds: date.getTime() / 1000 },
    sentBy: emp.name,
    empId: emp.id,
    dept: emp.department === 'all' ? 'chocolate' : emp.department,
    sentTo: cust?.name || 'Unknown',
    custId: cust?.id || 'Unknown',
    subject: camp.name + ' - Exclusive Offer',
    campaignId: camp.id,
    type: i % 3 === 0 ? 'offer' : 'follow-up',
    status,
    replyReceived: isReplied,
    replyDate: isReplied ? { seconds: (date.getTime() + 3600000 * Math.random() * 24) / 1000 } : null,
    responseTimeHours: isReplied ? Math.floor(Math.random() * 48) : null,
    actionTaken: isReplied ? (Math.random() > 0.5 ? 'order created' : 'quote sent') : 'none',
    body: `Dear ${cust?.name},\n\nWe are pleased to offer you our latest seasonal pricing for premium raw materials. Based on your interest in ${cust?.interests?.products?.join(', ') || 'our products'}, we have prepared a special quote.\n\nBest regards,\n${emp.name}`,
    attachments: i % 5 === 0 ? ['Quote_Details.pdf'] : []
  };
});

export const MOCK_OFFERS_TRACKING = Array.from({ length: 40 }).map((_, i) => {
  const emp = DEMO_USERS[i % DEMO_USERS.length];
  const cust = MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length];
  const product = MOCK_PRODUCTS[i % MOCK_PRODUCTS.length];
  const status = ['sent', 'viewed', 'interested', 'purchased', 'declined', 'expired'][Math.floor(Math.random() * 6)];
  
  return {
    id: `off-t-${i}`,
    dateSent: { seconds: (Date.now() - Math.random() * 30 * 86400000) / 1000 },
    sentBy: emp.name,
    sentTo: cust?.name || 'Unknown',
    department: product.department,
    productName: product.name,
    price: 10 + Math.random() * 50,
    quantity: Math.floor(Math.random() * 500),
    totalValue: 500 + Math.random() * 10000,
    status,
    followUpDate: '2024-06-15'
  };
});

export const MOCK_PURCHASES = Array.from({ length: 25 }).map((_, i) => {
  const cust = MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length];
  const product = MOCK_PRODUCTS[i % MOCK_PRODUCTS.length];
  const emp = DEMO_USERS[i % DEMO_USERS.length];
  const price = 15 + Math.random() * 20;
  const cost = price * 0.8;
  const qty = 100 + Math.floor(Math.random() * 1000);
  
  return {
    id: `pur-${i}`,
    date: { seconds: (Date.now() - Math.random() * 60 * 86400000) / 1000 },
    buyerName: cust?.name || 'Unknown',
    department: product.department,
    productName: product.name,
    quantity: qty,
    unitPrice: price,
    totalCost: cost * qty,
    totalRevenue: price * qty,
    marginPercent: 20,
    netProfit: (price - cost) * qty,
    employeeName: emp.name,
    paymentStatus: Math.random() > 0.2 ? 'paid' : 'pending',
    deliveryStatus: 'delivered'
  };
});
