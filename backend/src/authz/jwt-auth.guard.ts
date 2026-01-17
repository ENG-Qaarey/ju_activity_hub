import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { AppRole } from './roles.decorator';

type JwtPayload = {
  sub: string;
  email: string;
  role: AppRole;
  pv: number;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest() as any;

    const authHeader = (req.headers?.authorization || req.headers?.Authorization) as
      | string
      | undefined;

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }

    const token = authHeader.slice('bearer '.length).trim();
    const secret = this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, secret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        avatar: true,
        department: true,
        joinedAt: true,
        status: true,
        emailVerified: true,
        passwordVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.passwordVersion !== payload.pv) {
      throw new UnauthorizedException('Token is no longer valid');
    }

    // Attach for downstream handlers/guards.
    req.user = user;
    return true;
  }
}
