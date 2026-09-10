import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PropertyStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const roomsParam = searchParams.get('rooms');
    const sortBy = searchParams.get('sortBy') || 'newest';

    const where: any = {
      isArchived: false,
    };

    // Filter by status if not "ALL"
    if (statusParam && statusParam !== 'ALL' && Object.values(PropertyStatus).includes(statusParam as PropertyStatus)) {
      where.status = statusParam as PropertyStatus;
    }

    // Street search
    if (searchParam && searchParam.trim()) {
      where.street = {
        contains: searchParam.trim(),
        mode: 'insensitive',
      };
    }

    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice, 10);
      if (maxPrice) where.price.lte = parseInt(maxPrice, 10);
    }

    // Rooms filter
    if (roomsParam && roomsParam !== 'ALL') {
      const roomNum = parseFloat(roomsParam);
      if (!isNaN(roomNum)) {
        if (roomNum >= 5) {
          where.rooms = { gte: 5 };
        } else {
          where.rooms = roomNum;
        }
      }
    }

    // Sort order
    let orderBy: any = { firstSeenAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    else if (sortBy === 'rooms_asc') orderBy = { rooms: 'asc' };
    else if (sortBy === 'rooms_desc') orderBy = { rooms: 'desc' };
    else if (sortBy === 'sqm_desc') orderBy = { sqm: 'desc' };
    else if (sortBy === 'updated') orderBy = { updatedAt: 'desc' };

    const [properties, statusCounts, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
      }),
      prisma.property.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.property.count({ where: { isArchived: false } }),
    ]);

    // Build stats object
    const countsMap: Record<string, number> = {
      ALL: totalCount,
      NEW: 0,
      RELEVANT: 0,
      NOT_RELEVANT: 0,
      NEEDS_CHECK: 0,
      CHECK_LATER: 0,
    };

    for (const item of statusCounts) {
      countsMap[item.status] = item._count.status;
    }

    return NextResponse.json({
      success: true,
      properties,
      stats: countsMap,
      total: properties.length,
    });
  } catch (error: any) {
    logger.error('Failed to query properties', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database query error' },
      { status: 500 }
    );
  }
}
