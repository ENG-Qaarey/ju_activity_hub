import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AttendanceStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';
import { Roles } from '../authz/roles.decorator';
import { RolesGuard } from '../authz/roles.guard';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('activityId') activityId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: AttendanceStatus,
  ) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'student') {
      studentId = user.id;
    }
    if (user.role === 'coordinator') {
      // Restrict coordinators to attendance for their own activities.
      if (activityId) {
        return this.prisma.activity
          .findUnique({ where: { id: activityId }, select: { coordinatorId: true } })
          .then((activity) => {
            if (!activity || activity.coordinatorId !== user.id) {
              throw new ForbiddenException('You can only view attendance for your own activities');
            }
            return this.attendanceService.findAll({ activityId, studentId, status });
          });
      }

      return this.attendanceService.findAll({
        activityId,
        studentId,
        status,
        coordinatorId: user.id,
      });
    }
    return this.attendanceService.findAll({
      activityId,
      studentId,
      status,
    });
  }

  @Get('stats/:activityId')
  @Roles('coordinator')
  async getStats(@Param('activityId') activityId: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'coordinator') {
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: { coordinatorId: true },
      });
      if (!activity || activity.coordinatorId !== user.id) {
        throw new ForbiddenException('You can only view stats for your own activities');
      }
    }
    return this.attendanceService.getStatsByActivity(activityId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    const record = await this.attendanceService.findOne(id);
    if (user.role === 'student' && record.studentId !== user.id) {
      throw new ForbiddenException('You can only view your own attendance');
    }
    if (user.role === 'coordinator') {
      const activity = await this.prisma.activity.findUnique({
        where: { id: record.activityId },
        select: { coordinatorId: true },
      });
      if (!activity || activity.coordinatorId !== user.id) {
        throw new ForbiddenException('You can only view attendance for your own activities');
      }
    }
    return record;
  }

  @Post()
  @Roles('coordinator')
  markAttendance(
    @Req() req: any,
    @Body()
    payload: {
      activityId: string;
      studentId: string;
      studentName: string;
      applicationId: string;
      status: AttendanceStatus;
      markedBy?: string;
      markedAt?: string;
    },
  ) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'coordinator') {
      return this.prisma.activity
        .findUnique({ where: { id: payload.activityId }, select: { coordinatorId: true } })
        .then((activity) => {
          if (!activity || activity.coordinatorId !== user.id) {
            throw new ForbiddenException('You can only mark attendance for your own activities');
          }
          return this.attendanceService.markAttendance({
            ...payload,
            markedBy: user.id,
          });
        });
    }
    return this.attendanceService.markAttendance({
      ...payload,
      markedBy: user.id,
    });
  }

  @Post('batch')
  @Roles('coordinator')
  batchMarkAttendance(
    @Req() req: any,
    @Body()
    payload: {
      activityId: string;
      attendanceData: Array<{
        studentId: string;
        studentName: string;
        applicationId: string;
        status: AttendanceStatus;
      }>;
      markedBy?: string;
      markedAt?: string;
    },
  ) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'coordinator') {
      return this.prisma.activity
        .findUnique({ where: { id: payload.activityId }, select: { coordinatorId: true } })
        .then((activity) => {
          if (!activity || activity.coordinatorId !== user.id) {
            throw new ForbiddenException('You can only mark attendance for your own activities');
          }
          return this.attendanceService.batchMarkAttendance({
            ...payload,
            markedBy: user.id,
          });
        });
    }
    return this.attendanceService.batchMarkAttendance({
      ...payload,
      markedBy: user.id,
    });
  }
}
