import { api, isApiOffline } from '../lib/api';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueAt: string;
  repeat: 'none' | 'daily' | 'weekly';
  assignee?: 'vlad' | 'eric' | 'paul' | 'ilya' | null;
  dealId?: string | null;
  dealName?: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  dueAt: string;
  repeat?: 'none' | 'daily' | 'weekly';
  assignee?: 'vlad' | 'eric' | 'paul' | 'ilya' | null;
  dealId?: string | null;
  dealName?: string | null;
  priority: 'low' | 'medium' | 'high';
}

export interface UpdateReminderData {
  title?: string;
  description?: string;
  dueAt?: string;
  repeat?: 'none' | 'daily' | 'weekly';
  assignee?: 'vlad' | 'eric' | 'paul' | 'ilya' | null;
  dealId?: string | null;
  dealName?: string | null;
  priority?: 'low' | 'medium' | 'high';
}

export async function getReminders(completed?: boolean): Promise<Reminder[]> {
  if (isApiOffline()) return [];
  try {
    const params = new URLSearchParams();
    if (completed !== undefined) {
      params.set('completed', completed.toString());
    }
    
    const { data } = await api.get(`/api/reminders?${params.toString()}`);
    return data || [];
  } catch (error) {
    console.error('Failed to fetch reminders:', error);
    return [];
  }
}

export async function createReminder(data: CreateReminderData): Promise<Reminder | null> {
  if (isApiOffline()) return null;
  try {
    const { data: reminder } = await api.post('/api/reminders', data);
    return reminder;
  } catch (error) {
    console.error('Failed to create reminder:', error);
    throw error;
  }
}

export async function updateReminder(id: string, data: UpdateReminderData): Promise<Reminder | null> {
  if (isApiOffline()) return null;
  try {
    const { data: reminder } = await api.put(`/api/reminders/${id}`, data);
    return reminder;
  } catch (error) {
    console.error('Failed to update reminder:', error);
    throw error;
  }
}

export async function toggleComplete(id: string): Promise<Reminder | null> {
  if (isApiOffline()) return null;
  try {
    const { data: reminder } = await api.put(`/api/reminders/${id}/complete`);
    return reminder;
  } catch (error) {
    console.error('Failed to toggle reminder completion:', error);
    throw error;
  }
}

export async function deleteReminder(id: string): Promise<void> {
  if (isApiOffline()) return;
  try {
    await api.delete(`/api/reminders/${id}`);
  } catch (error) {
    console.error('Failed to delete reminder:', error);
    throw error;
  }
}