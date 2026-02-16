import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementService } from './achievement.service';

@Controller('achievement')
@UseGuards(AuthGuard('jwt'))
export class AchievementController {
  constructor(private achievementService: AchievementService) {}

  @Get()
  async getAchievements(@Req() req: any) {
    return this.achievementService.getUserAchievements(req.user.id);
  }
}
