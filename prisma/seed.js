const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Проверяем, существует ли уже пользователь с таким email
  const existingUser = await prisma.user.findUnique({
    where: {
      email: 'test@example.com',
    },
  });

  if (!existingUser) {
    // Создаем тестового пользователя
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });
    
    console.log(`Created test user with id: ${user.id}`);
  } else {
    console.log('Test user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });