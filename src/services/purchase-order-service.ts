
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const purchaseOrderService = {
  createPO: (db: Firestore, data: any) => dbService.create(db, 'purchase_orders', data),
  updatePO: (db: Firestore, id: string, data: any) => dbService.update(db, 'purchase_orders', id, data),
  deletePO: (db: Firestore, id: string) => dbService.delete(db, 'purchase_orders', id),
};
