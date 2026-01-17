import { config } from 'dotenv';
import { PrismaClient } from './generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.CHECK_EMAIL || 'jamiila@gmail.com').trim();
  const passwordToCheck = process.env.CHECK_PASSWORD;

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { adminProfile: true },
  });

  if (!user) {
    console.log(`❌ No user found for email: ${email}`);
    process.exitCode = 1;
    return;
  }

  const passwordMatches =
    typeof passwordToCheck === 'string'
      ? await bcrypt.compare(passwordToCheck, user.passwordHash)
      : null;

  console.log('✅ User found');
  console.log(`   📧 Email: ${user.email}`);
  console.log(`   👤 Name: ${user.name}`);
  console.log(`   🔐 Role: ${user.role}`);
  console.log(`   📊 Status: ${user.status}`);
  console.log(`   ✉️  Email Verified: ${user.emailVerified}`);
  console.log(`   🛡️  Has Admin Profile: ${Boolean(user.adminProfile)}`);
  if (passwordMatches !== null) {
    console.log(`   🔑 Password matches CHECK_PASSWORD: ${passwordMatches}`);
  } else {
    console.log('   ℹ️  Set CHECK_PASSWORD to validate password hash');
  }
}

main()
  .catch((e) => {
    console.error('❌ Check failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
