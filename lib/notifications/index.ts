export type NotificationChannel = 'email' | 'slack' | 'telegram' | 'webhook';

export interface NotificationRecipient {
  id: string;
  channel: NotificationChannel;
  address: string; // email, webhook URL, chat ID
  enabled: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NotificationInput {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'critical';
  timestamp?: string;
  metadata?: Record<string, any>;
}

/** Send notifications across all configured channels */
export async function sendNotification(
  input: NotificationInput,
  channels: NotificationChannel[] = ['email', 'slack', 'telegram', 'webhook']
) {
  const notification: Notification = {
    id: Math.random().toString(36).substr(2, 9),
    ...input,
    type: input.type || 'info',
    timestamp: input.timestamp || new Date().toISOString(),
  };
  const results = await Promise.allSettled(channels.map(ch => sendViaChannel(ch, notification)));
  return results;
}

async function sendViaChannel(channel: NotificationChannel, notification: Notification) {
  try {
    switch (channel) {
      case 'email':
        if (process.env.RESEND_API_KEY) {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'PIE <alerts@pie.app>',
            to: ['user@example.com'],
            subject: notification.title,
            text: notification.message,
          });
        }
        break;
      case 'slack':
        if (process.env.SLACK_WEBHOOK_URL) {
          await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `*${notification.title}*\n${notification.message}` }),
          });
        }
        break;
      case 'telegram':
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
          const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: `*${notification.title}*\n${notification.message}`,
              parse_mode: 'Markdown',
            }),
          });
        }
        break;
      case 'webhook':
        if (process.env.ALERT_WEBHOOK_URL) {
          await fetch(process.env.ALERT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notification),
          });
        }
        break;
    }
    return { channel, success: true };
  } catch (error: any) {
    return { channel, success: false, error: error.message };
  }
}

export function formatNotification(notification: Notification): string {
  const icons = { info: 'ℹ️', warning: '⚠️', critical: '🚨' };
  return `${icons[notification.type]} *${notification.title}*\n${notification.message}\n\n_${notification.timestamp}_`;
}
