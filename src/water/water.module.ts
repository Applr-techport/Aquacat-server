import { Module } from '@nestjs/common';
import { WaterService } from './water.service';
import { WaterController } from './water.controller';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [AchievementModule],
  providers: [WaterService],
  controllers: [WaterController],
})
export class WaterModule {}
