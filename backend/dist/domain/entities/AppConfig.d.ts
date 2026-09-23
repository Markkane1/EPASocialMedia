export interface ConfigKeyItem {
    key: string;
    value: string;
    isSensitive: boolean;
}
export declare class AppConfig {
    private configMap;
    constructor(items?: ConfigKeyItem[]);
    get(key: string): string;
    set(key: string, value: string, isSensitive?: boolean): void;
    getAllMasked(): Record<string, string>;
    private maskValue;
}
