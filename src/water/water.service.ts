import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class WaterService {
  constructor(
    private prisma: PrismaService,
    private achievementService: AchievementService,
  ) {}

  async logWater(userId: string, amount: number, drinkType: string = 'water') {
    const log = await this.prisma.waterLog.create({
      data: { userId, amount, drinkType },
    });

    // Update daily summary
    const today = this.getKSTDate();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.dailySummary.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        totalMl: amount,
        goalMl: user!.goalMl,
      },
      update: {
        totalMl: { increment: amount },
      },
    });

    // Check achievements (async, don't block response)
    this.checkAchievements(userId, user.goalMl, drinkType).catch(() => {});

    return log;
  }

  private async checkAchievements(userId: string, goalMl: number, drinkType: string) {
    const today = this.getKSTDate();
    const summary = await this.prisma.dailySummary.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    const streak = (await this.getStreak(userId)).streak;

    // Total volume
    const totalAgg = await this.prisma.waterLog.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    // Distinct drink types
    const drinkTypes = await this.prisma.waterLog.groupBy({
      by: ['drinkType'],
      where: { userId },
    });

    const now = new Date();
    const kstHour = (now.getUTCHours() + 9) % 24;

    await this.achievementService.checkAndUnlock(userId, {
      streak,
      totalMl: totalAgg._sum.amount || 0,
      todayMl: summary?.totalMl || 0,
      goalMl,
      drinkTypes: drinkTypes.map(d => d.drinkType),
      logHour: kstHour,
    });
  }

  async deleteLog(userId: string, logId: string) {
    const log = await this.prisma.waterLog.findFirst({
      where: { id: logId, userId },
    });
    if (!log) return null;

    await this.prisma.waterLog.delete({ where: { id: logId } });

    // Update daily summary using the log's actual date
    const logDate = new Date(log.loggedAt.getTime() + 9 * 3600000).toISOString().slice(0, 10);
    const summary = await this.prisma.dailySummary.findUnique({
      where: { userId_date: { userId, date: logDate } },
    });
    if (summary) {
      await this.prisma.dailySummary.update({
        where: { userId_date: { userId, date: logDate } },
        data: { totalMl: Math.max(0, summary.totalMl - log.amount) },
      });
    }

    return log;
  }

  async getToday(userId: string) {
    const today = this.getKSTDate();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const logs = await this.prisma.waterLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: this.getKSTStartOfDay(),
          lt: this.getKSTEndOfDay(),
        },
      },
      orderBy: { loggedAt: 'desc' },
    });

    const totalMl = logs.reduce((sum, l) => sum + l.amount, 0);
    const progress = Math.round((totalMl / user.goalMl) * 100);

    // Calculate gauge (with 30% drain)
    const gauge = this.calculateGauge(user, totalMl);

    // Determine cat state
    const now = new Date();
    const kstHour = (now.getUTCHours() + 9) % 24;
    const sleepHour = parseInt(user.sleepTime.split(':')[0]);
    const settlementHour = sleepHour - 2;
    const isSettlementTime = kstHour >= settlementHour;

    let catState: string;
    if (isSettlementTime && progress >= 100) {
      catState = 'perfect';
    } else if (gauge >= 70) {
      catState = 'happy';
    } else if (gauge >= 40) {
      catState = 'normal';
    } else if (gauge >= 15) {
      catState = 'thirsty';
    } else {
      catState = 'critical';
    }

    return {
      logs,
      totalMl,
      goalMl: user.goalMl,
      progress,
      gauge,
      catState,
    };
  }

  async getCalendar(userId: string, month: string) {
    // month format: "2026-02"
    const summaries = await this.prisma.dailySummary.findMany({
      where: {
        userId,
        date: { startsWith: month },
      },
      orderBy: { date: 'asc' },
    });

    return summaries.map(s => ({
      date: s.date,
      totalMl: s.totalMl,
      goalMl: s.goalMl,
      achieved: s.totalMl >= s.goalMl,
      percentage: Math.round((s.totalMl / s.goalMl) * 100),
    }));
  }

  async getWeekly(userId: string) {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() + 9 * 3600000 - i * 86400000);
      days.push(d.toISOString().slice(0, 10));
    }

    const summaries = await this.prisma.dailySummary.findMany({
      where: { userId, date: { in: days } },
    });

    const map = new Map(summaries.map(s => [s.date, s]));
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return days.map(date => {
      const s = map.get(date);
      return {
        date,
        totalMl: s?.totalMl || 0,
        goalMl: user.goalMl,
        achieved: (s?.totalMl || 0) >= user.goalMl,
      };
    });
  }

  async getStreak(userId: string) {
    const summaries = await this.prisma.dailySummary.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 365,
    });

    let streak = 0;
    const today = this.getKSTDate();
    let checkDate = today;
    let skippedToday = false;

    for (const s of summaries) {
      if (s.date === today && s.totalMl < s.goalMl && !skippedToday) {
        // Today not yet achieved, start counting from yesterday
        skippedToday = true;
        checkDate = new Date(Date.now() + 9 * 3600000 - 86400000).toISOString().slice(0, 10);
        continue;
      }

      if (s.date === checkDate && s.totalMl >= s.goalMl) {
        streak++;
        checkDate = new Date(
          new Date(checkDate + 'T00:00:00Z').getTime() - 86400000
        ).toISOString().slice(0, 10);
      } else {
        break;
      }
    }

    return { streak };
  }

  private calculateGauge(user: any, totalMl: number): number {
    const now = new Date();
    const kstHour = (now.getUTCHours() + 9) % 24;
    const kstMin = now.getUTCMinutes();
    const wakeHour = parseInt(user.wakeTime.split(':')[0]);
    const wakeMin = parseInt(user.wakeTime.split(':')[1] || '0');
    const sleepHour = parseInt(user.sleepTime.split(':')[0]);

    const activeHours = sleepHour - wakeHour;
    const elapsedHours = Math.max(0, (kstHour + kstMin / 60) - (wakeHour + wakeMin / 60));

    // 30% drain over active hours
    const drainTotal = user.goalMl * 0.3;
    const drained = (drainTotal / activeHours) * Math.min(elapsedHours, activeHours);

    const netMl = totalMl - drained;
    const gauge = Math.max(0, Math.round((netMl / user.goalMl) * 100));
    return Math.min(gauge, 100);
  }

  private getKSTDate(): string {
    return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  }

  private getKSTStartOfDay(): Date {
    const kstDate = this.getKSTDate();
    return new Date(`${kstDate}T00:00:00+09:00`);
  }

  private getKSTEndOfDay(): Date {
    const kstDate = this.getKSTDate();
    return new Date(`${kstDate}T23:59:59+09:00`);
  }
}
