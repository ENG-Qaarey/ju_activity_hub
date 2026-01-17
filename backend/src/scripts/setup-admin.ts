import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setupAdmin() {
  const email = 'jamiila@gmail.com';
  const name = 'ENG-jamiila';
  const securePassword = 'Jamiila@JU2024Secure!';
  
  console.log(`🔍 Checking for admin user: ${email}...`);

  // Normalize email to lowercase for lookup
  const normalizedEmail = email.toLowerCase();

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
    include: {
      adminProfile: true,
    },
  });

  if (existingUser) {
    console.log(`✅ User already exists in database`);
    console.log(`   📧 Email: ${existingUser.email}`);
    console.log(`   👤 Name: ${existingUser.name}`);
    console.log(`   🔐 Role: ${existingUser.role}`);
    console.log(`   📊 Status: ${existingUser.status}`);

    // Update password and ensure admin profile exists
    const passwordHash = await bcrypt.hash(securePassword, 10);
    
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: normalizedEmail, // Ensure lowercase
        name: name,
        passwordHash: passwordHash,
        passwordVersion: existingUser.passwordVersion + 1,
        status: 'active',
        emailVerified: true,
        role: 'admin',
        adminProfile: existingUser.adminProfile ? undefined : {
          create: {
            permissions: JSON.stringify(['*']),
            accessLevel: 'full',
          },
        },
      },
    });

    // Ensure admin profile exists if it doesn't
    if (!existingUser.adminProfile) {
      await prisma.admin.create({
        data: {
          userId: existingUser.id,
          permissions: JSON.stringify(['*']),
          accessLevel: 'full',
        },
      });
      console.log(`   ✅ Admin profile created`);
    }

    console.log(`\n✅ Admin user updated successfully!`);
    console.log(`   📧 Email: ${normalizedEmail}`);
    console.log(`   🔑 Password: ${securePassword}`);
    console.log(`   👤 Role: admin`);
  } else {
    console.log(`👤 Creating new admin user...`);
    
    const passwordHash = await bcrypt.hash(securePassword, 10);
    
    const admin = await prisma.user.create({
      data: {
        name: name,
        email: normalizedEmail,
        passwordHash: passwordHash,
        role: 'admin',
        department: 'Systems',
        joinedAt: new Date('2019-11-02'),
        status: 'active',
        emailVerified: true,
        passwordVersion: 1,
        adminProfile: {
          create: {
            permissions: JSON.stringify(['*']),
            accessLevel: 'full',
          },
        },
      },
      include: {
        adminProfile: true,
      },
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   🔑 Password: ${securePassword}`);
    console.log(`   👤 Name: ${admin.name}`);
    console.log(`   🔐 Role: ${admin.role}`);
  }

  await prisma.$disconnect();
}

setupAdmin()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

