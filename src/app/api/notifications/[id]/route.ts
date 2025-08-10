import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - получение информации о конкретном уведомлении
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
    const notificationId = params.id;

    // Получаем информацию о уведомлении
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
      include: {
        bill: {
          select: {
            id: true,
            name: true,
            amount: true,
            dueDate: true,
            categoryId: true,
            category: {
              select: {
                name: true,
                color: true,
                icon: true,
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Уведомление не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, принадлежит ли уведомление пользователю
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому уведомлению' },
        { status: 403 }
      );
    }

    // Если уведомление не прочитано, помечаем его как прочитанное
    if (!notification.read) {
      await prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          read: true,
        },
      });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации о уведомлении' },
      { status: 500 }
    );
  }
}

// PATCH - обновление статуса прочтения уведомления
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
    const notificationId = params.id;
    const body = await request.json();

    // Проверяем наличие поля read в теле запроса
    if (body.read === undefined) {
      return NextResponse.json(
        { error: 'Необходимо указать статус прочтения (read)' },
        { status: 400 }
      );
    }

    // Получаем информацию о уведомлении
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Уведомление не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, принадлежит ли уведомление пользователю
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому уведомлению' },
        { status: 403 }
      );
    }

    // Обновляем статус прочтения уведомления
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: body.read,
      },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении уведомления' },
      { status: 500 }
    );
  }
}

// DELETE - удаление уведомления
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
    const notificationId = params.id;

    // Получаем информацию о уведомлении
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Уведомление не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, принадлежит ли уведомление пользователю
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому уведомлению' },
        { status: 403 }
      );
    }

    // Удаляем уведомление
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении уведомления' },
      { status: 500 }
    );
  }
}