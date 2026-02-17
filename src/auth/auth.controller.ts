import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private devLoginAttempts = new Map<string, { count: number; resetAt: number }>();

  constructor(private authService: AuthService) {}

  @Post('google')
  async googleLogin(@Body('idToken') idToken: string) {
    return this.authService.googleLogin(idToken);
  }

  @Post('apple')
  async appleLogin(
    @Body('identityToken') identityToken: string,
    @Body('email') email?: string,
    @Body('fullName') fullName?: string,
  ) {
    return this.authService.appleLogin(identityToken, email, fullName);
  }

  @Post('dev-login')
  async devLogin(@Body('email') email: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('Dev login disabled in production', HttpStatus.FORBIDDEN);
    }
    // Rate limit: 10 attempts per minute per email
    const now = Date.now();
    const entry = this.devLoginAttempts.get(email);
    if (entry && entry.resetAt > now && entry.count >= 10) {
      throw new HttpException('Too many attempts', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (!entry || entry.resetAt <= now) {
      this.devLoginAttempts.set(email, { count: 1, resetAt: now + 60000 });
    } else {
      entry.count++;
    }
    return this.authService.devLogin(email);
  }
}
