import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - получение уведомлений пользователя
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
    const { searchParams } = new URL(request.url);
    
    // Параметры пагинации
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Параметр для фильтрации по прочитанным/непрочитанным
    const readParam = searchParams.get('read');
    const read = readParam ? readParam === 'true' : undefined;
    
    // Получаем уведомления пользователя
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(read !== undefined ? { read } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        bill: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Получаем общее количество уведомлений для пагинации
    const total = await prisma.notification.count({
      where: {
        userId,
        ...(read !== undefined ? { read } : {}),
      },
    });

    // Получаем количество непрочитанных уведомлений
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении уведомлений' },
      { status: 500 }
    );
  }
}

// PATCH - обновление статуса прочтения уведомлений
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
    
    // Проверяем наличие необходимых полей
    if (!body.ids && body.markAllAsRead === undefined) {
      return NextResponse.json(
        { error: 'Необходимо указать ids или markAllAsRead' },
        { status: 400 }
      );
    }

    // Если указан markAllAsRead, обновляем все уведомления пользователя
    if (body.markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({ success: true });
    }

    // Если указаны ids, обновляем только указанные уведомления
    if (body.ids && Array.isArray(body.ids)) {
      // Проверяем, что все указанные уведомления принадлежат пользователю
      const notifications = await prisma.notification.findMany({
        where: {
          id: { in: body.ids },
        },
      });

      const userNotificationIds = notifications
        .filter(notification => notification.userId === userId)
        .map(notification => notification.id);

      if (userNotificationIds.length !== body.ids.length) {
        return NextResponse.json(
          { error: 'Некоторые уведомления не принадлежат пользователю' },
          { status: 403 }
        );
      }

      // Обновляем статус прочтения уведомлений
      await prisma.notification.updateMany({
        where: {
          id: { in: userNotificationIds },
        },
        data: {
          read: body.read !== undefined ? body.read : true,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Некорректные данные' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении уведомлений' },
      { status: 500 }
    );
  }
}

// DELETE - удаление уведомлений
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Проверяем, нужно ли удалить все уведомления
    const deleteAll = searchParams.get('all') === 'true';
    
    if (deleteAll) {
      // Удаляем все уведомления пользователя
      await prisma.notification.deleteMany({
        where: {
          userId,
        },
      });

      return NextResponse.json({ success: true });
    }
    
    // Получаем ids уведомлений для удаления из тела запроса
    const body = await request.json();
    
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать ids уведомлений для удаления' },
        { status: 400 }
      );
    }

    // Проверяем, что все указанные уведомления принадлежат пользователю
    const notifications = await prisma.notification.findMany({
      where: {
        id: { in: body.ids },
      },
    });

    const userNotificationIds = notifications
      .filter(notification => notification.userId === userId)
      .map(notification => notification.id);

    if (userNotificationIds.length !== body.ids.length) {
      return NextResponse.json(
        { error: 'Некоторые уведомления не принадлежат пользователю' },
        { status: 403 }
      );
    }

    // Удаляем указанные уведомления
    await prisma.notification.deleteMany({
      where: {
        id: { in: userNotificationIds },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении уведомлений' },
      { status: 500 }
    );
  }
}