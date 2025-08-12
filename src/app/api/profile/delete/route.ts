import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Схема валидации для удаления аккаунта
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Пароль обязателен'),
  confirmation: z.string().min(1, 'Подтверждение обязательно'),
}).refine(data => data.confirmation === 'DELETE', {
  message: 'Для подтверждения введите DELETE',
  path: ['confirmation'],
});

// POST - удаление аккаунта пользователя
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id!;
    const body = await request.json();

    // Валидация входных данных
    const validationResult = deleteAccountSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем пароль, если у пользователя есть пароль (не OAuth аккаунт)
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Неверный пароль' },
          { status: 400 }
        );
      }
    }

    // Проверяем, является ли пользователь единственным владельцем каких-либо команд
    const ownedTeams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          where: {
            role: 'OWNER',
          },
        },
      },
    });

    const teamsWithSingleOwner = ownedTeams.filter(team => team.members.length === 1);

    if (teamsWithSingleOwner.length > 0) {
      return NextResponse.json(
        { 
          error: 'Вы являетесь единственным владельцем некоторых команд. Передайте права владения или удалите команды перед удалением аккаунта.',
          teams: teamsWithSingleOwner.map(team => ({ id: team.id, name: team.name })),
        },
        { status: 400 }
      );
    }

    // Начинаем транзакцию для удаления всех связанных данных
    await prisma.$transaction(async (tx) => {
      // Удаляем все уведомления пользователя
      await tx.notification.deleteMany({
        where: {
          userId,
        },
      });

      // Удаляем все напоминания пользователя
      await tx.reminder.deleteMany({
        where: {
          userId,
        },
      });

      // Удаляем все приглашения пользователя
      await tx.invitation.deleteMany({
        where: {
          email: session.user.email,
        },
      });

      // Удаляем все категории пользователя
      await tx.category.deleteMany({
        where: {
          userId,
          isSystem: false,
        },
      });

      // Получаем все счета пользователя
      const userBills = await tx.bill.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      });

      const userBillIds = userBills.map(bill => bill.id);

      // Удаляем все напоминания, связанные со счетами пользователя
      await tx.reminder.deleteMany({
        where: {
          billId: {
            in: userBillIds,
          },
        },
      });

      // Удаляем все уведомления, связанные со счетами пользователя
      await tx.notification.deleteMany({
        where: {
          billId: {
            in: userBillIds,
          },
        },
      });

      // Удаляем все счета пользователя
      await tx.bill.deleteMany({
        where: {
          userId,
        },
      });

      // Удаляем пользователя из всех команд
      await tx.teamMember.deleteMany({
        where: {
          userId,
        },
      });

      // Удаляем аккаунт пользователя
      await tx.user.delete({
        where: {
          id: userId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении аккаунта' },
      { status: 500 }
    );
  }
}