'use client';

import { Firestore, collection, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

export const notificationService = {
  create: async (
    db: Firestore,
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
  ) => {
    try {
      const ref = doc(collection(db, 'notifications'));
      await setDoc(ref, {
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: Timestamp.now(),
        link: link || null,
      });
    } catch (err) {
      console.error('Notification creation failed:', err);
    }
  },

  markRead: async (db: Firestore, notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  },
};
