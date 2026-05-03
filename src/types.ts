/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TaskStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'notary' | 'member';
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // User ID
  assignedToName: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  resultUrl?: string;
  resultNotes?: string;
  feedback?: string;
  dueDate: number;
}
