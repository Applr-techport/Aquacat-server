import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private defaultTips: Record<string, string[]> = {
    ko: [
      '아침 공복에 물 한 잔은 장 건강에 좋대!',
      '물을 자주 마시면 피부가 좋아진대!',
      '카페인 음료 마신 후엔 물을 더 마시는 게 좋아!',
      '식사 30분 전 물 한 잔이 소화에 도움된대!',
      '하루 8잔 물이 두통 예방에 좋대!',
      '물을 충분히 마시면 집중력이 올라간대!',
      '운동 전후로 물을 마시면 근육 회복에 도움된대!',
      '따뜻한 물은 혈액순환을 촉진시켜줘!',
      '수분이 부족하면 피로감이 더 느껴진대!',
      '물을 마시면 신진대사가 활발해져!',
    ],
    en: [
      'A glass of water on an empty stomach is great for gut health!',
      'Drinking water regularly improves your skin!',
      'After caffeine, drink extra water to rehydrate!',
      'A glass of water 30 min before meals aids digestion!',
      '8 glasses a day can prevent headaches!',
      'Staying hydrated boosts concentration!',
      'Water before and after exercise helps muscle recovery!',
      'Warm water promotes blood circulation!',
      'Dehydration increases fatigue!',
      'Drinking water boosts metabolism!',
    ],
    ja: [
      '朝の空腹時に水を一杯飲むと腸にいいよ！',
      '水をよく飲むと肌がきれいになるよ！',
      'カフェインの後は水を多めに！',
      '食事30分前の水が消化を助けるよ！',
      '1日8杯で頭痛予防！',
      '水分補給で集中力アップ！',
      '運動前後の水は筋肉回復に効果的！',
      '白湯は血行促進に良いよ！',
      '水分不足は疲労感の原因に！',
      '水を飲むと新陳代謝が活発に！',
    ],
    zh: [
      '早起空腹喝一杯水对肠道健康很好！',
      '经常喝水能改善皮肤！',
      '喝完咖啡后要多喝水补充水分！',
      '饭前30分钟喝水有助消化！',
      '每天8杯水可以预防头痛！',
      '充足水分能提高专注力！',
      '运动前后喝水有助肌肉恢复！',
      '温水能促进血液循环！',
      '缺水会增加疲劳感！',
      '喝水能促进新陈代谢！',
    ],
  };

  constructor(private prisma: PrismaService) {}

  async getDailyTip(locale: string = 'ko') {
    // Try DB first
    const count = await this.prisma.healthTip.count({ where: { active: true } });
    if (count > 0) {
      const skip = Math.floor(Math.random() * count);
      const tip = await this.prisma.healthTip.findFirst({
        where: { active: true },
        skip,
      });
      return { tip: tip!.content };
    }

    // Fallback to localized defaults
    const tips = this.defaultTips[locale] || this.defaultTips['en'] || this.defaultTips['ko'];
    const idx = Math.floor(Math.random() * tips.length);
    return { tip: tips[idx] };
  }

  async seedTips() {
    const count = await this.prisma.healthTip.count();
    if (count === 0) {
      await this.prisma.healthTip.createMany({
        data: this.defaultTips['ko'].map(content => ({ content })),
      });
    }
    return { seeded: this.defaultTips['ko'].length };
  }
}
