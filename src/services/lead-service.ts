'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const leadService = {
  createLead: (db: Firestore, data: any) => dbService.create(db, 'leads', data),
  updateLead: (db: Firestore, id: string, data: any) => dbService.update(db, 'leads', id, data),
  deleteLead: (db: Firestore, id: string) => dbService.delete(db, 'leads', id),
};