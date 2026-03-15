
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const paymentService = {
  createPayment: (db: Firestore, data: any) => dbService.create(db, 'payments', data),
  updatePayment: (db: Firestore, id: string, data: any) => dbService.update(db, 'payments', id, data),
  deletePayment: (db: Firestore, id: string) => dbService.delete(db, 'payments', id),
};
