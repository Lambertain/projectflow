import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для создания команды
const teamSchema = z.object({
  name: z.string().min(1, 'Название команды обязательно'),
  description: z.string().optional(),
  members: z
    .array(
      z.object({
        email: z.string().email('Некорректный email'),
        role: z.enum(['MEMBER', 'ADMIN', 'ACCOUNTANT']),
      })
    )
    .optional(),
});

// GET - получение списка команд пользователя
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

    // Получаем команды, в которых пользователь является участником
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
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
        _count: {
          select: {
            bills: true,
          },
        },
      },
    });

    // Получаем приглашения в команды для пользователя
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        email: session.user.email,
        status: 'PENDING',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
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

    return NextResponse.json({ teams, invitations });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении команд' },
      { status: 500 }
    );
  }
}

// POST - создание новой команды
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
    const validationResult = teamSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Создаем команду в базе данных
    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description || '',
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
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

    // Отправляем приглашения участникам, если они указаны
    if (data.members && data.members.length > 0) {
      const invitations = [];

      for (const member of data.members) {
        // Проверяем, существует ли пользователь с таким email
        const existingUser = await prisma.user.findUnique({
          where: { email: member.email },
        });

        if (existingUser) {
          // Если пользователь существует, добавляем его в команду
          await prisma.teamMember.create({
            data: {
              teamId: team.id,
              userId: existingUser.id,
              role: member.role,
            },
          });
        } else {
          // Если пользователь не существует, создаем приглашение
          const invitation = await prisma.teamInvitation.create({
            data: {
              teamId: team.id,
              email: member.email,
              role: member.role,
              invitedById: userId,
              status: 'PENDING',
            },
          });

          invitations.push(invitation);
        }
      }

      // Здесь можно добавить логику отправки email-уведомлений о приглашении
    }

    // Получаем обновленную команду со всеми участниками
    const updatedTeam = await prisma.team.findUnique({
      where: { id: team.id },
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

    return NextResponse.json(updatedTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании команды' },
      { status: 500 }
    );
  }
}