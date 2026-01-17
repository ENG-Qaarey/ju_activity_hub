import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.admin.findMany({
      include: { user: true },
    });
  }

  async findOne(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }
    return admin;
  }

  async update(id: string, data: { permissions?: string; accessLevel?: string }) {
    await this.findOne(id);
    return this.prisma.admin.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.admin.delete({ where: { id } });
  }
}
