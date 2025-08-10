import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для добавления участника
const addMemberSchema = z.object({
  email: z.string().email('Некорректный email'),
  role: z.enum(['MEMBER', 'ADMIN', 'ACCOUNTANT']),
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

// GET - получение списка участников команды
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

    // Получаем список участников команды
    const members = await prisma.teamMember.findMany({
      where: {
        teamId,
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
      orderBy: [
        {
          role: 'asc', // Сначала OWNER, затем ADMIN, затем остальные
        },
        {
          user: {
            name: 'asc',
          },
        },
      ],
    });

    // Получаем список приглашений в команду
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
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
    });

    return NextResponse.json({ members, invitations });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении участников команды' },
      { status: 500 }
    );
  }
}

// POST - добавление нового участника в команду
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
    const teamId = params.id;
    const body = await request.json();

    // Проверяем доступ к команде (только владелец и администраторы могут добавлять участников)
    const accessCheck = await checkTeamAccess(teamId, userId, ['OWNER', 'ADMIN']);
    if (!accessCheck.access) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    // Валидация входных данных
    const validationResult = addMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      // Проверяем, не является ли пользователь уже участником команды
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: existingUser.id,
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'Пользователь уже является участником команды' },
          { status: 400 }
        );
      }

      // Если пользователь существует, добавляем его в команду
      const member = await prisma.teamMember.create({
        data: {
          teamId,
          userId: existingUser.id,
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

      return NextResponse.json(member, { status: 201 });
    } else {
      // Проверяем, не существует ли уже приглашение для этого email
      const existingInvitation = await prisma.teamInvitation.findFirst({
        where: {
          teamId,
          email: data.email,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        return NextResponse.json(
          { error: 'Приглашение для этого email уже отправлено' },
          { status: 400 }
        );
      }

      // Если пользователь не существует, создаем приглашение
      const invitation = await prisma.teamInvitation.create({
        data: {
          teamId,
          email: data.email,
          role: data.role,
          invitedById: userId,
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
      });

      // Здесь можно добавить логику отправки email-уведомления о приглашении

      return NextResponse.json(
        { invitation, message: 'Приглашение отправлено' },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении участника команды' },
      { status: 500 }
    );
  }
}