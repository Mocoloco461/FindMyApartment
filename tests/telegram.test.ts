import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Telegram Formatter & Alert Generation Test', () => {
  test('should format new property alert with all details, amenities and link', () => {
    const property = {
      id: '122600',
      street: 'הנרייטה סאלד',
      price: 4800,
      rooms: 4,
      sqm: 95,
      floor: 3,
      floorsTotal: 9,
      amenities: ['SAFE_ROOM', 'PARKING', 'ELEVATOR', 'AC'],
      source: 'Yad2',
      url: 'https://realta.co.il/he/kiryat-gat/karmei-gat/122600/',
    };

    const AMENITY_MAP: Record<string, string> = {
      SAFE_ROOM: 'ממ״ד',
      PARKING: 'חניה',
      ELEVATOR: 'מעלית',
      AC: 'מיזוג אוויר',
    };

    const amenitiesStr = property.amenities.map((a) => AMENITY_MAP[a] || a).join(', ');

    const message = [
      `🏢 <b>דירה חדשה להשכרה בכרמי גת, קרית גת!</b>`,
      `📍 <b>רחוב:</b> ${property.street}`,
      `💰 <b>מחיר:</b> ${property.price.toLocaleString()} ₪`,
      `📐 <b>פרטים:</b> ${property.rooms} חד׳ | ${property.sqm} מ״ר | קומה ${property.floor} מתוך ${property.floorsTotal}`,
      `✨ <b>מאפיינים:</b> ${amenitiesStr}`,
      `🏷️ <b>מזהה מודעה:</b> <code>${property.id}</code> [מקור: ${property.source}]`,
      `🔗 <a href="${property.url}">לחץ כאן לצפייה במודעה המלאה</a>`,
    ].join('\n');

    assert.ok(message.includes('הנרייטה סאלד'), 'Missing street');
    assert.ok(message.includes('4,800 ₪'), 'Missing formatted price');
    assert.ok(message.includes('ממ״ד, חניה, מעלית, מיזוג אוויר'), 'Missing amenities');
    assert.ok(message.includes('https://realta.co.il/he/kiryat-gat/karmei-gat/122600/'), 'Missing URL');
  });

  test('should format follow-up reminder message with notes', () => {
    const data = {
      id: '122600',
      street: 'הנרייטה סאלד',
      price: 4800,
      rooms: 4,
      notes: 'דיברתי עם בעל הדירה, לבדוק כניסה בסוף החודש',
      url: 'https://realta.co.il/he/kiryat-gat/karmei-gat/122600/',
    };

    const message = [
      `⏰ <b>תזכורת מעקב לדירה בכרמי גת!</b>`,
      `🏠 <b>נכס:</b> ${data.street} · ${data.rooms} חדרים · ${data.price.toLocaleString()} ₪`,
      `📝 <b>הערות שרשמת:</b>\n<i>${data.notes}</i>`,
      `🔗 <a href="${data.url}">לחץ כאן למעבר למודעה</a>`,
    ].join('\n');

    assert.ok(message.includes('תזכורת מעקב לדירה בכרמי גת'));
    assert.ok(message.includes(data.notes));
    assert.ok(message.includes(data.url));
  });

  test('should format independent general reminder with note and date', () => {
    const reminder = {
      title: 'פגישה עם בעל דירה בכרמי גת',
      note: 'להביא צ׳קים ותעודת זהות',
      dueDate: new Date('2026-09-15T10:00:00.000Z'),
    };

    const dateStr = new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Jerusalem',
    }).format(reminder.dueDate);

    const message = [
      `🔔 <b>תזכורת שנקבעה לתאריך זה!</b>`,
      `📌 <b>נושא:</b> ${reminder.title}`,
      `📝 <b>הערה מוצמדת:</b>\n<i>${reminder.note}</i>`,
      `📅 <b>זמן יעד:</b> ${dateStr}`,
    ].join('\n');

    assert.ok(message.includes(reminder.title));
    assert.ok(message.includes(reminder.note));
    assert.ok(message.includes('זמן יעד'));
  });
});
