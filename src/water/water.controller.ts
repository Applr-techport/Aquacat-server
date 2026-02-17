import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WaterService } from './water.service';
import { LogWaterDto } from './log-water.dto';

@Controller('water')
@UseGuards(AuthGuard('jwt'))
export class WaterController {
  constructor(private waterService: WaterService) {}

  @Post('log')
  async logWater(@Req() req, @Body() body: LogWaterDto) {
    return this.waterService.logWater(req.user.id, body.amount, body.drinkType || 'water');
  }

  @Delete('log/:id')
  async deleteLog(@Req() req, @Param('id') id: string) {
    return this.waterService.deleteLog(req.user.id, id);
  }

  @Get('today')
  async getToday(@Req() req) {
    return this.waterService.getToday(req.user.id);
  }

  @Get('calendar')
  async getCalendar(@Req() req, @Query('month') month: string) {
    return this.waterService.getCalendar(req.user.id, month);
  }

  @Get('weekly')
  async getWeekly(@Req() req) {
    return this.waterService.getWeekly(req.user.id);
  }

  @Get('streak')
  async getStreak(@Req() req) {
    return this.waterService.getStreak(req.user.id);
  }
}
