
'use client';

import { Firestore, collection, doc, getDocs, query, orderBy, limit, writeBatch } from 'firebase/firestore';
import { dbService } from './db';

export const invoiceService = {
  // Generate next professional sequence number
  generateSequenceNumber: async (db: Firestore, type: 'EXP' | 'INV' | 'PRO' | 'CN') => {
    const q = query(
      collection(db, 'invoices'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    let nextSeq = 1;
    if (!snap.empty) {
      const lastNum = snap.docs[0].data().number;
      const parts = lastNum.split('/');
      if (parts.length > 1) {
        nextSeq = parseInt(parts[1]) + 1;
      }
    }
    
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const year = new Date().getFullYear();
    const seqStr = nextSeq.toString().padStart(8, '0');
    
    return `FSE-${type}/${seqStr}/${month}/${year}`;
  },

  createInvoice: (db: Firestore, data: any) => {
    return dbService.create(db, 'invoices', {
      ...data,
      createdAt: new Date().toISOString()
    });
  },

  updateInvoice: (db: Firestore, id: string, data: any) => 
    dbService.update(db, 'invoices', id, data),

  deleteInvoice: (db: Firestore, id: string) => 
    dbService.delete(db, 'invoices', id),
};
