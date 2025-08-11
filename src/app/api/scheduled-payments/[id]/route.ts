import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for updating a scheduled payment
const updateScheduledPaymentSchema = z.object({
  description: z.string().min(1, 'Description is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().min(1, 'Currency is required').optional(),
  dueDate: z.string().datetime('Invalid due date').optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

// GET - Fetch a single scheduled payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const { id } = params;

  try {
    const scheduledPayment = await prisma.scheduledPayment.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        category: true,
        reminders: true,
      },
    });

    if (!scheduledPayment) {
      return NextResponse.json({ error: 'Scheduled payment not found' }, { status: 404 });
    }

    return NextResponse.json(scheduledPayment);
  } catch (error) {
    console.error('Error fetching scheduled payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a scheduled payment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const { id } = params;
  const body = await request.json();

  const validation = updateScheduledPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  try {
    const updatedScheduledPayment = await prisma.scheduledPayment.updateMany({
      where: {
        id,
        workspaceId,
      },
      data: validation.data,
    });

    if (updatedScheduledPayment.count === 0) {
      return NextResponse.json({ error: 'Scheduled payment not found or you do not have access' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating scheduled payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a scheduled payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const { id } = params;

  try {
    const deleteResult = await prisma.scheduledPayment.deleteMany({
      where: {
        id,
        workspaceId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Scheduled payment not found or you do not have access' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
