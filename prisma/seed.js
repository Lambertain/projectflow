const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a default workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Default Workspace',
      owner: {
        create: {
          email: 'admin@projectflow.com',
          name: 'Admin User',
          password: await bcrypt.hash('admin123', 10),
          role: 'OWNER',
        },
      },
    },
    include: {
      owner: true,
    },
  });

  console.log('Created workspace:', workspace);

  // Create some default categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Marketing',
        color: '#FF6B6B',
        workspaceId: workspace.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Development',
        color: '#4ECDC4',
        workspaceId: workspace.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Operations',
        color: '#45B7D1',
        workspaceId: workspace.id,
      },
    }),
  ]);

  console.log('Created categories:', categories);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });