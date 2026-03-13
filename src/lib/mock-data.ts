
export const MOCK_SUPPLIERS = [
  { id: 's1', name: 'Global Steel Co.', email: 'contact@globalsteel.com', phone: '+1 555-0101', country: 'USA', productsOffered: ['Steel Sheets', 'Iron Rods'] },
  { id: 's2', name: 'TechParts Inc.', email: 'sales@techparts.io', phone: '+44 20 7946 0123', country: 'UK', productsOffered: ['Processors', 'Memory Modules'] },
  { id: 's3', name: 'Eco Materials Ltd.', email: 'info@ecomat.de', phone: '+49 30 123456', country: 'Germany', productsOffered: ['Recycled Plastic', 'Bamboo Fiber'] },
  { id: 's4', name: 'Precision Tools', email: 'support@prectools.jp', phone: '+81 3-1234-5678', country: 'Japan', productsOffered: ['CNC Bits', 'Lathe Tools'] },
  { id: 's5', name: 'FastLogistics', email: 'ops@fastlog.com', phone: '+33 1 23 45 67 89', country: 'France', productsOffered: ['Packaging', 'Shipping Containers'] },
  { id: 's6', name: 'BuildRight Supplies', email: 'orders@buildright.ca', phone: '+1 416-555-0199', country: 'Canada', productsOffered: ['Concrete', 'Lumber'] },
  { id: 's7', name: 'SmartComponents', email: 'hello@smartcomp.kr', phone: '+82 2-555-0122', country: 'South Korea', productsOffered: ['Sensors', 'Microcontrollers'] },
  { id: 's8', name: 'Quality Metals', email: 'sales@qualitymet.au', phone: '+61 2 5550 1234', country: 'Australia', productsOffered: ['Aluminum', 'Copper'] },
  { id: 's9', name: 'Future Electronics', email: 'innovate@future-elec.cn', phone: '+86 10 5550 1234', country: 'China', productsOffered: ['OLED Screens', 'Batteries'] },
  { id: 's10', name: 'Prime Supplies', email: 'prime@supplies.in', phone: '+91 22 5550 1234', country: 'India', productsOffered: ['Textiles', 'Dyes'] },
];

export const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice.j@example.com', phone: '555-1212', interestedProducts: ['Laptop', 'Monitor'] },
  { id: 'c2', name: 'Bob Smith', email: 'bob.s@company.com', phone: '555-1313', interestedProducts: ['Keyboard', 'Mouse'] },
  { id: 'c3', name: 'Charlie Davis', email: 'charlie.d@web.com', phone: '555-1414', interestedProducts: ['Webcam'] },
  { id: 'c4', name: 'Diana Prince', email: 'diana.p@themyscira.com', phone: '555-1515', interestedProducts: ['Monitor', 'Keyboard'] },
  { id: 'c5', name: 'Edward Norton', email: 'ed.n@fight.club', phone: '555-1616', interestedProducts: ['Laptop'] },
  { id: 'c6', name: 'Fiona Gallagher', email: 'fiona.g@southside.com', phone: '555-1717', interestedProducts: ['Mouse', 'Webcam'] },
  { id: 'c7', name: 'George Costanza', email: 'george.c@vandelay.com', phone: '555-1818', interestedProducts: ['Latex'] },
  { id: 'c8', name: 'Hannah Abbott', email: 'hannah.a@hogwarts.edu', phone: '555-1919', interestedProducts: ['Laptop', 'Monitor'] },
  { id: 'c9', name: 'Ian Wright', email: 'ian.w@arsenal.co.uk', phone: '555-2020', interestedProducts: ['Monitor'] },
  { id: 'c10', name: 'Julia Roberts', email: 'julia.r@pretty.com', phone: '555-2121', interestedProducts: ['Laptop', 'Webcam'] },
];

export const MOCK_PRODUCTS = [
  { id: 'p1', name: 'High-End Laptop', category: 'Computing' },
  { id: 'p2', name: '4K Monitor', category: 'Peripherals' },
  { id: 'p3', name: 'Mechanical Keyboard', category: 'Peripherals' },
  { id: 'p4', name: 'Wireless Mouse', category: 'Peripherals' },
  { id: 'p5', name: 'HD Webcam', category: 'Computing' },
];

export const MOCK_STOCKS = [
  { id: 'st1', productId: 'p1', supplierId: 's2', quantity: 25, price: 899.99, leadTime: 5 },
  { id: 'st2', productId: 'p1', supplierId: 's7', quantity: 12, price: 920.00, leadTime: 3 },
  { id: 'st3', productId: 'p1', supplierId: 's9', quantity: 40, price: 850.00, leadTime: 14 },
  { id: 'st4', productId: 'p2', supplierId: 's9', quantity: 15, price: 299.99, leadTime: 7 },
  { id: 'st5', productId: 'p2', supplierId: 's2', quantity: 8, price: 320.00, leadTime: 10 },
];

export const MOCK_OFFERS = [
  { id: 'o1', productId: 'p1', supplierId: 's9', bestPrice: 850.00, leadTime: 14, calculatedAt: { seconds: Date.now()/1000 - 3600 } },
  { id: 'o2', productId: 'p2', supplierId: 's3', bestPrice: 280.00, leadTime: 12, calculatedAt: { seconds: Date.now()/1000 - 7200 } },
  { id: 'o3', productId: 'p3', supplierId: 's2', bestPrice: 59.99, leadTime: 2, calculatedAt: { seconds: Date.now()/1000 - 10800 } },
  { id: 'o4', productId: 'p4', supplierId: 's9', bestPrice: 22.50, leadTime: 12, calculatedAt: { seconds: Date.now()/1000 - 14400 } },
  { id: 'o5', productId: 'p5', supplierId: 's10', bestPrice: 40.00, leadTime: 10, calculatedAt: { seconds: Date.now()/1000 - 18000 } },
];

