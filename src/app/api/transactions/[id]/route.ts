import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema for updating a transaction's main details
const updateTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().min(1, 'Currency is required').optional(),
  date: z.string().datetime('Invalid date format').optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

// Schema for updating only the approval status
const updateApprovalSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
});

// GET - Fetch a single transaction
export async function GET(
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
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        category: true,
        project: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a transaction's details
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

  const validation = updateTransactionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  try {
    // First, verify the transaction exists and belongs to the workspace
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, workspaceId },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id,
      },
      data: validation.data,
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a transaction's approval status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { workspaceId, id: userId, role } = session.user;
  const { id: transactionId } = params;
  const body = await request.json();

  // Only admins or owners can approve/reject
  if (role !== 'ADMIN' && role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validation = updateApprovalSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  const { approvalStatus } = validation.data;

  try {
    // Verify the transaction exists in the workspace before updating
    const transactionToUpdate = await prisma.transaction.findFirst({
        where: { id: transactionId, workspaceId }
    });

    if (!transactionToUpdate) {
        return NextResponse.json({ error: 'Transaction not found or not in your workspace' }, { status: 404 });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        approvalStatus,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// DELETE - Delete a transaction
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
    // Use deleteMany to ensure both id and workspaceId match.
    // This is a robust way to prevent deleting items from other workspaces.
    const deleteResult = await prisma.transaction.deleteMany({
      where: {
        id,
        workspaceId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Transaction not found or you do not have access' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
