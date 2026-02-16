import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwt;
    private googleClient;
    constructor(prisma: PrismaService, jwt: JwtService);
    googleLogin(idToken: string): Promise<{
        token: string;
        user: {
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
        };
        isNewUser: boolean;
    }>;
    appleLogin(identityToken: string, email?: string, fullName?: string): Promise<{
        token: string;
        user: {
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
        };
        isNewUser: boolean;
    }>;
    devLogin(email: string): Promise<{
        token: string;
        user: {
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
        };
    }>;
}
