"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HealthService = class HealthService {
    prisma;
    defaultTips = [
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
        '자기 전 물 한 잔은 밤사이 탈수를 예방해줘!',
        '체중의 2%만 수분이 빠져도 운동능력이 떨어진대!',
        '물을 꾸준히 마시면 변비 예방에 효과적이래!',
        '차가운 물보다 미지근한 물이 흡수가 빠르대!',
        '한 번에 많이 마시는 것보다 조금씩 자주가 좋아!',
        '과일이나 채소에도 수분이 많이 들어있어!',
        '커피 한 잔 마셨으면 물 두 잔으로 보충해줘!',
        '목이 마르다고 느낄 땐 이미 1~2% 탈수 상태래!',
        '물을 충분히 마시면 신장 결석 예방에 도움된대!',
        '수분 섭취는 체온 조절에도 중요한 역할을 해!',
    ];
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDailyTip() {
        const count = await this.prisma.healthTip.count({ where: { active: true } });
        if (count > 0) {
            const skip = Math.floor(Math.random() * count);
            const tip = await this.prisma.healthTip.findFirst({
                where: { active: true },
                skip,
            });
            return { tip: tip.content };
        }
        const idx = Math.floor(Math.random() * this.defaultTips.length);
        return { tip: this.defaultTips[idx] };
    }
    async seedTips() {
        const count = await this.prisma.healthTip.count();
        if (count === 0) {
            await this.prisma.healthTip.createMany({
                data: this.defaultTips.map(content => ({ content })),
            });
        }
        return { seeded: this.defaultTips.length };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthService);
//# sourceMappingURL=health.service.js.map