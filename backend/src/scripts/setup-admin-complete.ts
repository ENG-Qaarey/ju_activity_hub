import { config } from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

const email = 'jamiila@gmail.com';
const name = 'ENG-jamiila';
const securePassword = 'Jamiila@JU2024Secure!';
const firstName = 'ENG';
const lastName = 'jamiila';
const role = 'admin';

async function setupAdminComplete() {
  console.log('🚀 Setting up admin user in both Clerk and Prisma...\n');

  // ============================================
  // Step 1: Setup in Prisma Database
  // ============================================
  console.log('📊 Step 1: Setting up in Prisma database...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const normalizedEmail = email.toLowerCase();

    // Check if user exists in Prisma
    const existingPrismaUser = await prisma.user.findFirst({
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

    if (existingPrismaUser) {
      console.log(`✅ User already exists in Prisma database`);
      console.log(`   📧 Email: ${existingPrismaUser.email}`);
      console.log(`   👤 Name: ${existingPrismaUser.name}`);
      console.log(`   🔐 Role: ${existingPrismaUser.role}`);

      // Update password and ensure admin profile exists
      const passwordHash = await bcrypt.hash(securePassword, 10);
      
      await prisma.user.update({
        where: { id: existingPrismaUser.id },
        data: {
          email: normalizedEmail,
          name: name,
          passwordHash: passwordHash,
          passwordVersion: existingPrismaUser.passwordVersion + 1,
          status: 'active',
          emailVerified: true,
          role: 'admin',
          adminProfile: existingPrismaUser.adminProfile ? undefined : {
            create: {
              permissions: JSON.stringify(['*']),
              accessLevel: 'full',
            },
          },
        },
      });

      // Ensure admin profile exists if it doesn't
      if (!existingPrismaUser.adminProfile) {
        await prisma.admin.create({
          data: {
            userId: existingPrismaUser.id,
            permissions: JSON.stringify(['*']),
            accessLevel: 'full',
          },
        });
        console.log(`   ✅ Admin profile created`);
      }

      console.log(`✅ Prisma user updated successfully!\n`);
    } else {
      console.log(`👤 Creating new admin user in Prisma...`);
      
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

      console.log(`✅ Admin user created in Prisma!`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Name: ${admin.name}`);
      console.log(`   🔐 Role: ${admin.role}\n`);
    }
  } catch (error: any) {
    console.error('❌ Error setting up Prisma user:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Database connection failed. Check your DATABASE_URL in .env file.');
      console.error('   Format: postgresql://username:password@host:port/database?schema=public');
    }
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  // ============================================
  // Step 2: Setup in Clerk
  // ============================================
  console.log('🔐 Step 2: Setting up in Clerk...');
  
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('⚠️  CLERK_SECRET_KEY not set. Skipping Clerk setup.');
    console.warn('   User will only exist in Prisma database.');
    return;
  }

  const client = createClerkClient({ secretKey });

  try {
    console.log(`🔍 Checking if user exists in Clerk...`);
    
    // Check if user already exists
    let existingClerkUser: any = null;
    try {
      const users = await client.users.getUserList({ 
        emailAddress: [email.toLowerCase()] 
      });
      
      if (users.data && users.data.length > 0) {
        existingClerkUser = users.data[0];
      }
    } catch (error: any) {
      console.log(`⚠️  Could not check existing users: ${error.message}`);
    }
    
    if (existingClerkUser) {
      const userId = existingClerkUser.id as string;
      console.log(`✅ User already exists in Clerk with ID: ${userId}`);
      
      // Update metadata
      try {
        await client.users.updateUser(userId, {
          publicMetadata: {
            role: role,
          },
          unsafeMetadata: {
            role: role,
          },
        });
        console.log(`✅ Metadata updated`);
      } catch (error: any) {
        console.warn(`⚠️  Could not update metadata: ${error.message}`);
      }
      
      // Remove MFA methods
      try {
        const mfaMethods = await (client.users as any).getMfaMethods({ userId });
        if (mfaMethods && Array.isArray(mfaMethods) && mfaMethods.length > 0) {
          for (const method of mfaMethods) {
            try {
              await (client.users as any).deleteMfaMethod({ userId, methodId: method.id });
              console.log(`   ✅ Removed MFA method: ${method.type}`);
            } catch (delError: any) {
              // Ignore
            }
          }
        }
      } catch (mfaError: any) {
        // MFA API may not be available
      }
      
      // Update password
      try {
        await client.users.updateUser(userId, {
          password: securePassword,
        });
        console.log(`✅ Password updated`);
      } catch (error: any) {
        console.warn(`⚠️  Could not update password: ${error.message}`);
      }
      
      console.log(`✅ Clerk user updated successfully!\n`);
    } else {
      console.log(`👤 Creating new user in Clerk...`);
      
      const newUser = await client.users.createUser({
        emailAddress: [email.toLowerCase()],
        password: securePassword,
        firstName: firstName,
        lastName: lastName || firstName,
        publicMetadata: {
          role: role,
        },
        unsafeMetadata: {
          role: role,
        },
      } as any);

      // Remove MFA if any
      try {
        const mfaMethods = await (client.users as any).getMfaMethods({ userId: newUser.id });
        if (mfaMethods && Array.isArray(mfaMethods) && mfaMethods.length > 0) {
          for (const method of mfaMethods) {
            try {
              await (client.users as any).deleteMfaMethod({ userId: newUser.id, methodId: method.id });
            } catch (delError: any) {
              // Ignore
            }
          }
        }
      } catch (mfaError: any) {
        // Ignore
      }

      console.log(`✅ User created in Clerk!`);
      console.log(`   🆔 Clerk User ID: ${newUser.id}\n`);
    }

    console.log('✅ Setup complete!\n');
    console.log('📋 Admin Credentials:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${securePassword}`);
    console.log(`   👤 Role: ${role}`);
    console.log(`\n⚠️  IMPORTANT: Disable MFA in Clerk Dashboard:`);
    console.log(`   Settings → Multi-factor Authentication → Disable "Require MFA"`);
    
  } catch (error: any) {
    console.error('❌ Error setting up Clerk user:', error);
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`   - ${err.message || JSON.stringify(err)}`);
      });
    } else {
      console.error(`   ${error.message || JSON.stringify(error)}`);
    }
    process.exit(1);
  }
}

setupAdminComplete()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  });
