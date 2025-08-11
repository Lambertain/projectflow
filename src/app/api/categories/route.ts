import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating/updating a category
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional().default('#FFFFFF'),
});

// GET - Fetch all categories for the workspace
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;

  try {
    const categories = await prisma.category.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const body = await request.json();

  const validation = categorySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  try {
    // Check for duplicate category name within the same workspace
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: validation.data.name,
        workspaceId,
      },
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: validation.data.name,
        color: validation.data.color,
        workspaceId,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