export const MOCK_RESPONSES = [
  { id: 'r1', customerId: 'c1', bestOfferId: 'o1', responseType: 'order', createdAt: { seconds: Date.now()/1000 - 5000 } },
  { id: 'r2', customerId: 'c2', bestOfferId: 'o3', responseType: 'quote', createdAt: { seconds: Date.now()/1000 - 15000 } },
  { id: 'r3', customerId: 'c5', bestOfferId: 'o1', responseType: 'interest', createdAt: { seconds: Date.now()/1000 - 25000 } },
  { id: 'r4', customerId: 'c13', bestOfferId: 'o3', responseType: 'order', createdAt: { seconds: Date.now()/1000 - 35000 } },
];

export const MOCK_LOGS = [
  { id: 'l1', pipelineName: 'Offer Aggregator', event: 'Scheduled Run', status: 'success', details: 'Aggregated 5 product offers across 10 suppliers.', timestamp: { seconds: Date.now()/1000 - 3600 } },
  { id: 'l2', pipelineName: 'Stock Sync', event: 'API Webhook', status: 'success', details: 'Updated stock for High-End Laptop (s9).', timestamp: { seconds: Date.now()/1000 - 7200 } },
];

export const MOCK_INVOICES = [
  { id: 'i1', number: 'INV-001', customerName: 'Alice Johnson', amount: 1250.00, status: 'paid', dueDate: { seconds: Date.now()/1000 - 86400 * 5 } },
  { id: 'i2', number: 'INV-002', customerName: 'Bob Smith', amount: 450.50, status: 'pending', dueDate: { seconds: Date.now()/1000 + 86400 * 2 } },
  { id: 'i3', number: 'INV-003', customerName: 'Charlie Davis', amount: 2100.00, status: 'overdue', dueDate: { seconds: Date.now()/1000 - 86400 * 10 } },
  { id: 'i4', number: 'INV-004', customerName: 'Diana Prince', amount: 890.00, status: 'pending', dueDate: { seconds: Date.now()/1000 + 86400 * 5 } },
  { id: 'i5', number: 'INV-005', customerName: 'Edward Norton', amount: 3400.00, status: 'paid', dueDate: { seconds: Date.now()/1000 - 86400 * 2 } },
  { id: 'i6', number: 'INV-006', customerName: 'Fiona Gallagher', amount: 150.00, status: 'pending', dueDate: { seconds: Date.now()/1000 + 86400 * 12 } },
];

export const MOCK_EMPLOYEES = [
  { id: 'e1', name: 'Sarah Wilson', role: 'Software Engineer', department: 'Engineering', salary: 120000, joinDate: '2022-03-15', status: 'active' },
  { id: 'e2', name: 'James Miller', role: 'Product Manager', department: 'Product', salary: 110000, joinDate: '2021-06-01', status: 'active' },
  { id: 'e3', name: 'Emily Chen', role: 'UX Designer', department: 'Design', salary: 95000, joinDate: '2023-01-10', status: 'active' },
  { id: 'e4', name: 'Michael Brown', role: 'Sales Lead', department: 'Sales', salary: 85000, joinDate: '2020-11-20', status: 'active' },
  { id: 'e5', name: 'Jessica Lee', role: 'HR Manager', department: 'HR', salary: 90000, joinDate: '2022-09-05', status: 'active' },
  { id: 'e6', name: 'David Clark', role: 'QA Engineer', department: 'Engineering', salary: 100000, joinDate: '2023-05-15', status: 'inactive' },
];

export const MOCK_TASKS = [
  { id: 't1', title: 'Design System Update', assignee: 'Emily Chen', priority: 'high', dueDate: '2024-03-25', status: 'To Do' },
  { id: 't2', title: 'API Integration', assignee: 'Sarah Wilson', priority: 'medium', dueDate: '2024-03-20', status: 'In Progress' },
  { id: 't3', title: 'Customer Feedback Survey', assignee: 'James Miller', priority: 'low', dueDate: '2024-03-28', status: 'To Do' },
  { id: 't4', title: 'Security Audit', assignee: 'Sarah Wilson', priority: 'high', dueDate: '2024-03-15', status: 'Review' },
  { id: 't5', title: 'Landing Page Redesign', assignee: 'Emily Chen', priority: 'medium', dueDate: '2024-03-10', status: 'Done' },
  { id: 't6', title: 'Database Migration', assignee: 'David Clark', priority: 'high', dueDate: '2024-03-22', status: 'In Progress' },
];

export const MOCK_LEADS = [
  { id: 'l1', name: 'Apex Corp', company: 'Apex', value: 50000, stage: 'Negotiating' },
  { id: 'l2', name: 'Zenith Solutions', company: 'Zenith', value: 12000, stage: 'Lead' },
  { id: 'l3', name: 'Blue Horizon', company: 'Blue Horizon', value: 25000, stage: 'Contacted' },
  { id: 'l4', name: 'Silverstone Partners', company: 'Silverstone', value: 80000, stage: 'Closed Won' },
  { id: 'l5', name: 'Greenleaf Inc', company: 'Greenleaf', value: 5000, stage: 'Closed Lost' },
  { id: 'l6', name: 'Nova Dynamics', company: 'Nova', value: 35000, stage: 'Negotiating' },
  { id: 'l7', name: 'Stellar Systems', company: 'Stellar', value: 15000, stage: 'Contacted' },
];
