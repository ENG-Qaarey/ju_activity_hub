import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [UsersModule, AuditLogsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
