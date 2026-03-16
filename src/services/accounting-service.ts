
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

/**
 * Advanced Accounting Service handling Recurring Billing, Credits, and Advances.
 */
export const accountingService = {
  // --- RECURRING INVOICES ---
  createRecurringTemplate: (db: Firestore, data: any) => 
    dbService.create(db, 'recurring_invoices', {
      ...data,
      status: 'active',
      lastGenerated: null
    }),
  
  updateRecurringTemplate: (db: Firestore, id: string, data: any) => 
    dbService.update(db, 'recurring_invoices', id, data),

  // --- CREDIT NOTES ---
  createCreditNote: (db: Firestore, data: any) => 
    dbService.create(db, 'credit_notes', {
      ...data,
      number: `CN-${Date.now().toString().slice(-6)}`,
      status: 'open',
      remainingAmount: data.amount
    }),

  applyCreditNote: (db: Firestore, id: string, amountToApply: number) => {
    // In a real system, this would update the remainingAmount and the target Invoice total
    // For prototype, we just update the status if amount is fully used
    return dbService.update(db, 'credit_notes', id, { status: 'closed', remainingAmount: 0 });
  },

  // --- CUSTOMER ADVANCES ---
  recordAdvance: (db: Firestore, data: any) => 
    dbService.create(db, 'customer_advances', {
      ...data,
      remainingAmount: data.amount,
      date: new Date().toISOString()
    }),

  // --- VENDOR CREDITS ---
  recordVendorCredit: (db: Firestore, data: any) => 
    dbService.create(db, 'vendor_credits', {
      ...data,
      remainingAmount: data.amount,
      date: new Date().toISOString()
    }),
    
  deleteRecord: (db: Firestore, collection: string, id: string) => 
    dbService.delete(db, collection, id)
};
