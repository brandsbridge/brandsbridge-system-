
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const taskService = {
  createTask: (db: Firestore, data: any) => dbService.create(db, 'tasks', data),
  updateTaskStatus: (db: Firestore, id: string, status: string) => dbService.update(db, 'tasks', id, { status }),
  deleteTask: (db: Firestore, id: string) => dbService.delete(db, 'tasks', id),
};
