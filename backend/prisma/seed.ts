import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma';
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

async function main() {
  console.log('🗑️  Clearing all database records...');

  // Delete in order to respect foreign key constraints
  // 1. Delete Attendance records
  const attendanceCount = await prisma.attendance.deleteMany({});
  console.log(`   ✅ Deleted ${attendanceCount.count} attendance records`);

  // 2. Delete Applications
  const applicationCount = await prisma.application.deleteMany({});
  console.log(`   ✅ Deleted ${applicationCount.count} applications`);

  // 3. Delete Notifications
  const notificationCount = await prisma.notification.deleteMany({});
  console.log(`   ✅ Deleted ${notificationCount.count} notifications`);

  // 4. Delete Activities
  const activityCount = await prisma.activity.deleteMany({});
  console.log(`   ✅ Deleted ${activityCount.count} activities`);

  // 5. Delete Admin profiles (will cascade delete users)
  const adminCount = await prisma.admin.deleteMany({});
  console.log(`   ✅ Deleted ${adminCount.count} admin profiles`);

  // 6. Delete Coordinator profiles (will cascade delete users)
  const coordinatorCount = await prisma.coordinator.deleteMany({});
  console.log(`   ✅ Deleted ${coordinatorCount.count} coordinator profiles`);

  // 7. Delete all remaining Users (those without admin/coordinator profiles)
  const userCount = await prisma.user.deleteMany({});
  console.log(`   ✅ Deleted ${userCount.count} users`);

  console.log('\n🌱 Creating admin user...');

  // Create admin user with admin profile
  const securePassword = 'Jamiila@JU2024Secure!';
  const adminPassword = await bcrypt.hash(securePassword, 10);
  const admin = await prisma.user.create({
    data: {
      name: 'ENG-jamiila',
      email: 'jamiila@gmail.com', // Normalized to lowercase
      passwordHash: adminPassword,
      role: 'admin',
      department: 'Systems',
      joinedAt: new Date('2019-11-02'),
      status: 'active',
      emailVerified: true,
      passwordVersion: 1,
      adminProfile: {
        create: {
          permissions: JSON.stringify(['*']), // Full permissions
          accessLevel: 'full',
        },
      },
    },
    include: {
      adminProfile: true,
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   📧 Email: ${admin.email}`);
  console.log(`   🔑 Password: ${securePassword}`);
  console.log(`   👤 Name: ${admin.name}`);
  console.log(`   🏢 Department: ${admin.department}`);
  console.log(`   🔐 Role: ${admin.role}`);
  console.log(`   📅 Joined: ${admin.joinedAt?.toLocaleDateString()}`);

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

