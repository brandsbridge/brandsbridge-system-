
export const MOCK_DEPARTMENTS = [
  { id: 'chocolate', name: 'Chocolate Market', icon: '🍫', manager: 'Manager 1' },
  { id: 'cosmetics', name: 'Cosmetics Market', icon: '💄', manager: 'Manager 2' },
  { id: 'detergents', name: 'Detergents Market', icon: '🧴', manager: 'Manager 3' }
];

export const MOCK_SUPPLIERS = [
  // Shared Supplier
  { 
    id: 's-shared-1', 
    name: 'Global Chemical Logistics', 
    email: 'logistics@globalchem.com', 
    phone: '+44 20 7946 0001', 
    country: 'UK', 
    departments: ['cosmetics', 'detergents'], 
    productsOffered: ['Packaging Materials', 'Bulk Liquids'], 
    leadTime: 10, 
    contractStatus: 'active', 
    ratings: { frequency: 5, speed: 4, price: 4 },
    interactionNotes: {
      cosmetics: "High quality bottles for perfumes.",
      detergents: "Standard HDPE containers."
    }
  },
  // Chocolate
  { id: 'cs1', name: 'Cocoa Bean Co.', email: 'sales@cocoabean.com', phone: '+1 555-1001', country: 'Belgium', departments: ['chocolate'], productsOffered: ['Cocoa Butter', 'Dark Choc'], leadTime: 5, contractStatus: 'active', ratings: { frequency: 5, speed: 4, price: 4 } },
  { id: 'cs2', name: 'Swiss Delights', email: 'swiss@delights.ch', phone: '+41 44 123 4567', country: 'Switzerland', departments: ['chocolate'], productsOffered: ['Milk Choc', 'Hazelnuts'], leadTime: 3, contractStatus: 'active', ratings: { frequency: 3, speed: 5, price: 3 } },
  
  // Cosmetics
  { id: 'ms1', name: 'Glow Labs', email: 'hello@glowlabs.fr', phone: '+33 1 23 45 67 89', country: 'France', departments: ['cosmetics'], productsOffered: ['Serum', 'Moisturizer'], leadTime: 7, contractStatus: 'active', ratings: { frequency: 5, speed: 5, price: 3 } },
  { id: 'ms2', name: 'Petal Beauty', email: 'sales@petal.it', phone: '+39 02 1234567', country: 'Italy', departments: ['cosmetics'], productsOffered: ['Lipstick', 'Foundation'], leadTime: 10, contractStatus: 'active', ratings: { frequency: 4, speed: 4, price: 4 } },

  // Detergents
  { id: 'ds1', name: 'ChemPure Solutions', email: 'ops@chempure.de', phone: '+49 30 123456', country: 'Germany', departments: ['detergents'], productsOffered: ['Surfactants'], leadTime: 4, contractStatus: 'active', ratings: { frequency: 5, speed: 5, price: 4 } },
];

export const MOCK_CUSTOMERS = [
  // Shared Buyer
  { 
    id: 'c-shared-1', 
    name: 'EuroRetail Group', 
    email: 'purchasing@euroretail.eu', 
    country: 'Netherlands', 
    departments: ['chocolate', 'cosmetics'], 
    interestedProducts: ['Milk Choc', 'Serum'], 
    accountStatus: 'key account', 
    ratings: { responseTime: 5, activity: 5, volume: 5 },
    interactionNotes: {
      chocolate: "Monthly standing order for private label dark chocolate.",
      cosmetics: "Interested in new organic serum line."
    }
  },
  // Chocolate
  { id: 'cc1', name: 'Sweet Tooth Retail', email: 'buyer@sweettooth.com', country: 'UK', departments: ['chocolate'], interestedProducts: ['Milk Choc'], accountStatus: 'active', ratings: { responseTime: 5, activity: 5, volume: 4 } },
  { id: 'cc2', name: 'Chef Bakes', email: 'orders@chefbakes.fr', country: 'France', departments: ['chocolate'], interestedProducts: ['Cocoa Butter'], accountStatus: 'key account', ratings: { responseTime: 4, activity: 5, volume: 5 } },
  
  // Cosmetics
  { id: 'mc1', name: 'Elegance Spas', email: 'info@elegance.com', country: 'Italy', departments: ['cosmetics'], interestedProducts: ['Moisturizer'], accountStatus: 'active', ratings: { responseTime: 4, activity: 4, volume: 3 } }
];

export const MOCK_UPLOAD_LOGS = [
  { id: 'ul1', fileName: 'suppliers_june.csv', uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(), totalRows: 50, successCount: 48, failCount: 2, uploadedBy: 'Manager 1', department: 'chocolate', type: 'suppliers' },
  { id: 'ul2', fileName: 'leads_cosmetics.xlsx', uploadDate: new Date(Date.now() - 86400000 * 5).toISOString(), totalRows: 25, successCount: 25, failCount: 0, uploadedBy: 'Manager 2', department: 'cosmetics', type: 'buyers' },
];

export const MOCK_PRODUCTS = [
  { id: 'cp1', name: 'Premium Cocoa Butter', category: 'Raw Materials', department: 'chocolate', isFeatured: true, margin: 15, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'mp1', name: 'Hyaluronic Serum', category: 'Skincare', department: 'cosmetics', isFeatured: true, margin: 25, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'dp1', name: 'Industrial Surfactant X', category: 'Chemicals', department: 'detergents', isFeatured: true, margin: 10, createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
];

export const MOCK_STOCKS = [
  { id: 'cst1', productId: 'cp1', supplierId: 'cs1', quantity: 1000, price: 12.50, leadTime: 5, department: 'chocolate' },
  { id: 'mst1', productId: 'mp1', supplierId: 'ms1', quantity: 500, price: 4.20, leadTime: 7, department: 'cosmetics' },
];

export const MOCK_LOGS = [];
export const MOCK_INVOICES = [];
export const MOCK_EMPLOYEES = [];
export const MOCK_TASKS = [];
export const MOCK_LEADS = [];
export const MOCK_OFFERS = [];
export const MOCK_RESPONSES = [];
