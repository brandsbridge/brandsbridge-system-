'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const productService = {
  createProduct: (db: Firestore, data: any) => dbService.create(db, 'products', data),
  updateProduct: (db: Firestore, id: string, data: any) => dbService.update(db, 'products', id, data),
  deleteProduct: (db: Firestore, id: string) => dbService.delete(db, 'products', id),
};