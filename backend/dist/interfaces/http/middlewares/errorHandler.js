"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`[ERROR] [${req.method} ${req.path}] ${message}`, err.stack || '');
    res.status(status).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
}
//# sourceMappingURL=errorHandler.js.map