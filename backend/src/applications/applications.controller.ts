import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';
import { Roles } from '../authz/roles.decorator';
import { RolesGuard } from '../authz/roles.guard';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Get('attendance/approved')
  @Roles('admin', 'coordinator')
  async getApprovedForAttendance(
    @Req() req: any,
    @Query('activityId') activityId?: string,
  ) {
    const user = req.user as { id: string; role: string };
    return this.applicationsService.findApprovedForAttendance(activityId ?? '', user);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
    @Query('activityId') activityId?: string,
  ) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'student') {
      return this.applicationsService.findAll(status, user.id, activityId);
    }
    if (user.role === 'coordinator') {
      return this.applicationsService.findAll(status, studentId, activityId, user.id);
    }
    return this.applicationsService.findAll(status, studentId, activityId);
  }

  @Get('stats/:activityId')
  @Roles('coordinator')
  async getStats(@Param('activityId') activityId: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'coordinator') {
      const activity = await this.applicationsService.getActivity(activityId);
      if (!activity || activity.coordinatorId !== user.id) {
        throw new ForbiddenException('You can only view stats for your own activities');
      }
    }
    return this.applicationsService.getStatsByActivity(activityId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    const application = await this.applicationsService.findOne(id);
    if (user.role === 'student' && application.studentId !== user.id) {
      throw new ForbiddenException('You can only view your own applications');
    }
    if (user.role === 'coordinator') {
      const activity = application.activity as any;
      if (activity?.coordinatorId !== user.id) {
        throw new ForbiddenException('You can only view applications for your own activities');
      }
    }
    return application;
  }

  @Post()
  @Roles('student')
  create(
    @Req() req: any,
    @Body()
    applicationData: {
      studentId?: string;
      studentName?: string;
      activityId: string;
      activityTitle: string;
    },
  ) {
    const user = req.user as { id: string; name: string };
    return this.applicationsService.create({
      ...applicationData,
      studentId: user.id,
      studentName: user.name,
    } as any);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() payload: { status: string; notes?: string },
  ) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'student') {
      throw new ForbiddenException('Students cannot change application status');
    }
    if (user.role === 'coordinator') {
      return this.applicationsService.findOne(id).then((application) => {
        const activity = application.activity as any;
        if (activity?.coordinatorId !== user.id) {
          throw new ForbiddenException('You can only manage applications for your own activities');
        }
        return this.applicationsService.updateStatus(id, payload.status, payload.notes, {
          id: user.id,
          role: user.role as any,
        });
      });
    }
    return this.applicationsService.updateStatus(id, payload.status, payload.notes, {
      id: user.id,
      role: user.role as any,
    });
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.applicationsService.delete(id);
  }
}
