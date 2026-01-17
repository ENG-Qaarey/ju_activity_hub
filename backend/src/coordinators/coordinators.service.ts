import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoordinatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.coordinator.findMany({ include: { user: true } });
  }

  async findOne(id: string) {
    const coordinator = await this.prisma.coordinator.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!coordinator) {
      throw new NotFoundException('Coordinator not found');
    }
    return coordinator;
  }

  async update(id: string, data: { department?: string; specialization?: string; maxActivities?: number; approvalLevel?: string }) {
    await this.findOne(id);
    return this.prisma.coordinator.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.coordinator.delete({ where: { id } });
  }
}
