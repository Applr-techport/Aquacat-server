import { HealthService } from './health.service';
export declare class HealthController {
    private healthService;
    constructor(healthService: HealthService);
    getDailyTip(): Promise<{
        tip: string;
    }>;
    seedTips(): Promise<{
        seeded: number;
    }>;
}
