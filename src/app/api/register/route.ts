import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and workspace in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user first without workspace
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'OWNER',
        },
      });

      // Create workspace for the user
      const workspace = await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          ownerId: newUser.id,
          users: {
            connect: { id: newUser.id },
          },
          categories: {
            createMany: {
              data: [
                { name: 'General', color: '#6B7280' },
                { name: 'Marketing', color: '#EF4444' },
                { name: 'Development', color: '#3B82F6' },
                { name: 'Operations', color: '#10B981' },
              ],
            },
          },
        },
      });

      // Update user with workspace ID
      const updatedUser = await tx.user.update({
        where: { id: newUser.id },
        data: { workspaceId: workspace.id },
      });

      return updatedUser;
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { user: userWithoutPassword, message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}