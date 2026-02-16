import { PrismaService } from '../prisma/prisma.service';
export declare class WaterService {
    private prisma;
    constructor(prisma: PrismaService);
    logWater(userId: string, amount: number, drinkType?: string): Promise<{
        id: string;
        amount: number;
        drinkType: string;
        loggedAt: Date;
        userId: string;
    }>;
    deleteLog(userId: string, logId: string): Promise<{
        id: string;
        amount: number;
        drinkType: string;
        loggedAt: Date;
        userId: string;
    } | null>;
    getToday(userId: string): Promise<{
        logs: {
            id: string;
            amount: number;
            drinkType: string;
            loggedAt: Date;
            userId: string;
        }[];
        totalMl: number;
        goalMl: number;
        progress: number;
        gauge: number;
        catState: string;
    }>;
    getCalendar(userId: string, month: string): Promise<{
        date: string;
        totalMl: number;
        goalMl: number;
        achieved: boolean;
        percentage: number;
    }[]>;
    getWeekly(userId: string): Promise<{
        date: string;
        totalMl: number;
        goalMl: number;
        achieved: boolean;
    }[]>;
    getStreak(userId: string): Promise<{
        streak: number;
    }>;
    private calculateGauge;
    private getKSTDate;
    private getKSTStartOfDay;
    private getKSTEndOfDay;
}
