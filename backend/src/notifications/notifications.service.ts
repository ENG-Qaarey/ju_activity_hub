import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, UserRole } from '../generated/prisma';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface NotificationFilters {
  recipientId?: string;
  read?: boolean;
  type?: NotificationType;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: NotificationFilters = {}) {
    const where: Prisma.NotificationWhereInput = {};

    if (filters.recipientId) {
      where.recipientId = filters.recipientId;
    }
    if (filters.read !== undefined) {
      where.read = filters.read;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async countUnread(recipientId?: string) {
    const where: Prisma.NotificationWhereInput = { read: false };
    if (recipientId) {
      where.recipientId = recipientId;
    }
    return this.prisma.notification.count({ where });
  }

  async create(data: {
    title: string;
    message: string;
    type: NotificationType;
    recipientId: string;
    senderRole?: UserRole | null;
  }) {
    return this.prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        recipientId: data.recipientId,
        senderRole: data.senderRole ?? null,
        read: false,
        createdAt: new Date(),
      },
    });
  }

  async createBatch(
    notifications: Array<{
      title: string;
      message: string;
      type: NotificationType;
      recipientId: string;
      senderRole?: UserRole | null;
    }>,
  ) {
    if (notifications.length === 0) {
      return [];
    }
    const payload = notifications.map(item => ({
      ...item,
      read: false,
      createdAt: new Date(),
    }));
    await this.prisma.notification.createMany({
      data: payload,
    });
    return notifications;
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(recipientId?: string) {
    const where: Prisma.NotificationWhereInput = { read: false };
    if (recipientId) {
      where.recipientId = recipientId;
    }
    return this.prisma.notification.updateMany({
      where,
      data: { read: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.notification.delete({ where: { id } });
  }
}
