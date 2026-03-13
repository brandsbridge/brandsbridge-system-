
export const MOCK_DEPARTMENTS = [
  { id: 'chocolate', name: 'Chocolate Market', icon: '🍫', manager: 'Manager 1' },
  { id: 'cosmetics', name: 'Cosmetics Market', icon: '💄', manager: 'Manager 2' },
  { id: 'detergents', name: 'Detergents Market', icon: '🧴', manager: 'Manager 3' }
];

export const MOCK_SUPPLIERS = [
  // Chocolate
  { id: 'cs1', name: 'Cocoa Bean Co.', email: 'sales@cocoabean.com', phone: '+1 555-1001', country: 'Belgium', department: 'chocolate', productsOffered: ['Cocoa Butter', 'Dark Choc'], leadTime: 5, contractStatus: 'active', ratings: { frequency: 5, speed: 4, price: 4 } },
  { id: 'cs2', name: 'Swiss Delights', email: 'swiss@delights.ch', phone: '+41 44 123 4567', country: 'Switzerland', department: 'chocolate', productsOffered: ['Milk Choc', 'Hazelnuts'], leadTime: 3, contractStatus: 'active', ratings: { frequency: 3, speed: 5, price: 3 } },
  { id: 'cs3', name: 'Ghana Growers', email: 'info@ghanagrowers.gh', phone: '+233 30 123 4567', country: 'Ghana', department: 'chocolate', productsOffered: ['Cocoa Powder'], leadTime: 14, contractStatus: 'pending', ratings: { frequency: 4, speed: 3, price: 5 } },
  { id: 'cs4', name: 'Sugar Rush Inc', email: 'orders@sugarrush.com', phone: '+1 555-2002', country: 'USA', department: 'chocolate', productsOffered: ['Sugar Bulks'], leadTime: 2, contractStatus: 'active', ratings: { frequency: 5, speed: 5, price: 4 } },
  { id: 'cs5', name: 'Vanilla Prime', email: 'sales@vanillaprime.mg', phone: '+261 20 123 4567', country: 'Madagascar', department: 'chocolate', productsOffered: ['Vanilla Extract'], leadTime: 21, contractStatus: 'active', ratings: { frequency: 2, speed: 2, price: 5 } },
  
  // Cosmetics
  { id: 'ms1', name: 'Glow Labs', email: 'hello@glowlabs.fr', phone: '+33 1 23 45 67 89', country: 'France', department: 'cosmetics', productsOffered: ['Serum', 'Moisturizer'], leadTime: 7, contractStatus: 'active', ratings: { frequency: 5, speed: 5, price: 3 } },
  { id: 'ms2', name: 'Petal Beauty', email: 'sales@petal.it', phone: '+39 02 1234567', country: 'Italy', department: 'cosmetics', productsOffered: ['Lipstick', 'Foundation'], leadTime: 10, contractStatus: 'active', ratings: { frequency: 4, speed: 4, price: 4 } },
  { id: 'ms3', name: 'Pure Skin Co', email: 'info@pureskin.jp', phone: '+81 3 1234 5678', country: 'Japan', department: 'cosmetics', productsOffered: ['Face Mask'], leadTime: 12, contractStatus: 'pending', ratings: { frequency: 3, speed: 3, price: 5 } },
  { id: 'ms4', name: 'Nature Bloom', email: 'orders@naturebloom.kr', phone: '+82 2 555 0122', country: 'South Korea', department: 'cosmetics', productsOffered: ['BB Cream'], leadTime: 5, contractStatus: 'active', ratings: { frequency: 5, speed: 5, price: 4 } },
  { id: 'ms5', name: 'Essence Oils', email: 'sales@essence.es', phone: '+34 91 123 4567', country: 'Spain', department: 'cosmetics', productsOffered: ['Essential Oils'], leadTime: 15, contractStatus: 'active', ratings: { frequency: 4, speed: 3, price: 4 } },

  // Detergents
  { id: 'ds1', name: 'ChemPure Solutions', email: 'ops@chempure.de', phone: '+49 30 123456', country: 'Germany', department: 'detergents', productsOffered: ['Surfactants'], leadTime: 4, contractStatus: 'active', ratings: { frequency: 5, speed: 5, price: 4 } },
  { id: 'ds2', name: 'CleanBase Inc', email: 'sales@cleanbase.nl', phone: '+31 20 123 4567', country: 'Netherlands', department: 'detergents', productsOffered: ['Fragrance Compounds'], leadTime: 6, contractStatus: 'active', ratings: { frequency: 4, speed: 4, price: 4 } },
  { id: 'ds3', name: 'SafeWash Supply', email: 'info@safewash.be', phone: '+32 2 123 4567', country: 'Belgium', department: 'detergents', productsOffered: ['Colorants'], leadTime: 8, contractStatus: 'pending', ratings: { frequency: 3, speed: 2, price: 5 } },
  { id: 'ds4', name: 'IndoSurfactant', email: 'sales@indosurfact.in', phone: '+91 22 5550 1234', country: 'India', department: 'detergents', productsOffered: ['Caustic Soda'], leadTime: 15, contractStatus: 'active', ratings: { frequency: 4, speed: 3, price: 5 } },
  { id: 'ds5', name: 'Global Scents', email: 'hello@globalscents.fr', phone: '+33 1 23 45 67 89', country: 'France', department: 'detergents', productsOffered: ['Industrial Scents'], leadTime: 7, contractStatus: 'active', ratings: { frequency: 5, speed: 4, price: 3 } },
];

export const MOCK_CUSTOMERS = [
  // Chocolate
  { id: 'cc1', name: 'Sweet Tooth Retail', email: 'buyer@sweettooth.com', country: 'UK', department: 'chocolate', interestedProducts: ['Milk Choc'], accountStatus: 'active', ratings: { responseTime: 5, activity: 5, volume: 4 } },
  { id: 'cc2', name: 'Chef Bakes', email: 'orders@chefbakes.fr', country: 'France', department: 'chocolate', interestedProducts: ['Cocoa Butter'], accountStatus: 'key account', ratings: { responseTime: 4, activity: 5, volume: 5 } },
  { id: 'cc3', name: 'Organic treats', email: 'info@organic.de', country: 'Germany', department: 'chocolate', interestedProducts: ['Dark Choc'], accountStatus: 'prospect', ratings: { responseTime: 3, activity: 2, volume: 2 } },
  // ... (similarly for others)
];

export const MOCK_PRODUCTS = [
  // Chocolate
  { id: 'cp1', name: 'Premium Cocoa Butter', category: 'Raw Materials', department: 'chocolate', isFeatured: true, margin: 15, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'cp2', name: 'Organic Dark Chocolate 70%', category: 'Finished Goods', department: 'chocolate', isFeatured: false, margin: 20, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'cp3', name: 'Milk Chocolate Couverture', category: 'Raw Materials', department: 'chocolate', isFeatured: false, margin: 12, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  
  // Cosmetics
  { id: 'mp1', name: 'Hyaluronic Serum', category: 'Skincare', department: 'cosmetics', isFeatured: true, margin: 25, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'mp2', name: 'Matte Lipstick Red', category: 'Makeup', department: 'cosmetics', isFeatured: false, margin: 30, createdAt: new Date(Date.now() - 86400000 * 6).toISOString() },

  // Detergents
  { id: 'dp1', name: 'Industrial Surfactant X', category: 'Chemicals', department: 'detergents', isFeatured: true, margin: 10, createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'dp2', name: 'Fresh Pine Fragrance', category: 'Additives', department: 'detergents', isFeatured: false, margin: 18, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

export const MOCK_STOCKS = [
  // Chocolate - Premium Cocoa Butter (cp1)
  { id: 'cst1', productId: 'cp1', supplierId: 'cs1', quantity: 1000, price: 12.50, leadTime: 5, department: 'chocolate' },
  { id: 'cst2', productId: 'cp1', supplierId: 'cs3', quantity: 2000, price: 11.80, leadTime: 14, department: 'chocolate' },
  { id: 'cst3', productId: 'cp1', supplierId: 'cs5', quantity: 500, price: 13.20, leadTime: 21, department: 'chocolate' },
  
  // Cosmetics - Hyaluronic Serum (mp1)
  { id: 'mst1', productId: 'mp1', supplierId: 'ms1', quantity: 500, price: 4.20, leadTime: 7, department: 'cosmetics' },
  { id: 'mst2', productId: 'mp1', supplierId: 'ms4', quantity: 800, price: 3.90, leadTime: 5, department: 'cosmetics' },
];

// Re-export old mocks if needed for other pages
export const MOCK_LOGS = [];
export const MOCK_INVOICES = [];
export const MOCK_EMPLOYEES = [];
export const MOCK_TASKS = [];
export const MOCK_LEADS = [];
export const MOCK_OFFERS = [];
export const MOCK_RESPONSES = [];
