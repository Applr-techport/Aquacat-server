import { PrismaService } from '../prisma/prisma.service';
export declare class HealthService {
    private prisma;
    private defaultTips;
    constructor(prisma: PrismaService);
    getDailyTip(): Promise<{
        tip: string;
    }>;
    seedTips(): Promise<{
        seeded: number;
    }>;
}
