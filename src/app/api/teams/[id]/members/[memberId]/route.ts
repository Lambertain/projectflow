import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления роли участника
const updateMemberSchema = z.object({
  role: z.enum(['MEMBER', 'ADMIN', 'ACCOUNTANT', 'OWNER']),
});

// Проверка доступа пользователя к команде
async function checkTeamAccess(teamId: string, userId: string, requiredRoles: string[] = ['OWNER', 'ADMIN']) {
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      role: {
        in: requiredRoles,
      },
    },
  });

  if (!teamMember) {
    // Проверяем, существует ли команда вообще
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return { access: false, error: 'Команда не найдена', status: 404 };
    }

    return {
      access: false,
      error: 'У вас недостаточно прав для этого действия',
      status: 403,
    };
  }

  return { access: true, teamMember };
}

// GET - получение информации о конкретном участнике команды
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const teamId = params.id;
    const memberId = params.memberId;

    // Проверяем, является ли пользователь участником команды
    const userTeamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!userTeamMember) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этой команде' },
        { status: 403 }
      );
    }

    // Получаем информацию о запрашиваемом участнике
    const member = await prisma.teamMember.findUnique({
      where: {
        id: memberId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!member || member.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Участник не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации об участнике' },
      { status: 500 }
    );
  }
}

// PATCH - обновление роли участника
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const teamId = params.id;
    const memberId = params.memberId;
    const body = await request.json();

    // Проверяем доступ к команде (только владелец может менять роли)
    const accessCheck = await checkTeamAccess(teamId, userId, ['OWNER']);
    if (!accessCheck.access) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    // Валидация входных данных
    const validationResult = updateMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Получаем информацию о участнике, которого хотим обновить
    const member = await prisma.teamMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!member || member.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Участник не найден' },
        { status: 404 }
      );
    }

    // Если меняем роль на OWNER, то текущий владелец должен стать ADMIN
    if (data.role === 'OWNER') {
      // Находим текущего владельца
      const currentOwner = await prisma.teamMember.findFirst({
        where: {
          teamId,
          role: 'OWNER',
        },
      });

      if (currentOwner && currentOwner.id !== memberId) {
        // Меняем роль текущего владельца на ADMIN
        await prisma.teamMember.update({
          where: {
            id: currentOwner.id,
          },
          data: {
            role: 'ADMIN',
          },
        });
      }
    }

    // Обновляем роль участника
    const updatedMember = await prisma.teamMember.update({
      where: {
        id: memberId,
      },
      data: {
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении роли участника' },
      { status: 500 }
    );
  }
}

// DELETE - удаление участника из команды
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const teamId = params.id;
    const memberId = params.memberId;

    // Получаем информацию о участнике, которого хотим удалить
    const member = await prisma.teamMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!member || member.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Участник не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не пытается ли пользователь удалить владельца команды
    if (member.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Невозможно удалить владельца команды' },
        { status: 400 }
      );
    }

    // Проверяем права доступа:
    // 1. Владелец и администраторы могут удалять участников
    // 2. Участник может удалить сам себя
    const isAdmin = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    const isSelf = member.userId === userId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'У вас нет прав на удаление этого участника' },
        { status: 403 }
      );
    }

    // Удаляем участника из команды
    await prisma.teamMember.delete({
      where: {
        id: memberId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении участника команды' },
      { status: 500 }
    );
  }
}