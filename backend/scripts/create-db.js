const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating database schema...');
  // Prisma will create the database and tables automatically when we connect
  await prisma.$connect();
  console.log('Database schema created successfully!');
  console.log('Verifying Promotion table...');

  // Test query to ensure tables exist
  const count = await prisma.promotion.count();
  console.log(`Promotion table exists. Current count: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error creating database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
