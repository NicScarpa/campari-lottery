import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt'; // Importante per la sicurezza

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Pulizia opzionale (se vuoi resettare tutto scommenta la riga sotto)
  // await prisma.staffUser.deleteMany();

  // 2. Creazione Utenti Staff & Admin
  const passwordAdmin = await bcrypt.hash('admin123', 10); // Password: admin123
  const passwordStaff = await bcrypt.hash('barista123', 10); // Password: barista123

  const admin = await prisma.staffUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      display_name: 'Super Admin',
      role: 'ADMIN',
      password_hash: passwordAdmin
    }
  });

  const staff = await prisma.staffUser.upsert({
    where: { username: 'barista' },
    update: {},
    create: {
      username: 'barista',
      display_name: 'Mario Rossi',
      role: 'STAFF',
      password_hash: passwordStaff
    }
  });

  console.log(`👤 Utenti creati: Admin (pass: admin123), Barista (pass: barista123)`);

  // 3. Creazione Promozione (Se non esiste già)
  const promo = await prisma.promotion.create({
    data: {
      name: 'Campari Soda Party',
      start_datetime: new Date(),
      end_datetime: new Date(new Date().setDate(new Date().getDate() + 30)),
      planned_token_count: 100,
      status: 'ACTIVE'
    }
  });
  
  // ... crea premi e token come prima se vuoi ...
  
  console.log(`✅ Seed completato!`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());