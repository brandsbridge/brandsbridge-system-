
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const invoiceService = {
  createInvoice: (db: Firestore, data: any) => dbService.create(db, 'invoices', data),
  updateInvoice: (db: Firestore, id: string, data: any) => dbService.update(db, 'invoices', id, data),
  deleteInvoice: (db: Firestore, id: string) => dbService.delete(db, 'invoices', id),
};
