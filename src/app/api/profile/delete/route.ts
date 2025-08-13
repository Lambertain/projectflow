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

    // Проверяем, является ли пользователь владельцем workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (workspace) {
      return NextResponse.json(
        { 
          error: 'Вы являетесь владельцем workspace. Передайте права владения перед удалением аккаунта.',
        },
        { status: 400 }
      );
    }

    // Начинаем транзакцию для удаления всех связанных данных
    await prisma.$transaction(async (tx) => {
      // Удаляем все транзакции пользователя
      await tx.transaction.deleteMany({
        where: {
          workspace: {
            users: {
              some: {
                id: userId,
              },
            },
          },
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