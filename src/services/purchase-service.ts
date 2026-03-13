'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const purchaseService = {
  createPurchase: (db: Firestore, data: any) => dbService.create(db, 'purchases', data),
  updatePurchase: (db: Firestore, id: string, data: any) => dbService.update(db, 'purchases', id, data),
  deletePurchase: (db: Firestore, id: string) => dbService.delete(db, 'purchases', id),
};