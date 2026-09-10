import { syncPropertiesWithDatabase } from '../lib/scraper';
import { checkDueReminders } from '../lib/scheduler';
import { prisma } from '../lib/db';

async function main() {
  console.log('🚀 Running manual sync for Karmei Gat, Kiryat Gat...');
  const result = await syncPropertiesWithDatabase({ sendAlerts: true });
  console.log('Result:', result);

  console.log('⏰ Checking due reminders...');
  const reminders = await checkDueReminders();
  console.log('Reminders dispatched:', reminders);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal sync error:', e);
  process.exit(1);
});
