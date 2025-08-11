import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a scheduled payment
const createScheduledPaymentSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  dueDate: z.string().datetime('Invalid due date'),
  isRecurring: z.boolean().optional(),
  frequency: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

// GET - Fetch scheduled payments
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const [scheduledPayments, total] = await prisma.$transaction([
      prisma.scheduledPayment.findMany({
        where: {
          workspaceId,
        },
        include: {
          category: true,
        },
        orderBy: {
          dueDate: 'asc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.scheduledPayment.count({
        where: {
          workspaceId,
        },
      }),
    ]);

    return NextResponse.json({
      scheduledPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching scheduled payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new scheduled payment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const body = await request.json();

  const validation = createScheduledPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  try {
    const newScheduledPayment = await prisma.scheduledPayment.create({
      data: {
        ...validation.data,
        workspaceId,
      },
    });

    return NextResponse.json(newScheduledPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
