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
  
  // Chocolate
  { id: 'u-choc-mgr', name: 'Sarah Mitchell', email: 'sarah.m@brandsbridge.com', role: 'manager', department: 'chocolate', status: 'active', joinDate: '2022-03-10', lastLogin: '2024-05-21T09:15:00Z' },
  { id: 'u-choc-sales1', name: 'James Carter', email: 'james.c@brandsbridge.com', role: 'manager', department: 'chocolate', status: 'active', joinDate: '2023-01-05', lastLogin: '2024-05-20T14:45:00Z' },
  { id: 'u-choc-sales2', name: 'Lisa Wong', email: 'lisa.w@brandsbridge.com', role: 'sales', department: 'chocolate', status: 'active', joinDate: '2023-06-12', lastLogin: '2024-05-19T11:20:00Z' },
  { id: 'u-choc-view', name: 'Tom Baker', email: 'tom.b@brandsbridge.com', role: 'viewer', department: 'chocolate', status: 'active', joinDate: '2024-02-01', lastLogin: '2024-05-18T16:00:00Z' },

  // Cosmetics
  { id: 'u-cosm-mgr', name: 'David Rahman', email: 'david.r@brandsbridge.com', role: 'manager', department: 'cosmetics', status: 'active', joinDate: '2022-05-20', lastLogin: '2024-05-21T08:00:00Z' },
  { id: 'u-cosm-sales1', name: 'Emma Davis', email: 'emma.d@brandsbridge.com', role: 'manager', department: 'cosmetics', status: 'active', joinDate: '2023-02-15', lastLogin: '2024-05-20T13:30:00Z' },
  { id: 'u-cosm-sales2', name: 'Noah Smith', email: 'noah.s@brandsbridge.com', role: 'sales', department: 'cosmetics', status: 'active', joinDate: '2023-08-20', lastLogin: '2024-05-19T10:10:00Z' },
  { id: 'u-cosm-view', name: 'Olivia Brown', email: 'olivia.b@brandsbridge.com', role: 'viewer', department: 'cosmetics', status: 'active', joinDate: '2024-01-10', lastLogin: '2024-05-18T15:20:00Z' },

  // Detergents
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
  // Keep legacy for backwards compatibility
  leadTime?: number;
  contractStatus?: string;
  ratings: { frequency: number; speed: number; price: number };
  productsOffered: string[];
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
    overview: 'Established in 1995, Cocoa Bean Co. is a leading manufacturer of premium cocoa products in the region. We operate state-of-the-art facilities in Istanbul and export to over 40 countries globally.',
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
    strategicNotes: 'Exclusive distributor agreement for KSA pending. High leverage due to their unique roasting process. Preferred partner for GCC bulk orders.',
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
  },
  {
    id: 's2',
    name: 'Swiss Delights',
    email: 'swiss@delights.ch',
    phone: '+41 44 123 4567',
    country: 'Switzerland',
    flag: '🇨🇭',
    departments: ['chocolate'],
    natureOfBusiness: 'Manufacturer',
    website: 'https://swissdelights.ch',
    socialLinks: { linkedin: 'linkedin.com/company/swissdelights' },
    specializedProducts: ['Milk Choc', 'Dark Choc', 'Truffles'],
    topSellingProducts: [{ name: 'Swiss Milk Choc', unit: 'KG', avgPrice: '$18.00' }],
    contacts: {
      sales: { name: 'Hans Mueller', email: 'hans@delights.ch', phone: '+41 44 123 4567', whatsapp: '+41 44 123 4567' },
      export: { name: 'Emma Schmidt', email: 'export@delights.ch', phone: '+41 export', whatsapp: '' },
      support: { phone: '+41 support', email: 'care@delights.ch', hours: '08:00 - 17:00 (CET)', language: 'English, German, French' }
    },
    overview: 'Traditional Swiss chocolate manufacturer focusing on luxury truffles and premium bars.',
    yearEstablished: 1920,
    employeeCount: '51-200',
    annualExportVolume: '$20M+',
    marketsServed: ['Europe', 'USA', 'GCC'],
    certifications: {
      organic: { has: false },
      halal: { has: true, expiry: '2024-07-01', body: 'HCS Switzerland' },
      iso: { has: true, expiry: '2025-01-01', number: 'ISO 22000' },
      fda: { has: true }
    },
    pricing: {
      tier: 'Luxury',
      moq: '100 KG',
      mov: 2500,
      paymentTerms: ['TT 30 days', 'Open Account'],
      currency: 'EUR',
      incoterms: ['FOB', 'CIF'],
      leadTime: 3,
      samplePolicy: 'Free samples for key accounts'
    },
    strategicNotes: 'Premium pricing but essential for luxury gift hampers in UAE. No price flexibility.',
    recordStatus: 'Active - Verified',
    priorityLevel: 'Medium',
    internalRating: 4,
    dataCompleteness: 88,
    lastUpdatedBy: 'James Carter',
    lastUpdatedDate: '2024-05-15T14:45:00Z',
    ratings: { frequency: 3, speed: 5, price: 3 },
    productsOffered: ['Milk Choc'],
    leadTime: 3,
    contractStatus: 'active'
  },
  {
    id: 's3',
    name: 'Glow Labs',
    email: 'hello@glowlabs.fr',
    phone: '+33 1 23 45 67 89',
    country: 'France',
    flag: '🇫🇷',
    departments: ['cosmetics'],
    natureOfBusiness: 'Manufacturer',
    website: 'https://glowlabs.fr',
    socialLinks: { instagram: 'instagram.com/glowlabs' },
    specializedProducts: ['Serum', 'Moisturizers'],
    topSellingProducts: [{ name: 'Hyaluronic Serum', unit: 'Bottle', avgPrice: '$4.20' }],
    contacts: {
      sales: { name: 'Jean Pierre', email: 'jp@glowlabs.fr', phone: '+33 1 23', whatsapp: '' },
      export: { name: 'Marie Curie', email: 'export@glowlabs.fr', phone: '+33 exp', whatsapp: '' },
      support: { phone: '+33 support', email: 'help@glowlabs.fr', hours: '09:00 - 18:00 (CET)', language: 'English, French' }
    },
    overview: 'Eco-friendly cosmetics research lab and manufacturer in southern France.',
    yearEstablished: 2010,
    employeeCount: '1-50',
    annualExportVolume: '$1-5M',
    marketsServed: ['Europe', 'USA'],
    certifications: {
      organic: { has: true, expiry: '2024-06-30' },
      halal: { has: false },
      iso: { has: false },
      fda: { has: false }
    },
    pricing: {
      tier: 'Premium',
      moq: '1000 Units',
      mov: 4000,
      paymentTerms: ['TT in advance'],
      currency: 'EUR',
      incoterms: ['EXW'],
      leadTime: 7,
      samplePolicy: 'Paid samples'
    },
    strategicNotes: 'Checking Data: Need to verify if they can produce Halal certified serums for KSA market. Current lack of Halal is a barrier.',
    recordStatus: 'Checking Data',
    priorityLevel: 'Low',
    internalRating: 3,
    dataCompleteness: 45,
    lastUpdatedBy: 'David Rahman',
    lastUpdatedDate: '2024-05-18T09:00:00Z',
    ratings: { frequency: 5, speed: 5, price: 3 },
    productsOffered: ['Serum'],
    leadTime: 7,
    contractStatus: 'active'
  }
];

