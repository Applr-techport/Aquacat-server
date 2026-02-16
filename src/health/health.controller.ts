import { Controller, Get, Post } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('tip')
  async getDailyTip() {
    return this.healthService.getDailyTip();
  }

  @Post('seed-tips')
  async seedTips() {
    return this.healthService.seedTips();
  }
}
