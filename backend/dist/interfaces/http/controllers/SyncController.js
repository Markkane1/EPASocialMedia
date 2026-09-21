"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
class SyncController {
    syncUseCase;
    constructor(syncUseCase) {
        this.syncUseCase = syncUseCase;
    }
    async syncAll(req, res, next) {
        try {
            const result = await this.syncUseCase.execute();
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SyncController = SyncController;
//# sourceMappingURL=SyncController.js.map