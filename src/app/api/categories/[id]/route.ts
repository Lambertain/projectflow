import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления категории
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Название категории обязательно').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Некорректный формат цвета').optional(),
  icon: z.string().optional(),
});

// GET - получение информации о конкретной категории
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
    const categoryId = params.id;

    // Получаем информацию о категории
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, имеет ли пользователь доступ к категории
    if (!category.isSystem && category.userId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этой категории' },
        { status: 403 }
      );
    }

    // Получаем количество счетов в категории
    const billsCount = await prisma.bill.count({
      where: {
        categoryId,
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

    return NextResponse.json({ ...category, billsCount });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации о категории' },
      { status: 500 }
    );
  }
}

// PATCH - обновление категории
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
    const categoryId = params.id;
    const body = await request.json();

    // Получаем информацию о категории
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, имеет ли пользователь доступ к категории
    if (category.userId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этой категории' },
        { status: 403 }
      );
    }

    // Проверяем, не является ли категория системной
    if (category.isSystem) {
      return NextResponse.json(
        { error: 'Невозможно изменить системную категорию' },
        { status: 400 }
      );
    }

    // Валидация входных данных
    const validationResult = updateCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Проверяем, не существует ли уже категория с таким названием у пользователя
    if (data.name && data.name !== category.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: data.name,
          userId,
          id: { not: categoryId },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'Категория с таким названием уже существует' },
          { status: 400 }
        );
      }
    }

    // Обновляем категорию в базе данных
    const updatedCategory = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        name: data.name,
        color: data.color,
        icon: data.icon,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении категории' },
      { status: 500 }
    );
  }
}

// DELETE - удаление категории
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
    const categoryId = params.id;

    // Получаем информацию о категории
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, имеет ли пользователь доступ к категории
    if (category.userId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этой категории' },
        { status: 403 }
      );
    }

    // Проверяем, не является ли категория системной
    if (category.isSystem) {
      return NextResponse.json(
        { error: 'Невозможно удалить системную категорию' },
        { status: 400 }
      );
    }

    // Проверяем, используется ли категория в счетах
    const billsCount = await prisma.bill.count({
      where: {
        categoryId,
      },
    });

    if (billsCount > 0) {
      return NextResponse.json(
        { error: 'Невозможно удалить категорию, которая используется в счетах' },
        { status: 400 }
      );
    }

    // Удаляем категорию
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении категории' },
      { status: 500 }
    );
  }
}