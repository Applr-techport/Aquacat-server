export declare class AppController {
    root(): {
        name: string;
        version: string;
        status: string;
    };
    healthCheck(): {
        status: string;
        timestamp: string;
    };
}
