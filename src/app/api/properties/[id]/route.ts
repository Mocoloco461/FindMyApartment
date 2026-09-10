import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PropertyStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: { reminders: true },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, property });
  } catch (error: any) {
    logger.error(`Error fetching property ${id}`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { status, notes, followUpDate, isArchived } = body;

    const data: any = {};

    if (status !== undefined) {
      if (!Object.values(PropertyStatus).includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      data.status = status;
    }

    if (notes !== undefined) {
      data.notes = notes;
    }

    if (followUpDate !== undefined) {
      data.followUpDate = followUpDate ? new Date(followUpDate) : null;
      // If setting a future follow-up date, reset notified flag so reminder will trigger
      data.followUpNotified = false;
    }

    if (isArchived !== undefined) {
      data.isArchived = Boolean(isArchived);
    }

    const updated = await prisma.property.update({
      where: { id },
      data,
    });

    logger.info(`Property ${id} updated: status=${updated.status}, hasNotes=${Boolean(updated.notes)}`);

    return NextResponse.json({ success: true, property: updated });
  } catch (error: any) {
    logger.error(`Error updating property ${id}`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
