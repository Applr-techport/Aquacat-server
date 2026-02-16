import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AchievementDef {
  type: string;
  icon: string;
  title: Record<string, string>;
  description: Record<string, string>;
}

@Injectable()
export class AchievementService {
  constructor(private prisma: PrismaService) {}

  static readonly ACHIEVEMENTS: AchievementDef[] = [
    {
      type: 'first_drink',
      icon: '💧',
      title: { ko: '첫 한 잔', en: 'First Sip', ja: '最初の一杯', zh: '第一杯' },
      description: { ko: '처음으로 물을 기록했어!', en: 'Logged your first water!', ja: '初めて水を記録した！', zh: '第一次记录喝水！' },
    },
    {
      type: 'first_perfect',
      icon: '🎯',
      title: { ko: '첫 목표 달성', en: 'First Goal', ja: '初目標達成', zh: '首次达标' },
      description: { ko: '처음으로 하루 목표를 달성!', en: 'First daily goal achieved!', ja: '初めて1日の目標を達成！', zh: '首次完成每日目标！' },
    },
    {
      type: 'streak_3',
      icon: '🔥',
      title: { ko: '3일 연속', en: '3 Day Streak', ja: '3日連続', zh: '连续3天' },
      description: { ko: '3일 연속 목표 달성!', en: '3 days in a row!', ja: '3日連続達成！', zh: '连续3天达标！' },
    },
    {
      type: 'streak_7',
      icon: '⭐',
      title: { ko: '일주일 연속', en: 'Week Warrior', ja: '1週間連続', zh: '连续一周' },
      description: { ko: '7일 연속 목표 달성!', en: '7 days straight!', ja: '7日連続達成！', zh: '连续7天达标！' },
    },
    {
      type: 'streak_30',
      icon: '👑',
      title: { ko: '30일 전설', en: 'Monthly Legend', ja: '30日伝説', zh: '30天传说' },
      description: { ko: '30일 연속 목표 달성! 전설이야!', en: '30 day streak! Legendary!', ja: '30日連続！伝説だ！', zh: '连续30天！传奇！' },
    },
    {
      type: 'total_10L',
      icon: '🪣',
      title: { ko: '양동이 하나', en: '10 Liters', ja: '10リットル', zh: '10升' },
      description: { ko: '총 10리터 섭취!', en: 'Total 10L consumed!', ja: '合計10L摂取！', zh: '总共喝了10升！' },
    },
    {
      type: 'total_50L',
      icon: '🛁',
      title: { ko: '욕조 절반', en: '50 Liters', ja: '50リットル', zh: '50升' },
      description: { ko: '총 50리터 섭취!', en: 'Total 50L consumed!', ja: '合計50L摂取！', zh: '总共喝了50升！' },
    },
    {
      type: 'total_100L',
      icon: '🌊',
      title: { ko: '물의 왕', en: 'Water King', ja: '水の王', zh: '水之王' },
      description: { ko: '총 100리터 달성! 대단해!', en: '100L total! Amazing!', ja: '100L達成！すごい！', zh: '100升！太厉害了！' },
    },
    {
      type: 'early_bird',
      icon: '🐦',
      title: { ko: '얼리버드', en: 'Early Bird', ja: 'アーリーバード', zh: '早起鸟' },
      description: { ko: '오전 7시 전에 물을 마셨어!', en: 'Drank water before 7 AM!', ja: '朝7時前に水を飲んだ！', zh: '7点前就喝水了！' },
    },
    {
      type: 'night_owl',
      icon: '🦉',
      title: { ko: '올빼미', en: 'Night Owl', ja: 'ナイトオウル', zh: '夜猫子' },
      description: { ko: '밤 11시 이후에도 수분 섭취!', en: 'Hydrating past 11 PM!', ja: '23時以降も水分補給！', zh: '11点后还在喝水！' },
    },
    {
      type: 'variety_5',
      icon: '🎨',
      title: { ko: '음료 마스터', en: 'Drink Master', ja: 'ドリンクマスター', zh: '饮料大师' },
      description: { ko: '5가지 음료 종류를 모두 기록!', en: 'Logged all 5 drink types!', ja: '5種類の飲み物を全て記録！', zh: '记录了全部5种饮料！' },
    },
    {
      type: 'overachiever',
      icon: '🚀',
      title: { ko: '초과 달성', en: 'Overachiever', ja: 'オーバーアチーバー', zh: '超额达成' },
      description: { ko: '목표의 150% 이상 섭취!', en: 'Exceeded 150% of goal!', ja: '目標の150%以上摂取！', zh: '超过目标150%！' },
    },
  ];

  async getUserAchievements(userId: string) {
    const unlocked = await this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });

    const unlockedTypes = new Set(unlocked.map(a => a.type));

    return AchievementService.ACHIEVEMENTS.map(def => ({
      ...def,
      unlocked: unlockedTypes.has(def.type),
      unlockedAt: unlocked.find(a => a.type === def.type)?.unlockedAt || null,
    }));
  }

  async checkAndUnlock(userId: string, context: {
    streak?: number;
    totalMl?: number;
    todayMl?: number;
    goalMl?: number;
    drinkTypes?: string[];
    logHour?: number;
  }): Promise<AchievementDef[]> {
    const newAchievements: AchievementDef[] = [];
    const existing = await this.prisma.achievement.findMany({
      where: { userId },
      select: { type: true },
    });
    const has = new Set(existing.map(a => a.type));

    const tryUnlock = async (type: string) => {
      if (has.has(type)) return;
      await this.prisma.achievement.create({
        data: { userId, type },
      }).catch(() => {}); // ignore duplicate
      const def = AchievementService.ACHIEVEMENTS.find(a => a.type === type);
      if (def) newAchievements.push(def);
    };

    // First drink
    await tryUnlock('first_drink');

    // First perfect
    if (context.todayMl && context.goalMl && context.todayMl >= context.goalMl) {
      await tryUnlock('first_perfect');
    }

    // Streaks
    if (context.streak && context.streak >= 3) await tryUnlock('streak_3');
    if (context.streak && context.streak >= 7) await tryUnlock('streak_7');
    if (context.streak && context.streak >= 30) await tryUnlock('streak_30');

    // Total volume (convert to liters)
    if (context.totalMl) {
      const totalL = context.totalMl / 1000;
      if (totalL >= 10) await tryUnlock('total_10L');
      if (totalL >= 50) await tryUnlock('total_50L');
      if (totalL >= 100) await tryUnlock('total_100L');
    }

    // Time-based
    if (context.logHour !== undefined) {
      if (context.logHour < 7) await tryUnlock('early_bird');
      if (context.logHour >= 23) await tryUnlock('night_owl');
    }

    // Variety
    if (context.drinkTypes && context.drinkTypes.length >= 5) {
      await tryUnlock('variety_5');
    }

    // Overachiever
    if (context.todayMl && context.goalMl && context.todayMl >= context.goalMl * 1.5) {
      await tryUnlock('overachiever');
    }

    return newAchievements;
  }
}
