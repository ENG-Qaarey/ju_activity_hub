import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	me(@Req() req: any) {
		return { success: true, user: req.user };
	}

	@Post('login')
	login(@Body() payload: { email: string; password: string }) {
		return this.authService.login(payload.email, payload.password);
	}

	@Post('register')
	register(
		@Body()
		payload: {
			name: string;
			email: string;
			password: string;
			role?: 'student' | 'coordinator' | 'admin';
			studentId?: string;
			department?: string;
			avatar?: string;
		},
	) {
		return this.authService.register(payload);
	}

		@Post('google')
		googleSignIn(@Body() payload: { credential: string }) {
			return this.authService.signInWithGoogle(payload.credential);
		}

	@Post('verify-email')
	verifyEmail(@Body() payload: { email: string; code: string }) {
		return this.authService.verifyEmail(payload.email, payload.code);
	}

	@Post('resend-verification')
	resendVerification(@Body() payload: { email: string }) {
		return this.authService.resendVerification(payload.email);
	}
}