export const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'Sweet Tooth Retail', email: 'buyer@sweettooth.com', country: 'UK', departments: ['chocolate'], interestedProducts: ['Milk Choc'], accountStatus: 'active', ratings: { responseTime: 5, activity: 5, volume: 4 } },
  { id: 'c-shared', name: 'EuroRetail Group', email: 'purchasing@euroretail.eu', country: 'Netherlands', departments: ['chocolate', 'cosmetics'], interestedProducts: ['Milk Choc', 'Serum'], accountStatus: 'key account', ratings: { responseTime: 5, activity: 5, volume: 5 } },
  { id: 'c2', name: 'Gourmet Bakeries', email: 'gourmet@bakery.co.uk', country: 'UK', departments: ['chocolate'], interestedProducts: ['Cocoa Butter'], accountStatus: 'prospect', ratings: { responseTime: 3, activity: 2, volume: 5 } },
  { id: 'c3', name: 'Beauty Haven', email: 'beauty@haven.it', country: 'Italy', departments: ['cosmetics'], interestedProducts: ['Serum'], accountStatus: 'active', ratings: { responseTime: 4, activity: 4, volume: 3 } },
  { id: 'c4', name: 'Nordic Clean', email: 'nordic@clean.se', country: 'Sweden', departments: ['detergents'], interestedProducts: ['Bio enzymes'], accountStatus: 'active', ratings: { responseTime: 5, activity: 3, volume: 4 } },
  { id: 'c5', name: 'Global Mart USA', email: 'global@mart.us', country: 'USA', departments: ['chocolate', 'detergents'], interestedProducts: ['Vanilla', 'Packaging'], accountStatus: 'key account', ratings: { responseTime: 5, activity: 5, volume: 5 } },
  { id: 'c6', name: 'Dubai Luxury Spa', email: 'dubai@luxury.ae', country: 'UAE', departments: ['cosmetics'], interestedProducts: ['Essential Oils'], accountStatus: 'active', ratings: { responseTime: 4, activity: 2, volume: 5 } },
  { id: 'c7', name: 'London Supply Co', email: 'london@supply.co.uk', country: 'UK', departments: ['detergents'], interestedProducts: ['Surfactants'], accountStatus: 'prospect', ratings: { responseTime: 2, activity: 1, volume: 2 } },
];

