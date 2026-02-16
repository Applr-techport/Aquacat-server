import { UserService } from './user.service';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, body: any): Promise<{
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
    completeOnboarding(req: any, body: any): Promise<{
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
