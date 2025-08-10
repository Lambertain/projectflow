import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для создания категории
const categorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Некорректный формат цвета').optional(),
  icon: z.string().optional(),
});

// GET - получение списка категорий пользователя
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

    // Получаем категории пользователя и системные категории
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { isSystem: true },
        ],
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении категорий' },
      { status: 500 }
    );
  }
}

// POST - создание новой категории
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
    const validationResult = categorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Проверяем, не существует ли уже категория с таким названием у пользователя
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: data.name,
        userId,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Категория с таким названием уже существует' },
        { status: 400 }
      );
    }

    // Создаем категорию в базе данных
    const category = await prisma.category.create({
      data: {
        name: data.name,
        color: data.color || '#6366F1', // Значение по умолчанию, если цвет не указан
        icon: data.icon || 'tag',
        userId,
        isSystem: false,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании категории' },
      { status: 500 }
    );
  }
}