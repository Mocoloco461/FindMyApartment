import cron from 'node-cron';
import { prisma } from './db';
import { logger } from './logger';
import { syncPropertiesWithDatabase } from './scraper';
import { sendPropertyReminderAlert, sendGeneralReminderAlert } from './telegram';

let isSchedulerRunning = false;

/**
 * Check due reminders (both apartment follow-ups and general reminders)
 * and dispatch Telegram notifications.
 */
export async function checkDueReminders(): Promise<{
  propertyRemindersSent: number;
  generalRemindersSent: number;
}> {
  const now = new Date();
  let propertyRemindersSent = 0;
  let generalRemindersSent = 0;

  try {
    // 1. Check apartment follow-up reminders
    const dueProperties = await prisma.property.findMany({
      where: {
        status: 'CHECK_LATER',
        followUpDate: { lte: now },
        followUpNotified: false,
      },
    });

    for (const prop of dueProperties) {
      logger.info(`Sending due follow-up reminder for property ${prop.id}...`);
      try {
        const sent = await sendPropertyReminderAlert({
          id: prop.id,
          street: prop.street,
          price: prop.price,
          rooms: prop.rooms,
          notes: prop.notes,
          followUpDate: prop.followUpDate,
          url: prop.url,
        });

        if (sent) {
          await prisma.property.update({
            where: { id: prop.id },
            data: { followUpNotified: true },
          });
          propertyRemindersSent += 1;
        }
      } catch (err) {
        logger.error(`Failed to send follow-up reminder for property ${prop.id}`, err);
      }
    }

    // 2. Check general independent reminders
    const dueReminders = await prisma.reminder.findMany({
      where: {
        dueDate: { lte: now },
        isCompleted: false,
        isNotified: false,
      },
    });

    for (const rem of dueReminders) {
      logger.info(`Sending due general reminder '${rem.title}'...`);
      try {
        const sent = await sendGeneralReminderAlert({
          title: rem.title,
          note: rem.note,
          dueDate: rem.dueDate,
        });

        if (sent) {
          await prisma.reminder.update({
            where: { id: rem.id },
            data: { isNotified: true },
          });
          generalRemindersSent += 1;
        }
      } catch (err) {
        logger.error(`Failed to send general reminder '${rem.title}'`, err);
      }
    }
  } catch (error) {
    logger.error('Error during checkDueReminders', error);
  }

  return { propertyRemindersSent, generalRemindersSent };
}

/**
 * Initialize background scheduler:
 * - Hourly scraping cron job
 * - Periodic reminder checker (runs every minute)
 */
export function startScheduler(): void {
  if (isSchedulerRunning) {
    logger.debug('Scheduler already active, skipping init');
    return;
  }

  isSchedulerRunning = true;
  const cronSchedule = process.env.CRON_SCHEDULE || '0 * * * *'; // Default: top of every hour

  logger.info(`Starting background scheduler (Scraper cron: '${cronSchedule}')...`);

  // 1. Hourly Scraper Job
  cron.schedule(cronSchedule, async () => {
    logger.info('⏰ Hourly scraper cron triggered!');
    try {
      await syncPropertiesWithDatabase({ sendAlerts: true });
    } catch (err) {
      logger.error('Error in hourly scraper cron', err);
    }
  });

  // 2. Minute-level Reminder Checker
  cron.schedule('* * * * *', async () => {
    try {
      await checkDueReminders();
    } catch (err) {
      logger.error('Error in reminder checker cron', err);
    }
  });

  logger.info('Scheduler initialized successfully');
}
