import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import { logger } from '@/lib/logger';

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === 'your_bot_token_here' || chatId === 'your_chat_id_here') {
    return NextResponse.json(
      {
        success: false,
        error: 'משתני הסביבה TELEGRAM_BOT_TOKEN או TELEGRAM_CHAT_ID אינם מוגדרים או מכילים ערכי ברירת מחדל.',
      },
      { status: 400 }
    );
  }

  const nowStr = new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Jerusalem',
  }).format(new Date());

  const testMessage = [
    `✅ <b>בדיקת חיבור מוצלחת לבוט Realta!</b>`,
    `─────────────────────`,
    `🤖 הבוט מחובר ומקונפג בהצלחה.`,
    `🏙️ מעקב פעיל: <b>כרמי גת, קרית גת</b>`,
    `⏰ תדירות סריקה: <b>כל שעה</b>`,
    `🕒 זמן הבדיקה: ${nowStr}`,
    `─────────────────────`,
    `מעתה תקבל התראות מיידיות על כל דירה חדשה שתפורסם, וכן תזכורות מעקב שנקבעו! 🚀`,
  ].join('\n');

  logger.info('Sending test Telegram message...');
  const result = await sendTelegramMessage(testMessage);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || 'שגיאה בשליחת הודעת הבדיקה לטלגרם',
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'הודעת בדיקה נשלחה בהצלחה לטלגרם!',
  });
}
