import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления счета
const updateBillSchema = z.object({
  name: z.string().min(1, 'Название счета обязательно').optional(),
  amount: z.number().positive('Сумма должна быть положительным числом').optional(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Некорректная дата',
    })
    .optional(),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z
    .enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
    .optional()
    .nullable(),
  teamId: z.string().optional().nullable(),
  isPaid: z.boolean().optional(),
  paidAt: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Некорректная дата оплаты',
    })
    .optional()
    .nullable(),
  reminders: z
    .array(
      z.object({
        id: z.string().optional(),
        daysBefore: z.number().int().positive(),
      })
    )
    .optional(),
});

// Проверка доступа пользователя к счету
async function checkBillAccess(billId: string, userId: string) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      team: {
        include: {
          members: {
            where: {
              userId,
            },
          },
        },
      },
    },
  });

  if (!bill) {
    return { access: false, error: 'Счет не найден', status: 404 };
  }

  // Проверяем, принадлежит ли счет пользователю или его команде
  const hasAccess =
    bill.userId === userId ||
    (bill.teamId && bill.team?.members.length > 0);

  if (!hasAccess) {
    return {
      access: false,
      error: 'У вас нет доступа к этому счету',
      status: 403,
    };
  }

  return { access: true, bill };
}

// GET - получение информации о конкретном счете
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const billId = params.id;

    // Проверяем доступ к счету
    const accessCheck = await checkBillAccess(billId, userId);
    if (!accessCheck.access) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    // Получаем полную информацию о счете
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        category: true,
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                role: true,
              },
            },
          },
        },
        reminders: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации о счете' },
      { status: 500 }
    );
  }
}

// PATCH - обновление счета
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const billId = params.id;
    const body = await request.json();

    // Проверяем доступ к счету
    const accessCheck = await checkBillAccess(billId, userId);
    if (!accessCheck.access) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    // Валидация входных данных
    const validationResult = updateBillSchema.safeParse(body);
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

    // Подготавливаем данные для обновления
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.dueDate !== undefined)
      updateData.dueDate = new Date(data.dueDate);
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
    if (data.recurringPeriod !== undefined)
      updateData.recurringPeriod = data.recurringPeriod;
    if (data.teamId !== undefined) updateData.teamId = data.teamId;
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
    
    // Если счет отмечен как оплаченный, устанавливаем дату оплаты
    if (data.isPaid === true) {
      updateData.paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
    } else if (data.isPaid === false) {
      updateData.paidAt = null;
    }

    // Обновляем счет в базе данных
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: updateData,
    });

    // Обновляем напоминания, если они указаны
    if (data.reminders && data.reminders.length > 0) {
      // Сначала удаляем существующие напоминания
      await prisma.reminder.deleteMany({
        where: { billId },
      });

      // Затем создаем новые напоминания
      await prisma.reminder.createMany({
        data: data.reminders.map((reminder) => ({
          billId,
          daysBefore: reminder.daysBefore,
        })),
      });
    }

    // Получаем обновленный счет со всеми связанными данными
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
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

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении счета' },
      { status: 500 }
    );
  }
}

// DELETE - удаление счета
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const billId = params.id;

    // Проверяем доступ к счету
    const accessCheck = await checkBillAccess(billId, userId);
    if (!accessCheck.access) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    // Проверяем, является ли пользователь владельцем счета или администратором команды
    const bill = accessCheck.bill;
    
    if (bill.userId !== userId && bill.teamId) {
      // Проверяем роль пользователя в команде
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: bill.teamId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'У вас нет прав на удаление этого счета' },
          { status: 403 }
        );
      }
    }

    // Удаляем связанные напоминания
    await prisma.reminder.deleteMany({
      where: { billId },
    });

    // Удаляем связанные уведомления
    await prisma.notification.deleteMany({
      where: { billId },
    });

    // Удаляем счет
    await prisma.bill.delete({
      where: { id: billId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении счета' },
      { status: 500 }
    );
  }
}