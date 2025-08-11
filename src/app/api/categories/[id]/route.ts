import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for updating a category
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// PUT - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const { id } = params;
  const body = await request.json();

  const validation = categorySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  try {
    // Check for duplicate name if name is being changed
    if (validation.data.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: validation.data.name,
          workspaceId,
          id: { not: id }, // Exclude the current category from the check
        },
      });
      if (existingCategory) {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
      }
    }

    const updatedCategory = await prisma.category.updateMany({
      where: {
        id,
        workspaceId,
      },
      data: validation.data,
    });

    if (updatedCategory.count === 0) {
      return NextResponse.json({ error: 'Category not found or you do not have access' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const { id } = params;

  try {
    // Note: Deleting a category will set the categoryId on related transactions to null
    // due to the `onDelete: SetNull` rule in the schema.
    const deleteResult = await prisma.category.deleteMany({
      where: {
        id,
        workspaceId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Category not found or you do not have access' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
