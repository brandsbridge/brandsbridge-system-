
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const journalService = {
  createJournal: (db: Firestore, data: any) => dbService.create(db, 'journals', data),
  updateJournal: (db: Firestore, id: string, data: any) => dbService.update(db, 'journals', id, data),
  deleteJournal: (db: Firestore, id: string) => dbService.delete(db, 'journals', id),
};
