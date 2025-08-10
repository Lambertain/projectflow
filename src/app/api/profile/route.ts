import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления профиля
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').optional(),
  email: z.string().email('Некорректный email').optional(),
  phone: z.string().optional().nullable(),
  notificationSettings: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
  }).optional(),
});

// GET - получение профиля пользователя
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

    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        notificationSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Получаем статистику пользователя
    const billsCount = await prisma.bill.count({
      where: {
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
      },
    });

    const teamsCount = await prisma.teamMember.count({
      where: {
        userId,
      },
    });

    const categoriesCount = await prisma.category.count({
      where: {
        userId,
      },
    });

    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return NextResponse.json({
      ...user,
      stats: {
        billsCount,
        teamsCount,
        categoriesCount,
        unreadNotificationsCount,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении профиля' },
      { status: 500 }
    );
  }
}

// PATCH - обновление профиля пользователя
export async function PATCH(request: NextRequest) {
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
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Проверяем, не занят ли email другим пользователем
    if (data.email && data.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: 'Email уже используется другим пользователем' },
          { status: 400 }
        );
      }
    }

    // Обновляем профиль пользователя
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        notificationSettings: data.notificationSettings
          ? {
              update: data.notificationSettings,
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        notificationSettings: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении профиля' },
      { status: 500 }
    );
  }
}