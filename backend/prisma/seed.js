"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const prisma_1 = require("../src/generated/prisma");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcrypt"));
(0, dotenv_1.config)();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new prisma_1.PrismaClient({ adapter });
async function main() {
    console.log('🗑️  Clearing all database records...');
    const attendanceCount = await prisma.attendance.deleteMany({});
    console.log(`   ✅ Deleted ${attendanceCount.count} attendance records`);
    const applicationCount = await prisma.application.deleteMany({});
    console.log(`   ✅ Deleted ${applicationCount.count} applications`);
    const notificationCount = await prisma.notification.deleteMany({});
    console.log(`   ✅ Deleted ${notificationCount.count} notifications`);
    const activityCount = await prisma.activity.deleteMany({});
    console.log(`   ✅ Deleted ${activityCount.count} activities`);
    const adminCount = await prisma.admin.deleteMany({});
    console.log(`   ✅ Deleted ${adminCount.count} admin profiles`);
    const coordinatorCount = await prisma.coordinator.deleteMany({});
    console.log(`   ✅ Deleted ${coordinatorCount.count} coordinator profiles`);
    const userCount = await prisma.user.deleteMany({});
    console.log(`   ✅ Deleted ${userCount.count} users`);
    console.log('\n🌱 Creating admin user...');
    const securePassword = 'Jamiila@JU2024Secure!';
    const adminPassword = await bcrypt.hash(securePassword, 10);
    const admin = await prisma.user.create({
        data: {
            name: 'ENG-jamiila',
            email: 'jamiila@gmail.com',
            passwordHash: adminPassword,
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
//# sourceMappingURL=seed.js.map