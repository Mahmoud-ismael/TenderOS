'use server';

import { revalidatePath } from 'next/cache';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getSystemSettings,
  updateSystemSettings,
  type SystemSettingsRow,
} from '@/lib/data/notifications';
import { runDeadlineAndComplianceScan } from '@/lib/services/notifications/deadline-scanner';

export async function fetchNotificationsAction() {
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(30),
    getUnreadNotificationsCount(),
  ]);

  return { notifications, unreadCount };
}

export async function markReadAction(id: string) {
  const success = await markNotificationAsRead(id);
  revalidatePath('/', 'layout');
  return { success };
}

export async function markAllReadAction() {
  const success = await markAllNotificationsAsRead();
  revalidatePath('/', 'layout');
  return { success };
}

export async function saveSettingsAction(settings: Partial<SystemSettingsRow>) {
  const res = await updateSystemSettings(settings);
  revalidatePath('/settings');
  return res;
}

export async function triggerManualDeadlineScanAction() {
  try {
    const summary = await runDeadlineAndComplianceScan();
    revalidatePath('/', 'layout');
    revalidatePath('/settings');
    return { success: true, summary };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
