import { IConfigRepository } from '../../domain/repositories/IConfigRepository';
import { AppConfig } from '../../domain/entities/AppConfig';
import { ConfigService } from '../config/ConfigService';
import { PrismaClientSingleton } from './PrismaClientSingleton';

export class PrismaConfigRepository implements IConfigRepository {
  private configService: ConfigService;

  constructor(envPath?: string) {
    this.configService = new ConfigService(envPath);
  }

  public async getConfig(): Promise<AppConfig> {
    const config = this.configService.loadConfig();

    const isConnected = await PrismaClientSingleton.checkConnection();
    if (isConnected) {
      try {
        const prisma = PrismaClientSingleton.getInstance();
        const settings = await prisma.systemSetting.findMany();
        for (const s of settings) {
          config.set(s.key, s.value, s.isSensitive);
        }
      } catch (err) {
        // Fallback to env
      }
    }

    return config;
  }

  public async updateConfig(updates: Record<string, string>): Promise<void> {
    this.configService.saveConfig(updates);

    const isConnected = await PrismaClientSingleton.checkConnection();
    if (isConnected) {
      try {
        const prisma = PrismaClientSingleton.getInstance();
        for (const [key, value] of Object.entries(updates)) {
          const isSensitive = ['FB_ACCESS_TOKEN', 'IG_ACCESS_TOKEN', 'YOUTUBE_API_KEY', 'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'X_BEARER_TOKEN', 'LINKEDIN_ACCESS_TOKEN', 'DATABASE_URL'].includes(key);
          await prisma.systemSetting.upsert({
            where: { key },
            update: { value, isSensitive },
            create: { key, value, isSensitive }
          });
        }
      } catch (err) {
        console.error('[CONFIG] Error updating PostgreSQL system settings:', err);
      }
    }
  }

  public async get(key: string): Promise<string> {
    const config = await this.getConfig();
    return config.get(key);
  }
}
