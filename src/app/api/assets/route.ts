import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assetSchema = z.object({
  name: z.string().min(1, 'Название обязательно для заполнения'),
  purchaseDate: z.string().datetime('Неверный формат даты'),
  initialValue: z.number().positive('Стоимость должна быть положительным числом'),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const assets = await prisma.asset.findMany({
    where: {
      workspaceId: session.user.workspaceId!,
    },
    orderBy: {
      purchaseDate: 'desc',
    },
  });

  return NextResponse.json(assets);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const validation = assetSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  const newAsset = await prisma.asset.create({
    data: {
      ...validation.data,
      workspaceId: session.user.workspaceId!,
    },
  });

  return NextResponse.json(newAsset, { status: 201 });
}