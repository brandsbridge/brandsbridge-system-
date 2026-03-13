
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export const campaignService = {
  createCampaign: (db: Firestore, data: any) => dbService.create(db, 'campaigns', data),
  updateCampaign: (db: Firestore, id: string, data: any) => dbService.update(db, 'campaigns', id, data),
  deleteCampaign: (db: Firestore, id: string) => dbService.delete(db, 'campaigns', id),
};
