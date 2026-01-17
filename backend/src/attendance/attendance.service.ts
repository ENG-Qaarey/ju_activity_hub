import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus } from '../generated/prisma';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    activityId?: string;
    studentId?: string;
    status?: AttendanceStatus;
    coordinatorId?: string;
  }) {
    const where: Prisma.AttendanceWhereInput = {};
    if (filters?.activityId) {
      where.activityId = filters.activityId;
    }
    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.coordinatorId) {
      where.activity = { coordinatorId: filters.coordinatorId };
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: {
        markedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
    return attendance;
  }

  async getStatsByActivity(activityId: string) {
    const stats = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { activityId },
      _count: true,
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);
  }

  async markAttendance(data: {
    activityId: string;
    studentId: string;
    studentName: string;
    applicationId: string;
    status: AttendanceStatus;
    markedBy: string;
    markedAt?: string;
  }) {
    const markedAt = data.markedAt ? new Date(data.markedAt) : new Date();
    return this.prisma.attendance.upsert({
      where: { applicationId: data.applicationId },
      update: {
        activityId: data.activityId,
        studentId: data.studentId,
        studentName: data.studentName,
        status: data.status,
        markedAt,
        markedBy: data.markedBy,
      },
      create: {
        activityId: data.activityId,
        studentId: data.studentId,
        studentName: data.studentName,
        applicationId: data.applicationId,
        status: data.status,
        markedAt,
        markedBy: data.markedBy,
      },
    });
  }

  async batchMarkAttendance(data: {
    activityId: string;
    attendanceData: Array<{
      studentId: string;
      studentName: string;
      applicationId: string;
      status: AttendanceStatus;
    }>;
    markedBy: string;
    markedAt?: string;
  }) {
    const markedAt = data.markedAt ? new Date(data.markedAt) : new Date();
    const results = await Promise.all(
      data.attendanceData.map(item =>
        this.markAttendance({
          activityId: data.activityId,
          studentId: item.studentId,
          studentName: item.studentName,
          applicationId: item.applicationId,
          status: item.status,
          markedBy: data.markedBy,
          markedAt: markedAt.toISOString(),
        }),
      ),
    );
    return results;
  }
}
