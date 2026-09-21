"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaConfigRepository = void 0;
const ConfigService_1 = require("../config/ConfigService");
const PrismaClientSingleton_1 = require("./PrismaClientSingleton");
class PrismaConfigRepository {
    configService;
    constructor(envPath) {
        this.configService = new ConfigService_1.ConfigService(envPath);
    }
    async getConfig() {
        const config = this.configService.loadConfig();
        const isConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        if (isConnected) {
            try {
                const prisma = PrismaClientSingleton_1.PrismaClientSingleton.getInstance();
                const settings = await prisma.systemSetting.findMany();
                for (const s of settings) {
                    config.set(s.key, s.value, s.isSensitive);
                }
            }
            catch (err) {
                // Fallback to env
            }
        }
        return config;
    }
    async updateConfig(updates) {
        this.configService.saveConfig(updates);
        const isConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        if (isConnected) {
            try {
                const prisma = PrismaClientSingleton_1.PrismaClientSingleton.getInstance();
                for (const [key, value] of Object.entries(updates)) {
                    const isSensitive = ['FB_ACCESS_TOKEN', 'IG_ACCESS_TOKEN', 'YOUTUBE_API_KEY', 'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'X_BEARER_TOKEN', 'LINKEDIN_ACCESS_TOKEN', 'DATABASE_URL'].includes(key);
                    await prisma.systemSetting.upsert({
                        where: { key },
                        update: { value, isSensitive },
                        create: { key, value, isSensitive }
                    });
                }
            }
            catch (err) {
                console.error('[CONFIG] Error updating PostgreSQL system settings:', err);
            }
        }
    }
    async get(key) {
        const config = await this.getConfig();
        return config.get(key);
    }
}
exports.PrismaConfigRepository = PrismaConfigRepository;
//# sourceMappingURL=PrismaConfigRepository.js.map