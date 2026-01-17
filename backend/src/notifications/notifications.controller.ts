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
import { NotificationType, UserRole } from '../generated/prisma';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';
import { Roles } from '../authz/roles.decorator';
import { RolesGuard } from '../authz/roles.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('recipientId') recipientId?: string,
    @Query('read') read?: string,
    @Query('type') type?: NotificationType,
  ) {
    const parsedRead = read === undefined ? undefined : read === 'true';
    const user = req.user as { id: string; role: string };
    if (user.role !== 'admin') {
      recipientId = user.id;
    }
    return this.notificationsService.findAll({
      recipientId,
      read: parsedRead,
      type: type as NotificationType | undefined,
    });
  }

  @Get('unread/count')
  getUnreadCount(@Req() req: any, @Query('recipientId') recipientId?: string) {
    const user = req.user as { id: string; role: string };
    if (user.role !== 'admin') {
      recipientId = user.id;
    }
    return this.notificationsService.countUnread(recipientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    const notification = await this.notificationsService.findOne(id);
    if (user.role !== 'admin' && notification.recipientId !== user.id) {
      throw new ForbiddenException('You can only view your own notifications');
    }
    return notification;
  }

  @Post()
  @Roles('coordinator')
  create(
    @Body()
    payload: {
      title: string;
      message: string;
      type: NotificationType;
      recipientId: string;
      senderRole?: UserRole;
    },
  ) {
    return this.notificationsService.create(payload);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    const notification = await this.notificationsService.findOne(id);
    if (user.role !== 'admin' && notification.recipientId !== user.id) {
      throw new ForbiddenException('You can only modify your own notifications');
    }
    return this.notificationsService.markAsRead(id);
  }

  @Put('read/all')
  markAllAsRead(@Req() req: any, @Query('recipientId') recipientId?: string) {
    const user = req.user as { id: string; role: string };
    if (user.role !== 'admin') {
      recipientId = user.id;
    }
    return this.notificationsService.markAllAsRead(recipientId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    const notification = await this.notificationsService.findOne(id);
    if (user.role !== 'admin' && notification.recipientId !== user.id) {
      throw new ForbiddenException('You can only delete your own notifications');
    }
    return this.notificationsService.delete(id);
  }
}
