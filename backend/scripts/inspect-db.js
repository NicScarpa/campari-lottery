const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
  console.log('=== INSPECTING DATABASE ===\n');

  // Check StaffUser table (we know it has data from seed)
  const staffUsers = await prisma.staffUser.findMany();
  console.log('StaffUser count:', staffUsers.length);
  console.log('StaffUser data:', JSON.stringify(staffUsers, null, 2));

  console.log('\n---\n');

  // Check the actual schema using raw SQL
  const tables = await prisma.$queryRaw`
    SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;
  `;

  console.log('All tables in database:');
  console.log(JSON.stringify(tables, null, 2));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
