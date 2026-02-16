import { Controller, Get, Post, Query } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('tip')
  async getDailyTip(@Query('locale') locale?: string) {
    return this.healthService.getDailyTip(locale || 'ko');
  }

  @Post('seed-tips')
  async seedTips() {
    return this.healthService.seedTips();
  }
}
