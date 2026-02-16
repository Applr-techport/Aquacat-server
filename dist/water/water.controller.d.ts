import { WaterService } from './water.service';
export declare class WaterController {
    private waterService;
    constructor(waterService: WaterService);
    logWater(req: any, amount: number, drinkType?: string): Promise<{
        id: string;
        amount: number;
        drinkType: string;
        loggedAt: Date;
        userId: string;
    }>;
    deleteLog(req: any, id: string): Promise<{
        id: string;
        amount: number;
        drinkType: string;
        loggedAt: Date;
        userId: string;
    } | null>;
    getToday(req: any): Promise<{
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
    getCalendar(req: any, month: string): Promise<{
        date: string;
        totalMl: number;
        goalMl: number;
        achieved: boolean;
        percentage: number;
    }[]>;
    getWeekly(req: any): Promise<{
        date: string;
        totalMl: number;
        goalMl: number;
        achieved: boolean;
    }[]>;
    getStreak(req: any): Promise<{
        streak: number;
    }>;
}
