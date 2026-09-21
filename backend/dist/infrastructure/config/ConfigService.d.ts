import { AppConfig } from '../../domain/entities/AppConfig';
export declare class ConfigService {
    private static readonly SENSITIVE_KEYS;
    private static readonly MANAGED_KEYS;
    private envPath;
    constructor(envPath?: string);
    loadConfig(): AppConfig;
    saveConfig(updates: Record<string, string>): void;
}
