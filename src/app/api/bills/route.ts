import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для создания счета
const billSchema = z.object({
  name: z.string().min(1, 'Название счета обязательно'),
  amount: z.number().positive('Сумма должна быть положительным числом'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Некорректная дата',
  }),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  teamId: z.string().optional(),
  reminders: z
    .array(
      z.object({
        daysBefore: z.number().int().positive(),
      })
    )
    .optional(),
});

// GET - получение списка счетов пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    
    // Параметры фильтрации и пагинации
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const teamId = searchParams.get('teamId');
    const period = searchParams.get('period');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Формируем условия фильтрации
    const where: any = {
      OR: [
        { userId },
        {
          team: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      ],
    };

    // Добавляем дополнительные фильтры, если они указаны
    if (status === 'paid') {
      where.isPaid = true;
    } else if (status === 'unpaid') {
      where.isPaid = false;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    // Фильтрация по периоду
    if (period) {
      const now = new Date();
      let startDate, endDate;

      switch (period) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        where.dueDate = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    // Получаем общее количество счетов для пагинации
    const totalCount = await prisma.bill.count({ where });

    // Получаем счета с учетом фильтров и пагинации
    const bills = await prisma.bill.findMany({
      where,
      include: {
        category: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        reminders: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      bills,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении счетов' },
      { status: 500 }
    );
  }
}

// POST - создание нового счета
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Валидация входных данных
    const validationResult = billSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Проверка доступа к команде, если указан teamId
    if (data.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: data.teamId,
          userId,
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'У вас нет доступа к этой команде' },
          { status: 403 }
        );
      }
    }

    // Создаем счет в базе данных
    const bill = await prisma.bill.create({
      data: {
        name: data.name,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        description: data.description || '',
        isRecurring: data.isRecurring,
        recurringPeriod: data.isRecurring ? data.recurringPeriod : null,
        isPaid: false,
        userId,
        teamId: data.teamId || null,
        categoryId: data.categoryId || null,
      },
    });

    // Создаем напоминания, если они указаны
    if (data.reminders && data.reminders.length > 0) {
      await prisma.reminder.createMany({
        data: data.reminders.map((reminder) => ({
          billId: bill.id,
          daysBefore: reminder.daysBefore,
        })),
      });
    }

    // Получаем созданный счет со всеми связанными данными
    const createdBill = await prisma.bill.findUnique({
      where: { id: bill.id },
      include: {
        category: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        reminders: true,
      },
    });

    return NextResponse.json(createdBill, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании счета' },
      { status: 500 }
    );
  }
}