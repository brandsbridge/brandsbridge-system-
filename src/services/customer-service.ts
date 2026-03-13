
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const customerService = {
  createCustomer: (db: Firestore, data: any) => dbService.create(db, 'customers', data),
  updateCustomer: (db: Firestore, id: string, data: any) => dbService.update(db, 'customers', id, data),
  deleteCustomer: (db: Firestore, id: string) => dbService.delete(db, 'customers', id),
};
