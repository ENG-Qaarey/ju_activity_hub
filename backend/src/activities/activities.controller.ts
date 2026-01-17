import {
  BadRequestException,
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
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';
import { Roles } from '../authz/roles.decorator';
import { RolesGuard } from '../authz/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('coordinatorId') coordinatorId?: string,
  ) {
    return this.activitiesService.findAll(status, category, coordinatorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async create(
    @Req() req: any,
    @Body()
    activityData: {
      title: string;
      description: string;
      category: string;
      date: string;
      time: string;
      location: string;
      capacity: number;
      coordinatorId?: string;
      coordinatorName?: string;
    },
  ) {
    const user = req.user as { id: string; name: string; role: string };

    // Coordinators can only create activities for themselves.
    // Admins may assign the activity to a coordinator.
    let coordinatorId = user.id;
    let coordinatorName = user.name;

    if (user.role === 'admin' && activityData.coordinatorId) {
      const target = await this.prisma.user.findUnique({
        where: { id: activityData.coordinatorId },
        select: { id: true, name: true, role: true },
      });
      if (!target) {
        throw new BadRequestException('Selected coordinator not found');
      }
      if (target.role !== 'coordinator') {
        throw new BadRequestException('Selected user is not a coordinator');
      }
      coordinatorId = target.id;
      coordinatorName = target.name;
    }

    return this.activitiesService.create(
      {
      ...activityData,
      coordinatorId,
      coordinatorName,
      },
      user.id,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('coordinator')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    updateData: {
      title?: string;
      description?: string;
      category?: string;
      date?: string;
      time?: string;
      location?: string;
      capacity?: number;
      enrolled?: number;
      status?: string;
    },
  ) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'coordinator') {
      return this.activitiesService.findOne(id).then((activity) => {
        if (activity.coordinatorId !== user.id) {
          throw new ForbiddenException('You can only modify your own activities');
        }
        return this.activitiesService.update(id, updateData, user.id);
      });
    }
    return this.activitiesService.update(id, updateData, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'coordinator') {
      return this.activitiesService.findOne(id).then((activity) => {
        if (activity.coordinatorId !== user.id) {
          throw new ForbiddenException('You can only delete your own activities');
        }
        return this.activitiesService.delete(id, user.id);
      });
    }
    return this.activitiesService.delete(id, user.id);
  }
}
