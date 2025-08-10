import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления команды
const updateTeamSchema = z.object({
  name: z.string().min(1, 'Название команды обязательно').optional(),
  description: z.string().optional(),
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
    include: {
      team: true,
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

    // Проверяем, является ли пользователь участником команды
    const isMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (isMember) {
      return {
        access: false,
        error: 'У вас недостаточно прав для этого действия',
        status: 403,
      };
    }

    return {
      access: false,
      error: 'У вас нет доступа к этой команде',
      status: 403,
    };
  }

  return { access: true, team: teamMember.team };
}

// GET - получение информации о конкретной команде
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
    const teamId = params.id;

    // Проверяем, является ли пользователь участником команды
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этой команде' },
        { status: 403 }
      );
    }

    // Получаем полную информацию о команде
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
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
        },
        bills: {
          where: {
            isPaid: false,
          },
          orderBy: {
            dueDate: 'asc',
          },
          take: 5,
        },
        invitations: {
          where: {
            status: 'PENDING',
          },
          include: {
            invitedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Команда не найдена' },
        { status: 404 }
      );
    }

    // Получаем статистику по счетам команды
    const billsStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN "isPaid" = true THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN "isPaid" = false THEN 1 ELSE 0 END) as unpaid,
        SUM(CASE WHEN "isPaid" = false AND "dueDate" < NOW() THEN 1 ELSE 0 END) as overdue,
        SUM(amount) as totalAmount,
        SUM(CASE WHEN "isPaid" = true THEN amount ELSE 0 END) as paidAmount,
        SUM(CASE WHEN "isPaid" = false THEN amount ELSE 0 END) as unpaidAmount
      FROM "Bill"
      WHERE "teamId" = ${teamId}
    `;

    return NextResponse.json({ team, billsStats: billsStats[0] });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации о команде' },
      { status: 500 }
    );
  }
}

// PATCH - обновление команды
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
    const teamId = params.id;
    const body = await request.json();

    // Проверяем доступ к команде (только владелец и администраторы могут обновлять)
    const accessCheck = await checkTeamAccess(teamId, userId, ['OWNER', 'ADMIN']);
    if (!accessCheck.access) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    // Валидация входных данных
    const validationResult = updateTeamSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Обновляем команду в базе данных
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении команды' },
      { status: 500 }
    );
  }
}

// DELETE - удаление команды
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
    const teamId = params.id;

    // Проверяем, является ли пользователь владельцем команды
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: 'OWNER',
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Только владелец команды может удалить её' },
        { status: 403 }
      );
    }

    // Удаляем все приглашения в команду
    await prisma.teamInvitation.deleteMany({
      where: { teamId },
    });

    // Удаляем все напоминания для счетов команды
    await prisma.$executeRaw`
      DELETE FROM "Reminder"
      WHERE "billId" IN (SELECT id FROM "Bill" WHERE "teamId" = ${teamId})
    `;

    // Удаляем все уведомления для счетов команды
    await prisma.notification.deleteMany({
      where: { teamId },
    });

    // Удаляем все счета команды
    await prisma.bill.deleteMany({
      where: { teamId },
    });

    // Удаляем всех участников команды
    await prisma.teamMember.deleteMany({
      where: { teamId },
    });

    // Удаляем команду
    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении команды' },
      { status: 500 }
    );
  }
}