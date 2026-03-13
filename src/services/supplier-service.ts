
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const supplierService = {
  createSupplier: (db: Firestore, data: any) => dbService.create(db, 'suppliers', data),
  updateSupplier: (db: Firestore, id: string, data: any) => dbService.update(db, 'suppliers', id, data),
  deleteSupplier: (db: Firestore, id: string) => dbService.delete(db, 'suppliers', id),
};
