
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const invoiceScanService = {
  logScan: (db: Firestore, data: any) => 
    dbService.create(db, 'invoice_scans', {
      ...data,
      scannedAt: new Date().toISOString()
    }),
  
  deleteScan: (db: Firestore, id: string) => 
    dbService.delete(db, 'invoice_scans', id)
};
