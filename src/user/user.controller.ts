import { Controller, Get, Patch, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch('profile')
  async updateProfile(@Req() req, @Body() body) {
    return this.userService.updateProfile(req.user.id, body);
  }

  @Post('onboarding')
  async completeOnboarding(@Req() req, @Body() body) {
    return this.userService.completeOnboarding(req.user.id, body);
  }

  @Delete('account')
  async deleteAccount(@Req() req) {
    return this.userService.deleteAccount(req.user.id);
  }
}
