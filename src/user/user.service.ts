import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  private calculateGoalMl(weight: number, activityLevel: string, ageGroup: string): number {
    // Base multiplier by age group (ml per kg)
    const ageMultiplier: Record<string, number> = {
      '20s': 37, // 35~40
      '30s': 33, // 30~35
      '40s': 30, // 28~32
      '50+': 27, // 25~30
    };
    const base = ageMultiplier[ageGroup] || 33;

    // Activity adjustment
    const activityAdjust: Record<string, number> = {
      'low': -3,
      'normal': 0,
      'high': +5,
    };
    const adjust = activityAdjust[activityLevel] || 0;

    const multiplier = base + adjust;
    return Math.round((weight * multiplier) / 100) * 100;
  }

  async updateProfile(userId: string, data: {
    displayName?: string;
    gender?: string;
    weight?: number;
    wakeTime?: string;
    sleepTime?: string;
    activityLevel?: string;
    ageGroup?: string;
    mealTimes?: string;
  }) {
    let goalMl: number | undefined;
    if (data.weight || data.activityLevel || data.ageGroup) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return null;
      const weight = data.weight || user.weight;
      const activity = data.activityLevel || user.activityLevel;
      const age = data.ageGroup || user.ageGroup;
      goalMl = this.calculateGoalMl(weight, activity, age);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(goalMl ? { goalMl } : {}),
      },
    });
  }

  async completeOnboarding(userId: string, data: {
    displayName: string;
    gender?: string;
    weight: number;
    wakeTime: string;
    sleepTime: string;
    activityLevel: string;
    ageGroup?: string;
    mealTimes?: string;
  }) {
    const ageGroup = data.ageGroup || '30s';
    const goalMl = this.calculateGoalMl(data.weight, data.activityLevel, ageGroup);

    return this.prisma.user.update({
      where: { id: userId },
      data: { ...data, ageGroup, goalMl },
    });
  }
}
