import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  private calculateGoalMl(weight: number, activityLevel: string, ageGroup: string, gender?: string): number {
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

    // Gender adjustment (female ~10% less)
    const genderAdjust = gender === 'female' ? -3 : 0;

    const multiplier = base + adjust + genderAdjust;
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
    if (data.weight || data.activityLevel || data.ageGroup || data.gender) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return null;
      const weight = data.weight || user.weight;
      const activity = data.activityLevel || user.activityLevel;
      const age = data.ageGroup || user.ageGroup;
      const gender = data.gender || user.gender || undefined;
      goalMl = this.calculateGoalMl(weight, activity, age, gender);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(goalMl ? { goalMl } : {}),
      },
    });
  }

  async resetData(userId: string) {
    await this.prisma.waterLog.deleteMany({ where: { userId } });
    await this.prisma.dailySummary.deleteMany({ where: { userId } });
    await this.prisma.achievement.deleteMany({ where: { userId } });
    return { reset: true };
  }

  async deleteAccount(userId: string) {
    // Delete all related data then user
    await this.prisma.achievement.deleteMany({ where: { userId } });
    await this.prisma.purchase.deleteMany({ where: { userId } });
    await this.prisma.waterLog.deleteMany({ where: { userId } });
    await this.prisma.dailySummary.deleteMany({ where: { userId } });
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
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
    const goalMl = this.calculateGoalMl(data.weight, data.activityLevel, ageGroup, data.gender);

    return this.prisma.user.update({
      where: { id: userId },
      data: { ...data, ageGroup, goalMl },
    });
  }
}
