
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const userService = {
  createEmployee: (db: Firestore, data: any) => dbService.create(db, 'employees', data),
  updateEmployee: (db: Firestore, id: string, data: any) => dbService.update(db, 'employees', id, data),
  deleteEmployee: (db: Firestore, id: string) => dbService.delete(db, 'employees', id),
};
