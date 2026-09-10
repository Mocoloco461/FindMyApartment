import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const reminders = await prisma.reminder.findMany({
      orderBy: { dueDate: 'asc' },
      include: {
        property: {
          select: {
            id: true,
            street: true,
            price: true,
            rooms: true,
            url: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, reminders });
  } catch (error: any) {
    logger.error('Failed to fetch reminders', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, note, dueDate, propertyId } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Title and Due Date are required' },
        { status: 400 }
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        title: title.trim(),
        note: note ? note.trim() : null,
        dueDate: new Date(dueDate),
        propertyId: propertyId || null,
        isCompleted: false,
        isNotified: false,
      },
    });

    logger.info(`Reminder created: '${reminder.title}' for ${reminder.dueDate}`);

    return NextResponse.json({ success: true, reminder }, { status: 201 });
  } catch (error: any) {
    logger.error('Failed to create reminder', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isCompleted, title, note, dueDate } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (isCompleted !== undefined) data.isCompleted = Boolean(isCompleted);
    if (title !== undefined) data.title = title.trim();
    if (note !== undefined) data.note = note ? note.trim() : null;
    if (dueDate !== undefined) {
      data.dueDate = new Date(dueDate);
      data.isNotified = false; // Reset notification for changed date
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error: any) {
    logger.error('Failed to update reminder', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await prisma.reminder.delete({
      where: { id },
    });

    logger.info(`Reminder deleted: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to delete reminder', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
