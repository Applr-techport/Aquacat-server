import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async updateProfile(userId: string, data: {
    displayName?: string;
    gender?: string;
    birthYear?: number;
    weight?: number;
    wakeTime?: string;
    sleepTime?: string;
    activityLevel?: string;
    mealTimes?: string;
  }) {
    // Recalculate goalMl if weight or activityLevel changed
    let goalMl: number | undefined;
    if (data.weight || data.activityLevel) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return null;
      const weight = data.weight || user.weight;
      const activity = data.activityLevel || user.activityLevel;
      const multiplier = activity === 'low' ? 30 : activity === 'high' ? 40 : 33;
      goalMl = Math.round((weight * multiplier) / 100) * 100;
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
    birthYear?: number;
    weight: number;
    wakeTime: string;
    sleepTime: string;
    activityLevel: string;
    mealTimes?: string;
  }) {
    const multiplier = data.activityLevel === 'low' ? 30 : data.activityLevel === 'high' ? 40 : 33;
    const goalMl = Math.round((data.weight * multiplier) / 100) * 100;

    return this.prisma.user.update({
      where: { id: userId },
      data: { ...data, goalMl },
    });
  }
}
