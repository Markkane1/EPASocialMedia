"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigController = void 0;
class ConfigController {
    configUseCase;
    testConnectionUseCase;
    constructor(configUseCase, testConnectionUseCase) {
        this.configUseCase = configUseCase;
        this.testConnectionUseCase = testConnectionUseCase;
    }
    async getConfig(req, res, next) {
        try {
            const config = await this.configUseCase.getMaskedConfig();
            res.status(200).json(config);
        }
        catch (err) {
            next(err);
        }
    }
    async updateConfig(req, res, next) {
        try {
            const updates = req.body || {};
            const result = await this.configUseCase.updateConfig(updates);
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async testConnection(req, res, next) {
        try {
            const platform = req.body?.platform || 'general';
            const result = await this.testConnectionUseCase.execute(platform);
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ConfigController = ConfigController;
