import { logger } from './logger';

export interface TelegramSendOptions {
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  disableWebPagePreview?: boolean;
}

export interface NewPropertyAlertData {
  id: string;
  street?: string | null;
  price?: number | null;
  rooms?: number | null;
  sqm?: number | null;
  floor?: number | null;
  floorsTotal?: number | null;
  amenities?: string[];
  source?: string | null;
  url: string;
}

export interface PropertyReminderAlertData {
  id: string;
  street?: string | null;
  price?: number | null;
  rooms?: number | null;
  notes?: string | null;
  followUpDate?: Date | null;
  url: string;
}

export interface GeneralReminderAlertData {
  title: string;
  note?: string | null;
  dueDate: Date;
}

const AMENITY_HEBREW_MAP: Record<string, string> = {
  PARKING: 'חניה',
  ELEVATOR: 'מעלית',
  AC: 'מיזוג אוויר',
  SAFE_ROOM: 'ממ״ד',
  MAMAD: 'ממ״ד',
  FURNISHED: 'ריהוט',
  ACCESSIBLE: 'נגישות לנכים',
  BOILER: 'דוד שמש',
  BALCONY: 'מרפסת',
  STORAGE: 'מחסן',
  BARS: 'סורגים',
  SUN_TERRACE: 'מרפסת שמש',
  RENOVATED: 'משופצת',
  PETS_ALLOWED: 'חיות מחמד',
};

/**
 * Send raw text message via Telegram Bot API
 */
export async function sendTelegramMessage(
  text: string,
  options: TelegramSendOptions = { parseMode: 'HTML', disableWebPagePreview: false }
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === 'your_bot_token_here' || chatId === 'your_chat_id_here') {
    logger.warn('Telegram notifications skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured');
    return { success: false, error: 'Telegram credentials not configured' };
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disableWebPagePreview || false,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      const errDetail = data.description || `HTTP ${response.status}`;
      logger.error(`Telegram API error: ${errDetail}`, data);
      return { success: false, error: errDetail };
    }

    logger.info('Telegram message sent successfully');
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to send Telegram message', error);
    return { success: false, error: error.message || 'Unknown network error' };
  }
}

/**
 * Send alert for newly discovered property in Karmei Gat
 */
export async function sendNewPropertyAlert(property: NewPropertyAlertData): Promise<boolean> {
  const streetStr = property.street ? `<b>רחוב:</b> ${escapeHtml(property.street)}` : '<b>רחוב:</b> לא צוין';
  const priceStr = property.price ? `<b>מחיר:</b> ${property.price.toLocaleString()} ₪` : '<b>מחיר:</b> לא צוין';
  
  const roomsStr = property.rooms ? `${property.rooms} חד׳` : '-';
  const sqmStr = property.sqm ? `${property.sqm} מ״ר` : '-';
  const floorStr = property.floor !== null && property.floor !== undefined ? `קומה ${property.floor}` : '-';
  const totalFloorStr = property.floorsTotal ? ` מתוך ${property.floorsTotal}` : '';

  const amenitiesHebrew = (property.amenities || [])
    .map((a) => AMENITY_HEBREW_MAP[a] || a)
    .join(', ');

  const sourceStr = property.source ? ` [מקור: ${escapeHtml(property.source)}]` : '';

  const message = [
    `🏢 <b>דירה חדשה להשכרה בכרמי גת, קרית גת!</b>`,
    `─────────────────────`,
    `📍 ${streetStr}`,
    `💰 ${priceStr}`,
    `📐 <b>פרטים:</b> ${roomsStr} | ${sqmStr} | ${floorStr}${totalFloorStr}`,
    amenitiesHebrew ? `✨ <b>מאפיינים:</b> ${escapeHtml(amenitiesHebrew)}` : '',
    `🏷️ <b>מזהה מודעה:</b> <code>${escapeHtml(property.id)}</code>${sourceStr}`,
    `─────────────────────`,
    `🔗 <a href="${property.url}">לחץ כאן לצפייה במודעה המלאה</a>`,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await sendTelegramMessage(message);
  return res.success;
}

/**
 * Send follow-up reminder for a property
 */
export async function sendPropertyReminderAlert(data: PropertyReminderAlertData): Promise<boolean> {
  const streetStr = data.street ? escapeHtml(data.street) : 'דירה ללא שם רחוב';
  const priceStr = data.price ? `${data.price.toLocaleString()} ₪` : '';
  const roomsStr = data.rooms ? `${data.rooms} חדרים` : '';
  const specStr = [streetStr, roomsStr, priceStr].filter(Boolean).join(' · ');

  const message = [
    `⏰ <b>תזכורת מעקב לדירה בכרמי גת!</b>`,
    `─────────────────────`,
    `🏠 <b>נכס:</b> ${specStr}`,
    data.notes ? `📝 <b>הערות שרשמת:</b>\n<i>${escapeHtml(data.notes)}</i>` : '📝 <i>ללא הערות</i>',
    `─────────────────────`,
    `🔗 <a href="${data.url}">לחץ כאן למעבר למודעה</a>`,
  ].join('\n');

  const res = await sendTelegramMessage(message);
  return res.success;
}

/**
 * Send general independent reminder
 */
export async function sendGeneralReminderAlert(reminder: GeneralReminderAlertData): Promise<boolean> {
  const dateStr = new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jerusalem',
  }).format(new Date(reminder.dueDate));

  const message = [
    `🔔 <b>תזכורת שנקבעה לתאריך זה!</b>`,
    `─────────────────────`,
    `📌 <b>נושא:</b> ${escapeHtml(reminder.title)}`,
    reminder.note ? `📝 <b>הערה מוצמדת:</b>\n<i>${escapeHtml(reminder.note)}</i>` : '',
    `📅 <b>זמן יעד:</b> ${dateStr}`,
    `─────────────────────`,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await sendTelegramMessage(message);
  return res.success;
}

/**
 * Simple HTML escape helper
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
