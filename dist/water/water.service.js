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
exports.WaterService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WaterService = class WaterService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logWater(userId, amount, drinkType = 'water') {
        const log = await this.prisma.waterLog.create({
            data: { userId, amount, drinkType },
        });
        const today = this.getKSTDate();
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        await this.prisma.dailySummary.upsert({
            where: { userId_date: { userId, date: today } },
            create: {
                userId,
                date: today,
                totalMl: amount,
                goalMl: user.goalMl,
            },
            update: {
                totalMl: { increment: amount },
            },
        });
        return log;
    }
    async deleteLog(userId, logId) {
        const log = await this.prisma.waterLog.findFirst({
            where: { id: logId, userId },
        });
        if (!log)
            return null;
        await this.prisma.waterLog.delete({ where: { id: logId } });
        const today = this.getKSTDate();
        await this.prisma.dailySummary.update({
            where: { userId_date: { userId, date: today } },
            data: { totalMl: { decrement: log.amount } },
        }).catch(() => { });
        return log;
    }
    async getToday(userId) {
        const today = this.getKSTDate();
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
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
        const gauge = this.calculateGauge(user, totalMl);
        const now = new Date();
        const kstHour = (now.getUTCHours() + 9) % 24;
        const sleepHour = parseInt(user.sleepTime.split(':')[0]);
        const settlementHour = sleepHour - 2;
        const isSettlementTime = kstHour >= settlementHour;
        let catState;
        if (isSettlementTime && progress >= 100) {
            catState = 'perfect';
        }
        else if (gauge >= 70) {
            catState = 'happy';
        }
        else if (gauge >= 40) {
            catState = 'normal';
        }
        else if (gauge >= 15) {
            catState = 'thirsty';
        }
        else {
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
    async getCalendar(userId, month) {
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
    async getWeekly(userId) {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() + 9 * 3600000 - i * 86400000);
            days.push(d.toISOString().slice(0, 10));
        }
        const summaries = await this.prisma.dailySummary.findMany({
            where: { userId, date: { in: days } },
        });
        const map = new Map(summaries.map(s => [s.date, s]));
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
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
    async getStreak(userId) {
        const summaries = await this.prisma.dailySummary.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 365,
        });
        let streak = 0;
        const today = this.getKSTDate();
        for (const s of summaries) {
            const expected = new Date(Date.now() + 9 * 3600000 - streak * 86400000)
                .toISOString().slice(0, 10);
            if (s.date === expected && s.totalMl >= s.goalMl) {
                streak++;
            }
            else if (s.date === today && s.totalMl < s.goalMl) {
                continue;
            }
            else {
                break;
            }
        }
        return { streak };
    }
    calculateGauge(user, totalMl) {
        const now = new Date();
        const kstHour = (now.getUTCHours() + 9) % 24;
        const kstMin = now.getUTCMinutes();
        const wakeHour = parseInt(user.wakeTime.split(':')[0]);
        const wakeMin = parseInt(user.wakeTime.split(':')[1] || '0');
        const sleepHour = parseInt(user.sleepTime.split(':')[0]);
        const activeHours = sleepHour - wakeHour;
        const elapsedHours = Math.max(0, (kstHour + kstMin / 60) - (wakeHour + wakeMin / 60));
        const drainTotal = user.goalMl * 0.3;
        const drained = (drainTotal / activeHours) * Math.min(elapsedHours, activeHours);
        const netMl = totalMl - drained;
        const gauge = Math.max(0, Math.round((netMl / user.goalMl) * 100));
        return Math.min(gauge, 100);
    }
    getKSTDate() {
        return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    }
    getKSTStartOfDay() {
        const kstDate = this.getKSTDate();
        return new Date(`${kstDate}T00:00:00+09:00`);
    }
    getKSTEndOfDay() {
        const kstDate = this.getKSTDate();
        return new Date(`${kstDate}T23:59:59+09:00`);
    }
};
exports.WaterService = WaterService;
exports.WaterService = WaterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WaterService);
//# sourceMappingURL=water.service.js.map