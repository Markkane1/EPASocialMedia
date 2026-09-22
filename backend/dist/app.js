"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const requestLogger_1 = require("./interfaces/http/middlewares/requestLogger");
const errorHandler_1 = require("./interfaces/http/middlewares/errorHandler");
const apiRouter_1 = require("./interfaces/http/routes/apiRouter");
const securityHeaders_1 = require("./interfaces/http/middlewares/securityHeaders");
function createApp() {
    const app = (0, express_1.default)();
    // 1. Security Headers & Browser Hardening (CSP, nosniff, DENY frame, etc.)
    app.use(securityHeaders_1.securityHeaders);
    // 2. Strict Whitelist-Enforced CORS
    app.use((0, securityHeaders_1.createCorsMiddleware)());
    // 3. Body Parsing & Logging
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(requestLogger_1.requestLogger);
    // 4. CSRF Defense for State-Changing Requests
    app.use(securityHeaders_1.csrfProtection);
    // Mount API Endpoints
    const apiRouter = (0, apiRouter_1.createApiRouter)();
    app.use('/api', apiRouter);
    // Serve Frontend Assets (Clean separation: frontend static distribution)
    const frontendPublicDir = path.resolve(__dirname, '../../frontend/public');
    const frontendSrcDir = path.resolve(__dirname, '../../frontend/src');
    app.use(express_1.default.static(frontendPublicDir));
    app.use('/src', express_1.default.static(frontendSrcDir));
    // Default SPA route
    app.get('/', (req, res) => {
        res.sendFile(path.join(frontendPublicDir, 'index.html'));
    });
    // Global Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map