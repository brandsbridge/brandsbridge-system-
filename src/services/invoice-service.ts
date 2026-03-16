
'use client';

import { Firestore, collection, doc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { dbService } from './db';

/**
 * Professional Invoice Service
 * Handles sequence generation, auto-mapping from profiles, and ledger storage.
 */
export const invoiceService = {
  // Generate next professional sequence number per type
  generateSequenceNumber: async (db: Firestore, type: 'EXP' | 'INV' | 'PRO' | 'CN') => {
    const q = query(
      collection(db, 'invoices'),
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    let nextSeq = 1;
    
    if (!snap.empty) {
      const lastNum = snap.docs[0].data().number;
      // Extract sequence part (assuming format FSE-TYPE/SEQ/MM/YYYY or similar)
      const parts = lastNum.split('/');
      if (parts.length > 1) {
        const seqPart = parts[1];
        nextSeq = parseInt(seqPart) + 1;
      }
    }
    
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const year = new Date().getFullYear();
    const seqStr = nextSeq.toString().padStart(8, '0');
    
    const prefixMap = {
      'EXP': 'FSE-EXP',
      'INV': 'INV',
      'PRO': 'PRO',
      'CN': 'CN'
    };
    
    return `${prefixMap[type]}/${seqStr}/${month}/${year}`;
  },

  createInvoice: (db: Firestore, data: any) => {
    return dbService.create(db, 'invoices', {
      ...data,
      status: data.status || 'draft',
      createdAt: new Date().toISOString()
    });
  },

  updateInvoice: (db: Firestore, id: string, data: any) => 
    dbService.update(db, 'invoices', id, data),

  deleteInvoice: (db: Firestore, id: string) => 
    dbService.delete(db, 'invoices', id),
};
