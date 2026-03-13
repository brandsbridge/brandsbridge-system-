'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const stockService = {
  createStock: (db: Firestore, data: any) => dbService.create(db, 'stocks', data),
  updateStock: (db: Firestore, id: string, data: any) => dbService.update(db, 'stocks', id, data),
  deleteStock: (db: Firestore, id: string) => dbService.delete(db, 'stocks', id),
};