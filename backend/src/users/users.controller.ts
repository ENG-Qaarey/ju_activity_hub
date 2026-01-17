import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';
import { Roles } from '../authz/roles.decorator';
import { RolesGuard } from '../authz/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  me(@Req() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  updateMe(
    @Req() req: any,
    @Body()
    payload: {
      name?: string;
      email?: string;
      department?: string;
      studentId?: string;
      avatar?: string;
    },
  ) {
    return this.usersService.update(req.user.id, payload);
  }

  @Patch('me/password')
  updateMyPassword(
    @Req() req: any,
    @Body()
    payload: {
      oldPassword: string;
      newPassword: string;
    },
  ) {
    return this.usersService.updatePassword(req.user.id, payload.oldPassword, payload.newPassword);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads',
        filename: (req, file, cb) => {
          const userId = (req as any)?.user?.id ?? 'user';
          const ext = path.extname(file.originalname || '').toLowerCase();
          cb(null, `${userId}-${Date.now()}${ext || '.png'}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype?.startsWith('image/')) {
          return cb(new BadRequestException('Only image uploads are allowed') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadMyAvatar(@Req() req: any, @UploadedFile() file?: any) {
    if (!file) {
      throw new BadRequestException('Missing file');
    }
    const avatarUrl = `/uploads/${file.filename}`;
    const updated = await this.usersService.update(req.user.id, { avatar: avatarUrl });
    return updated;
  }

  @Get()
  @Roles('admin')
  findAll(
    @Query('role') role?: string,
    @Query('email') email?: string,
  ) {
    return this.usersService.findAll(role, email);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(
    @Body()
    payload: {
      name: string;
      email: string;
      password: string;
      role: 'student' | 'coordinator' | 'admin';
      studentId?: string;
      department?: string;
      avatar?: string;
    },
  ) {
    return this.usersService.create(payload);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body()
    payload: {
      name?: string;
      email?: string;
      department?: string;
      studentId?: string;
      avatar?: string;
    },
  ) {
    return this.usersService.update(id, payload);
  }

  @Patch(':id/password')
  @Roles('admin')
  updatePassword(
    @Param('id') id: string,
    @Body()
    payload: {
      oldPassword: string;
      newPassword: string;
    },
  ) {
    return this.usersService.updatePassword(id, payload.oldPassword, payload.newPassword);
  }

  @Patch(':id/status')
  @Roles('admin')
  toggleStatus(@Param('id') id: string, @Req() req: any) {
    const actorId = req?.user?.id as string | undefined;
    return this.usersService.toggleStatus(id, actorId);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @Req() req: any) {
    const actorId = req?.user?.id as string | undefined;
    return this.usersService.delete(id, actorId);
  }
}