export const MOCK_UPLOAD_LOGS = [
  { id: 'ul1', fileName: 'suppliers_june.csv', uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(), totalRows: 50, successCount: 48, failCount: 2, uploadedBy: 'Sarah Mitchell', department: 'chocolate', type: 'suppliers' },
];

export const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Premium Cocoa Butter', category: 'Raw Materials', department: 'chocolate', margin: 15, isFeatured: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'p2', name: 'Hyaluronic Serum', category: 'Skincare', department: 'cosmetics', margin: 25, isFeatured: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'p3', name: 'Bio Enzyme Mix', category: 'Detergent Bases', department: 'detergents', margin: 10, isFeatured: false, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

export const MOCK_STOCKS = [
  { id: 'st1', productId: 'p1', supplierId: 's1', quantity: 1000, price: 12.50, leadTime: 5, department: 'chocolate' },
  { id: 'st2', productId: 'p2', supplierId: 's3', quantity: 500, price: 4.20, leadTime: 7, department: 'cosmetics' },
];

export const MOCK_OFFERS = [
  { id: 'off1', productId: 'p1', supplierId: 's1', bestPrice: 11.50, leadTime: 5, calculatedAt: { seconds: Date.now() / 1000 - 86400 * 2 } },
  { id: 'off2', productId: 'p2', supplierId: 's3', bestPrice: 3.90, leadTime: 7, calculatedAt: { seconds: Date.now() / 1000 - 86400 * 1 } },
  { id: 'off3', productId: 'p3', supplierId: 's8', bestPrice: 8.20, leadTime: 5, calculatedAt: { seconds: Date.now() / 1000 - 86400 * 5 } },
];

export const MOCK_RESPONSES = Array.from({ length: 30 }).map((_, i) => {
  const cust = MOCK_CUSTOMERS[i % MOCK_CUSTOMERS.length];
  const offer = MOCK_OFFERS[i % MOCK_OFFERS.length];
  const types = ['order', 'quote', 'interest'];
  return {
    id: `res-${i}`,
    customerId: cust.id,
    bestOfferId: offer.id,
    responseType: types[i % 3],
    createdAt: { seconds: (Date.now() - Math.random() * 7 * 86400000) / 1000 }
  };
});

export const MOCK_LOGS = [
  { id: 'l1', pipelineName: 'Price Recalculation', event: 'Daily Check', status: 'success', timestamp: { seconds: Date.now() / 1000 }, details: 'Processed 500 products' }
];

export const MOCK_INVOICES = [
  { id: 'inv1', number: 'INV-001', customerName: 'Sweet Tooth Retail', amount: 1250.50, status: 'paid', dueDate: { seconds: Date.now() / 1000 + 86400 * 30 } }
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
    sentTo: cust.name,
    custId: cust.id,
    subject: camp.name + ' - Exclusive Offer',
    campaignId: camp.id,
    type: i % 3 === 0 ? 'offer' : 'follow-up',
    status,
    replyReceived: isReplied,
    replyDate: isReplied ? { seconds: (date.getTime() + 3600000 * Math.random() * 24) / 1000 } : null,
    responseTimeHours: isReplied ? Math.floor(Math.random() * 48) : null,
    actionTaken: isReplied ? (Math.random() > 0.5 ? 'order created' : 'quote sent') : 'none'
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
    sentTo: cust.name,
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
    buyerName: cust.name,
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
