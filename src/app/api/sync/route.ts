import { NextRequest, NextResponse } from 'next/server';
import { syncPropertiesWithDatabase } from '@/lib/scraper';
import { checkDueReminders } from '@/lib/scheduler';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    logger.info('Manual sync triggered via /api/sync');
    const result = await syncPropertiesWithDatabase({ sendAlerts: true });
    
    // Also check any due reminders
    const remindersResult = await checkDueReminders();

    return NextResponse.json({
      success: result.success,
      sync: result,
      reminders: remindersResult,
    });
  } catch (error: any) {
    logger.error('Error during manual sync', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [latestLog, totalProperties, activeProperties] = await Promise.all([
      prisma.syncLog.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
      prisma.property.count(),
      prisma.property.count({ where: { isArchived: false } }),
    ]);

    return NextResponse.json({
      success: true,
      latestSync: latestLog,
      totalProperties,
      activeProperties,
    });
  } catch (error: any) {
    logger.error('Failed to get sync stats', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
