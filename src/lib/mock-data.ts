
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

export const MOCK_SUPPLIERS = [
  { id: 's1', name: 'Cocoa Bean Co.', email: 'sales@cocoabean.com', phone: '+1 555-1001', country: 'Belgium', departments: ['chocolate'], productsOffered: ['Cocoa Butter'], leadTime: 5, contractStatus: 'active', ratings: { frequency: 5, speed: 4, price: 4 } },
  { id: 's2', name: 'Swiss Delights', email: 'swiss@delights.ch', phone: '+41 44 123 4567', country: 'Switzerland', departments: ['chocolate'], productsOffered: ['Milk Choc'], leadTime: 3, contractStatus: 'active', ratings: { frequency: 3, speed: 5, price: 3 } },
  { id: 's3', name: 'Glow Labs', email: 'hello@glowlabs.fr', phone: '+33 1 23 45 67 89', country: 'France', departments: ['cosmetics'], productsOffered: ['Serum'], leadTime: 7, contractStatus: 'active', ratings: { frequency: 5, speed: 5, price: 3 } },
  { id: 's-shared', name: 'Global Chem', email: 'info@globalchem.com', country: 'Germany', departments: ['cosmetics', 'detergents'], productsOffered: ['Packaging'], leadTime: 10, contractStatus: 'active', ratings: { frequency: 4, speed: 4, price: 4 } }
];

export const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'Sweet Tooth Retail', email: 'buyer@sweettooth.com', country: 'UK', departments: ['chocolate'], interestedProducts: ['Milk Choc'], accountStatus: 'active', ratings: { responseTime: 5, activity: 5, volume: 4 } },
  { id: 'c-shared', name: 'EuroRetail Group', email: 'purchasing@euroretail.eu', country: 'Netherlands', departments: ['chocolate', 'cosmetics'], interestedProducts: ['Milk Choc', 'Serum'], accountStatus: 'key account', ratings: { responseTime: 5, activity: 5, volume: 5 } }
];

export const MOCK_UPLOAD_LOGS = [
  { id: 'ul1', fileName: 'suppliers_june.csv', uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(), totalRows: 50, successCount: 48, failCount: 2, uploadedBy: 'Sarah Mitchell', department: 'chocolate', type: 'suppliers' },
];

export const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Premium Cocoa Butter', category: 'Raw Materials', department: 'chocolate', margin: 15, isFeatured: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'p2', name: 'Hyaluronic Serum', category: 'Skincare', department: 'cosmetics', margin: 25, isFeatured: true, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
];

export const MOCK_STOCKS = [
  { id: 'st1', productId: 'p1', supplierId: 's1', quantity: 1000, price: 12.50, leadTime: 5, department: 'chocolate' },
  { id: 'st2', productId: 'p2', supplierId: 's3', quantity: 500, price: 4.20, leadTime: 7, department: 'cosmetics' },
];

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

export const MOCK_OFFERS = [
  { id: 'off1', productId: 'p1', supplierId: 's1', bestPrice: 12.50, leadTime: 5, calculatedAt: { seconds: Date.now() / 1000 - 3600 } }
];

export const MOCK_RESPONSES = [
  { id: 'res1', customerId: 'c1', bestOfferId: 'off1', responseType: 'order', createdAt: { seconds: Date.now() / 1000 - 7200 } }
];
