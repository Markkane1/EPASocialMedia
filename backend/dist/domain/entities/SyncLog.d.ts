export interface SyncLogProps {
    id?: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error' | 'initialized';
    message: string;
    details?: Record<string, any>;
}
export declare class SyncLog {
    readonly id?: string;
    readonly timestamp: string;
    readonly status: 'success' | 'warning' | 'error' | 'initialized';
    readonly message: string;
    readonly details?: Record<string, any>;
    constructor(props: SyncLogProps);
    toJSON(): {
        details?: Record<string, any> | undefined;
        timestamp: string;
        status: "error" | "success" | "warning" | "initialized";
        message: string;
    };
}
