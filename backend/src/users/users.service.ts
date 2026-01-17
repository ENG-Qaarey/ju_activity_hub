import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private auditLogs: AuditLogsService) { }

  private readonly safeUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    studentId: true,
    avatar: true,
    department: true,
    joinedAt: true,
    status: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
    coordinatorProfile: {
      select: {
        id: true,
        department: true,
        specialization: true,
        maxActivities: true,
        approvalLevel: true,
        createdAt: true,
        updatedAt: true,
      },
    },
    adminProfile: {
      select: {
        id: true,
        permissions: true,
        accessLevel: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  } as const;

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private getBcryptRounds() {
    const raw = process.env.BCRYPT_ROUNDS;
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    const fallback = 10;
    const rounds = Number.isFinite(parsed) ? parsed : fallback;
    // Avoid extreme values that either hurt security (too low) or throughput (too high).
    return Math.min(14, Math.max(8, rounds));
  }

  async findAll(role?: string, email?: string) {
    const where: any = {};
    if (role) where.role = role;
    if (email) where.email = { equals: email, mode: 'insensitive' };

    return this.prisma.user.findMany({
      where,
      select: this.safeUserSelect,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.safeUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    const normalizedEmail = this.normalizeEmail(email);

    // Fast path: exact match uses the unique index on email.
    const exact = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (exact) {
      return exact;
    }

    // Compatibility path: if legacy rows were stored with mixed-case emails, fall back to
    // a case-insensitive query. If found, best-effort normalize in DB for future requests.
    const legacy = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (legacy && legacy.email !== normalizedEmail) {
      try {
        await this.prisma.user.update({
          where: { id: legacy.id },
          data: { email: normalizedEmail },
        });
        return { ...legacy, email: normalizedEmail };
      } catch {
        // Ignore normalization failures (could conflict with an existing email).
      }
    }

    return legacy;
  }

  async create(userData: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'coordinator' | 'admin';
    studentId?: string;
    department?: string;
    avatar?: string;
    status?: 'active' | 'inactive';
    emailVerified?: boolean;
  }) {
    const normalizedEmail = this.normalizeEmail(userData.email);
    const existingUser = await this.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(userData.password, this.getBcryptRounds());

    // Create user with nested creation for Coordinator or Admin if needed
    const userDataWithNested: any = {
      name: userData.name,
      email: normalizedEmail,
      passwordHash,
      role: userData.role,
      studentId: userData.studentId,
      department: userData.department,
      avatar: userData.avatar,
      joinedAt: new Date(),
      passwordVersion: 1,
      status: userData.status,
      emailVerified: userData.emailVerified ?? true,
    };

    // Create Coordinator record if role is coordinator
    if (userData.role === 'coordinator') {
      userDataWithNested.coordinatorProfile = {
        create: {
          department: userData.department || 'Activities',
          specialization: userData.department || null,
          maxActivities: 10,
          approvalLevel: 'standard',
        },
      };
    }

    // Create Admin record if role is admin
    if (userData.role === 'admin') {
      userDataWithNested.adminProfile = {
        create: {
          permissions: JSON.stringify(['*']), // Full permissions
          accessLevel: 'full',
        },
      };
    }

    const user = await this.prisma.user.create({
      data: userDataWithNested,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        avatar: true,
        department: true,
        joinedAt: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async update(id: string, updateData: {
    name?: string;
    email?: string;
    department?: string;
    studentId?: string;
    avatar?: string;
  }) {
    const normalizedEmail = updateData.email ? this.normalizeEmail(updateData.email) : undefined;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        avatar: true,
        department: true,
        joinedAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new ConflictException('Invalid old password');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.getBcryptRounds());
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordVersion: user.passwordVersion + 1,
      },
    });
  }

  async toggleStatus(id: string, actorId?: string) {
    const user = await this.findOne(id);

    // Prevent an admin from deactivating their own account.
    if (actorId && actorId === id && user.role === 'admin' && user.status === 'active') {
      throw new ConflictException('Admin cannot deactivate their own account');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: user.status === 'active' ? 'inactive' : 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        avatar: true,
        department: true,
        joinedAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditLogs.create({
      action: 'USER_STATUS_TOGGLE',
      actorId: actorId ?? null,
      targetId: id,
      entity: 'user',
      entityId: id,
      message: `Toggled user status: ${updated.email} -> ${updated.status}`,
      metadata: { status: updated.status },
    });

    return updated;
  }

  async delete(id: string, actorId?: string) {
    const user = await this.findOne(id);
    if (user.role === 'admin') {
      throw new ConflictException('Cannot delete admin user');
    }
    await this.prisma.user.delete({ where: { id } });

    await this.auditLogs.create({
      action: 'USER_DELETE',
      actorId: actorId ?? null,
      targetId: id,
      entity: 'user',
      entityId: id,
      message: `Deleted user: ${user.email}`,
      metadata: { role: user.role },
    });

    return { success: true };
  }
}

