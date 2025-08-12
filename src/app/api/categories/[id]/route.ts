import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional().default('#FFFFFF'),
});

async function checkCategoryAccess(categoryId: string, workspaceId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, workspaceId },
  });
  return !!category;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const workspaceId = session.user.workspaceId!;

  if (!await checkCategoryAccess(params.id, workspaceId)) {
    return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 });
  }

  const category = await prisma.category.findUnique({ where: { id: params.id } });
  return NextResponse.json(category);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const workspaceId = session.user.workspaceId!;
  const body = await request.json();

  const validation = categoryUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  if (!await checkCategoryAccess(params.id, workspaceId)) {
    return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 });
  }

  try {
    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: validation.data,
    });
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const workspaceId = session.user.workspaceId!;

  if (!await checkCategoryAccess(params.id, workspaceId)) {
    return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 });
  }

  try {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}