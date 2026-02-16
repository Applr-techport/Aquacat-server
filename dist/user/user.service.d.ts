import { PrismaService } from '../prisma/prisma.service';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        provider: string;
        displayName: string | null;
        gender: string | null;
        birthYear: number | null;
        weight: number;
        wakeTime: string;
        sleepTime: string;
        activityLevel: string;
        goalMl: number;
        isPremium: boolean;
        mealTimes: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    updateProfile(userId: string, data: {
        displayName?: string;
        gender?: string;
        birthYear?: number;
        weight?: number;
        wakeTime?: string;
        sleepTime?: string;
        activityLevel?: string;
        mealTimes?: string;
    }): Promise<{
        id: string;
        email: string;
        provider: string;
        displayName: string | null;
        gender: string | null;
        birthYear: number | null;
        weight: number;
        wakeTime: string;
        sleepTime: string;
        activityLevel: string;
        goalMl: number;
        isPremium: boolean;
        mealTimes: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    completeOnboarding(userId: string, data: {
        displayName: string;
        gender?: string;
        birthYear?: number;
        weight: number;
        wakeTime: string;
        sleepTime: string;
        activityLevel: string;
        mealTimes?: string;
    }): Promise<{
        id: string;
        email: string;
        provider: string;
        displayName: string | null;
        gender: string | null;
        birthYear: number | null;
        weight: number;
        wakeTime: string;
        sleepTime: string;
        activityLevel: string;
        goalMl: number;
        isPremium: boolean;
        mealTimes: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
