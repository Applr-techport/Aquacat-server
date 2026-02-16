import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
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
    return this.authService.devLogin(email);
  }
}
