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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app_1 = require("./app");
const PrismaClientSingleton_1 = require("./infrastructure/database/PrismaClientSingleton");
const AuthService_1 = require("./infrastructure/auth/AuthService");
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
async function bootstrap() {
    // Validate production security configuration
    AuthService_1.AuthService.validateStartupConfig();
    // Verify Database connectivity asynchronously
    await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
    const app = (0, app_1.createApp)();
    const server = app.listen(PORT, HOST, () => {
        console.log(`[SERVER] Backend service active on http://${HOST}:${PORT}`);
        console.log(`[SERVER] API Root: http://${HOST}:${PORT}/api/metrics`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[FATAL] Port ${PORT} is already in use. Refusing to run on arbitrary fallback port in production.`);
            process.exit(1);
        }
        else {
            console.error('[SERVER] Fatal server error:', err);
            process.exit(1);
        }
    });
    // Graceful shutdown handling
    const shutdown = async () => {
        console.log('\n[SERVER] Gracefully shutting down...');
        server.close(async () => {
            const prisma = PrismaClientSingleton_1.PrismaClientSingleton.getInstance();
            await prisma.$disconnect();
            console.log('[SERVER] All connections closed.');
            process.exit(0);
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason);
    });
    process.on('uncaughtException', (err) => {
        console.error('[SERVER] Uncaught Exception:', err);
    });
}
if (require.main === module) {
    bootstrap();
}
