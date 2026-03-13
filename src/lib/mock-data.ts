
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
  { id: 'c11', name: 'Kevin Hart', email: 'kevin.h@comedy.com', phone: '555-2222', interestedProducts: ['Keyboard'] },
  { id: 'c12', name: 'Lana Del Rey', email: 'lana.d@summertime.com', phone: '555-2323', interestedProducts: ['Monitor'] },
  { id: 'c13', name: 'Michael Scott', email: 'm.scott@dundermifflin.com', phone: '555-2424', interestedProducts: ['Laptop', 'Keyboard', 'Mouse'] },
  { id: 'c14', name: 'Nina Simone', email: 'nina.s@jazz.com', phone: '555-2525', interestedProducts: ['Webcam'] },
  { id: 'c15', name: 'Oscar Isaac', email: 'oscar.i@dune.com', phone: '555-2626', interestedProducts: ['Laptop', 'Monitor'] },
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
  { id: 'st6', productId: 'p3', supplierId: 's2', quantity: 100, price: 59.99, leadTime: 2 },
  { id: 'st7', productId: 'p3', supplierId: 's4', quantity: 45, price: 65.50, leadTime: 4 },
  { id: 'st8', productId: 'p4', supplierId: 's2', quantity: 150, price: 29.99, leadTime: 2 },
  { id: 'st9', productId: 'p4', supplierId: 's7', quantity: 60, price: 32.00, leadTime: 3 },
  { id: 'st10', productId: 'p5', supplierId: 's9', quantity: 5, price: 45.00, leadTime: 5 },
  { id: 'st11', productId: 'p1', supplierId: 's1', quantity: 10, price: 950.00, leadTime: 10 },
  { id: 'st12', productId: 'p2', supplierId: 's3', quantity: 20, price: 280.00, leadTime: 12 },
  { id: 'st13', productId: 'p3', supplierId: 's10', quantity: 30, price: 55.00, leadTime: 15 },
  { id: 'st14', productId: 'p4', supplierId: 's5', quantity: 80, price: 25.00, leadTime: 8 },
  { id: 'st15', productId: 'p5', supplierId: 's2', quantity: 22, price: 49.99, leadTime: 3 },
  { id: 'st16', productId: 'p2', supplierId: 's7', quantity: 11, price: 310.00, leadTime: 5 },
  { id: 'st17', productId: 'p1', supplierId: 's4', quantity: 3, price: 1100.00, leadTime: 4 },
  { id: 'st18', productId: 'p3', supplierId: 's8', quantity: 50, price: 62.00, leadTime: 6 },
  { id: 'st19', productId: 'p4', supplierId: 's9', quantity: 200, price: 22.50, leadTime: 12 },
  { id: 'st20', productId: 'p5', supplierId: 's10', quantity: 15, price: 40.00, leadTime: 10 },
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
  { id: 'r5', customerId: 'c8', bestOfferId: 'o2', responseType: 'quote', createdAt: { seconds: Date.now()/1000 - 45000 } },
  { id: 'r6', customerId: 'c15', bestOfferId: 'o1', responseType: 'interest', createdAt: { seconds: Date.now()/1000 - 55000 } },
  { id: 'r7', customerId: 'c4', bestOfferId: 'o2', responseType: 'order', createdAt: { seconds: Date.now()/1000 - 65000 } },
  { id: 'r8', customerId: 'c10', bestOfferId: 'o5', responseType: 'interest', createdAt: { seconds: Date.now()/1000 - 75000 } },
  { id: 'r9', customerId: 'c1', bestOfferId: 'o2', responseType: 'quote', createdAt: { seconds: Date.now()/1000 - 85000 } },
  { id: 'r10', customerId: 'c3', bestOfferId: 'o5', responseType: 'order', createdAt: { seconds: Date.now()/1000 - 95000 } },
];

export const MOCK_LOGS = [
  { id: 'l1', pipelineName: 'Offer Aggregator', event: 'Scheduled Run', status: 'success', details: 'Aggregated 5 product offers across 10 suppliers.', timestamp: { seconds: Date.now()/1000 - 3600 } },
  { id: 'l2', pipelineName: 'Stock Sync', event: 'API Webhook', status: 'success', details: 'Updated stock for High-End Laptop (s9).', timestamp: { seconds: Date.now()/1000 - 7200 } },
  { id: 'l3', pipelineName: 'Customer Outreach', event: 'Campaign Launch', status: 'failed', details: 'Email service provider connection timeout.', timestamp: { seconds: Date.now()/1000 - 10800 } },
  { id: 'l4', pipelineName: 'Stock Sync', event: 'Manual Sync', status: 'success', details: 'Refreshed all inventory levels.', timestamp: { seconds: Date.now()/1000 - 14400 } },
  { id: 'l5', pipelineName: 'Offer Aggregator', event: 'Price Drop Detection', status: 'success', details: 'Detected $50 drop for Laptop.', timestamp: { seconds: Date.now()/1000 - 18000 } },
  { id: 'l6', pipelineName: 'Stock Sync', event: 'API Webhook', status: 'success', details: 'Updated stock for 4K Monitor (s3).', timestamp: { seconds: Date.now()/1000 - 21600 } },
  { id: 'l7', pipelineName: 'Offer Aggregator', event: 'Scheduled Run', status: 'success', details: 'Completed nightly aggregation.', timestamp: { seconds: Date.now()/1000 - 25200 } },
  { id: 'l8', pipelineName: 'System Health', event: 'Self-Check', status: 'success', details: 'All services operational.', timestamp: { seconds: Date.now()/1000 - 28800 } },
];
