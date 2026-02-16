import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  @Get()
  @SkipThrottle()
  root() {
    return { name: 'NyangNyang Water API', version: '1.0.0', status: 'ok' };
  }

  @Get('healthz')
  @SkipThrottle()
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
