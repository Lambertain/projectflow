import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const assetUpdateSchema = z.object({
  name: z.string().min(1, 'Название обязательно для заполнения').optional(),
  purchaseDate: z.string().datetime('Неверный формат даты').optional(),
  initialValue: z.number().positive('Стоимость должна быть положительным числом').optional(),
});

async function checkAssetAccess(assetId: string, workspaceId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, workspaceId },
  });
  return !!asset;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!await checkAssetAccess(params.id, session.user.workspaceId)) {
    return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 });
  }

  const asset = await prisma.asset.findUnique({ where: { id: params.id } });
  return NextResponse.json(asset);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!await checkAssetAccess(params.id, session.user.workspaceId)) {
    return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 });
  }

  const body = await request.json();
  const validation = assetUpdateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  const updatedAsset = await prisma.asset.update({
    where: { id: params.id },
    data: validation.data,
  });

  return NextResponse.json(updatedAsset);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!await checkAssetAccess(params.id, session.user.workspaceId)) {
    return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 });
  }

  await prisma.asset.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
