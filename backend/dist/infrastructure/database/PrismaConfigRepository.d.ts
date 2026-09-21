import { IConfigRepository } from '../../domain/repositories/IConfigRepository';
import { AppConfig } from '../../domain/entities/AppConfig';
export declare class PrismaConfigRepository implements IConfigRepository {
    private configService;
    constructor(envPath?: string);
    getConfig(): Promise<AppConfig>;
    updateConfig(updates: Record<string, string>): Promise<void>;
    get(key: string): Promise<string>;
}
