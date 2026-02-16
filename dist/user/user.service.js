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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        return this.prisma.user.findUnique({ where: { id: userId } });
    }
    async updateProfile(userId, data) {
        let goalMl;
        if (data.weight || data.activityLevel) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user)
                return null;
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
    async completeOnboarding(userId, data) {
        const multiplier = data.activityLevel === 'low' ? 30 : data.activityLevel === 'high' ? 40 : 33;
        const goalMl = Math.round((data.weight * multiplier) / 100) * 100;
        return this.prisma.user.update({
            where: { id: userId },
            data: { ...data, goalMl },
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map