'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

/**
 * Service for managing in-platform email communications.
 */
export const emailService = {
  /**
   * Logs an outgoing email to the communication ledger.
   * In a production environment, this Firestore write would trigger a 
   * Cloud Function to dispatch the actual email via SendGrid/Postmark.
   */
  sendInternalEmail: (db: Firestore, data: {
    to: string;
    toName: string;
    subject: string;
    body: string;
    senderName: string;
    senderId: string;
    entityId: string;
    entityType: 'supplier' | 'customer';
  }) => {
    return dbService.create(db, 'communication_logs', {
      ...data,
      status: 'dispatched',
      sentAt: new Date().toISOString()
    });
  }
};
