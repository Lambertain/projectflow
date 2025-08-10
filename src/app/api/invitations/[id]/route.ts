import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обработки приглашения
const invitationActionSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

// GET - получение информации о приглашении
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

    const invitationId = params.id;

    // Получаем информацию о приглашении
    const invitation = await prisma.teamInvitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Приглашение не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, что приглашение адресовано текущему пользователю
    if (invitation.email !== session.user.email) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому приглашению' },
        { status: 403 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации о приглашении' },
      { status: 500 }
    );
  }
}

// POST - принятие или отклонение приглашения
export async function POST(
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
    const invitationId = params.id;
    const body = await request.json();

    // Валидация входных данных
    const validationResult = invitationActionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Получаем информацию о приглашении
    const invitation = await prisma.teamInvitation.findUnique({
      where: {
        id: invitationId,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Приглашение не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, что приглашение адресовано текущему пользователю
    if (invitation.email !== session.user.email) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому приглашению' },
        { status: 403 }
      );
    }

    // Проверяем, что приглашение еще не обработано
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Приглашение уже обработано' },
        { status: 400 }
      );
    }

    if (data.action === 'accept') {
      // Принимаем приглашение
      
      // Проверяем, не является ли пользователь уже участником команды
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: invitation.teamId,
          userId,
        },
      });

      if (existingMember) {
        // Обновляем статус приглашения
        await prisma.teamInvitation.update({
          where: {
            id: invitationId,
          },
          data: {
            status: 'ACCEPTED',
          },
        });

        return NextResponse.json(
          { error: 'Вы уже являетесь участником этой команды' },
          { status: 400 }
        );
      }

      // Добавляем пользователя в команду
      const member = await prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: invitation.role,
        },
        include: {
          team: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Обновляем статус приглашения
      await prisma.teamInvitation.update({
        where: {
          id: invitationId,
        },
        data: {
          status: 'ACCEPTED',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Приглашение принято',
        member,
      });
    } else {
      // Отклоняем приглашение
      await prisma.teamInvitation.update({
        where: {
          id: invitationId,
        },
        data: {
          status: 'DECLINED',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Приглашение отклонено',
      });
    }
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { error: 'Ошибка при обработке приглашения' },
      { status: 500 }
    );
  }
}

// DELETE - удаление приглашения (отмена)
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
    const invitationId = params.id;

    // Получаем информацию о приглашении
    const invitation = await prisma.teamInvitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Приглашение не найдено' },
        { status: 404 }
      );
    }

    // Проверяем права доступа:
    // 1. Пользователь, который отправил приглашение
    // 2. Пользователь, которому адресовано приглашение
    // 3. Владелец или администратор команды
    const isInviter = invitation.invitedById === userId;
    const isInvitee = invitation.email === session.user.email;
    const isTeamAdmin = invitation.team.members.length > 0;

    if (!isInviter && !isInvitee && !isTeamAdmin) {
      return NextResponse.json(
        { error: 'У вас нет прав на удаление этого приглашения' },
        { status: 403 }
      );
    }

    // Удаляем приглашение
    await prisma.teamInvitation.delete({
      where: {
        id: invitationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении приглашения' },
      { status: 500 }
    );
  }
}