"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsController = void 0;
class MetricsController {
    getMetricsUseCase;
    constructor(getMetricsUseCase) {
        this.getMetricsUseCase = getMetricsUseCase;
    }
    async getMetrics(req, res, next) {
        try {
            const period = req.query.period;
            const from = req.query.from;
            const to = req.query.to;
            const result = await this.getMetricsUseCase.execute({ period, from, to });
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MetricsController = MetricsController;
//# sourceMappingURL=MetricsController.js.map