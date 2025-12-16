import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Crea l'Admin
  const adminPassword = await bcrypt.hash('Campari2025!', 10);
  
  const admin = await prisma.staffUser.upsert({
    where: { username: 'admin' },
    update: {}, // Se esiste già, non fare nulla
    create: {
      username: 'admin',
      password_hash: adminPassword,
      role: 'admin',
      // Rimosso display_name che causava l'errore
    },
  });

  console.log({ admin });

  // 2. Crea gli utenti Staff
  const staffUsers = [
    { username: 'Brian', password: 'MonferoneBrian' },
    { username: 'Andrea', password: 'SegattoAndrea' },
    { username: 'Matteo', password: 'MomessoMatteo' },
    { username: 'Silvia', password: 'CarnielloSilvia' },
    { username: 'Veronica', password: 'PaieroVeronica' },
    { username: 'Nicola', password: 'ScarpaNicola' },
    { username: 'Simone', password: 'MilaneseSimone' },
  ];

  for (const user of staffUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const staffUser = await prisma.staffUser.upsert({
      where: { username: user.username },
      update: { password_hash: passwordHash },
      create: {
        username: user.username,
        password_hash: passwordHash,
        role: 'staff',
      },
    });
    console.log(`Staff created: ${staffUser.username}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });