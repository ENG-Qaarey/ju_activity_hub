import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
