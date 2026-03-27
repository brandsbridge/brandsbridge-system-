
'use client';

import { Firestore } from 'firebase/firestore';
import { dbService } from './db';

export interface TaskComment {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName: string;
  department: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "inprogress" | "review" | "done";
  dueDate: string;
  linkedId?: string;
  linkedType?: "customer" | "supplier";
  linkedName?: string;
  comments: TaskComment[];
  activityLog: TaskActivity[];
  createdAt: string;
  updatedAt: string;
}

export const taskService = {
  createTask: (db: Firestore, data: any) => dbService.create(db, 'tasks', data),
  updateTask: (db: Firestore, id: string, data: any) => dbService.update(db, 'tasks', id, data),
  updateTaskStatus: (db: Firestore, id: string, status: string) => dbService.update(db, 'tasks', id, { status, updatedAt: new Date().toISOString() }),
  deleteTask: (db: Firestore, id: string) => dbService.delete(db, 'tasks', id),
  addComment: (db: Firestore, id: string, comment: any, currentComments: any[] = []) => 
    dbService.update(db, 'tasks', id, { 
      comments: [...currentComments, comment],
      updatedAt: new Date().toISOString()
    }),
  addActivity: (db: Firestore, id: string, activity: any, currentActivityLog: any[] = []) => 
    dbService.update(db, 'tasks', id, { 
      activityLog: [...currentActivityLog, activity] 
    }),
};
