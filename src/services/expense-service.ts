
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const expenseService = {
  createExpense: (db: Firestore, data: any) => dbService.create(db, 'expenses', data),
  updateExpense: (db: Firestore, id: string, data: any) => dbService.update(db, 'expenses', id, data),
  deleteExpense: (db: Firestore, id: string) => dbService.delete(db, 'expenses', id),
};
