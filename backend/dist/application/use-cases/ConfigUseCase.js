"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigUseCase = void 0;
class ConfigUseCase {
    configRepo;
    constructor(configRepo) {
        this.configRepo = configRepo;
    }
    async getMaskedConfig() {
        const config = await this.configRepo.getConfig();
        return config.getAllMasked();
    }
    async updateConfig(updates) {
        await this.configRepo.updateConfig(updates);
        return {
            status: 'success',
            message: 'Config updated successfully'
        };
    }
}
exports.ConfigUseCase = ConfigUseCase;
