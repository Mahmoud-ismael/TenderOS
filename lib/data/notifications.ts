import { createClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/lib/supabase/types';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type SystemSettingsRow = Database['public']['Tables']['system_settings']['Row'];

export interface CreateNotificationParams {
  type:
    | 'deadline_approaching'
    | 'compliance_expiring'
    | 'qualification_pending'
    | 'checklist_incomplete'
    | 'tender_discovered';
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  entityType?: 'tender' | 'application' | 'compliance_doc';
  entityId?: string;
  link?: string;
}

/**
 * Server function: Fetches system settings (creates default row if missing).
 */
export async function getSystemSettings(): Promise<SystemSettingsRow> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (data) return data;

  const defaultSettings: SystemSettingsRow = {
    id: 1,
    email_notifications_enabled: true,
    in_app_notifications_enabled: true,
    notification_email: 'tenders@hisako.co.ke',
    deadline_thresholds_days: [7, 3, 1],
    compliance_thresholds_days: [60, 30, 14, 7],
    auto_qualify_discovered: true,
    min_score_to_notify: 50,
    resend_api_key: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('system_settings').upsert(defaultSettings);
  } catch (err) {
    console.warn('Settings upsert note:', err);
  }

  return defaultSettings;
}

/**
 * Server function: Updates system settings.
 */
export async function updateSystemSettings(
  params: Partial<Omit<SystemSettingsRow, 'id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 1,
        ...params,
        updated_at: new Date().toISOString(),
      });

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Server function: Fetches recent notifications.
 */
export async function getNotifications(limit: number = 25): Promise<NotificationRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

/**
 * Server function: Gets unread notification count.
 */
export async function getUnreadNotificationsCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error || count === null) return 0;
  return count;
}

/**
 * Server function: Creates an in-app notification with deduplication.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notification?: NotificationRow }> {
  const supabase = await createClient();

  try {
    // Deduplicate: avoid creating the exact same title & entity notification within 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', params.type)
      .eq('title', params.title)
      .gte('created_at', twelveHoursAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true }; // Already notified recently
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        type: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity || 'info',
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        link: params.link || null,
        is_read: false,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return { success: true, notification: data };
  } catch (err: any) {
    console.error('Failed to create notification:', err);
    return { success: false };
  }
}

/**
 * Server function: Marks a single notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  return !error;
}

/**
 * Server function: Marks all notifications as read.
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);

  return !error;
}
