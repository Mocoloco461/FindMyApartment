import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    // Quick test query to check DB health
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbError = err.message || 'Failed to connect to database';
    logger.error('Healthcheck DB ping failed', err);
  }

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          error: dbError,
        },
        telegram: {
          configured: Boolean(
            process.env.TELEGRAM_BOT_TOKEN &&
            process.env.TELEGRAM_CHAT_ID &&
            process.env.TELEGRAM_BOT_TOKEN !== 'your_bot_token_here'
          ),
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
