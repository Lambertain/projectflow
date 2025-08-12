import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const invitationUpdateSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']).optional(),
  role: z.enum(['MEMBER', 'ADMIN', 'ACCOUNTANT']).optional(),
});

async function checkInvitationAccess(invitationId: string, userEmail: string) {
  const invitation = await prisma.teamInvitation.findFirst({
    where: { id: invitationId, email: userEmail },
  });
  return !!invitation;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userEmail = session.user.email!;

  if (!await checkInvitationAccess(params.id, userEmail)) {
    return NextResponse.json({ error: 'Invitation not found or access denied' }, { status: 404 });
  }

  const invitation = await prisma.teamInvitation.findUnique({ 
    where: { id: params.id },
    include: {
      team: { select: { name: true } },
      invitedBy: { select: { name: true, email: true } }
    }
  });
  return NextResponse.json(invitation);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userEmail = session.user.email!;
  const body = await request.json();

  const validation = invitationUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
  }

  if (!await checkInvitationAccess(params.id, userEmail)) {
    return NextResponse.json({ error: 'Invitation not found or access denied' }, { status: 404 });
  }

  try {
    const updatedInvitation = await prisma.teamInvitation.update({
      where: { id: params.id },
      data: validation.data,
    });
    return NextResponse.json(updatedInvitation);
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userEmail = session.user.email!;

  if (!await checkInvitationAccess(params.id, userEmail)) {
    return NextResponse.json({ error: 'Invitation not found or access denied' }, { status: 404 });
  }

  try {
    await prisma.teamInvitation.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}