import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// New validation schema for a Transaction
const transactionSchema = z.object({
  description: z.string().min(1, 'Описание обязательно'),
  amount: z.number().positive('Сумма должна быть положительным числом'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Некорректная дата',
  }),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().optional(),
  projectId: z.string().optional(),
});

// GET - fetch a list of transactions for the user's workspace
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const { searchParams } = request.nextUrl;

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Prisma.TransactionWhereInput = {
      workspaceId,
      // Add other filters from searchParams if needed
    };

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where });

    // Fetch transactions with filters and pagination
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        project: true,
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении транзакций' },
      { status: 500 }
    );
  }
}

// POST - create a new transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const body = await request.json();

    // Validate input data
    const validationResult = transactionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create the transaction in the database, linked to the workspace
    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        type: data.type,
        currency: 'USD', // Or get from workspace settings
        workspaceId,
        categoryId: data.categoryId || null,
        projectId: data.projectId || null,
      },
      include: {
        category: true,
        project: true,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании транзакции' },
      { status: 500 }
    );
  }
}
