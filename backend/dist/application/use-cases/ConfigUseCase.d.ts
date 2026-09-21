import { IConfigRepository } from '../../domain/repositories/IConfigRepository';
export declare class ConfigUseCase {
    private readonly configRepo;
    constructor(configRepo: IConfigRepository);
    getMaskedConfig(): Promise<Record<string, string>>;
    updateConfig(updates: Record<string, string>): Promise<{
        status: string;
        message: string;
    }>;
}
