
'use client';

import { EventEmitter } from 'events';

class FirestoreErrorEmitter extends EventEmitter {}

export const errorEmitter = new FirestoreErrorEmitter();
