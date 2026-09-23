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
exports.ConfigService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const AppConfig_1 = require("../../domain/entities/AppConfig");
class ConfigService {
    static SENSITIVE_KEYS = new Set([
        'FB_ACCESS_TOKEN',
        'IG_ACCESS_TOKEN',
        'YOUTUBE_API_KEY',
        'TIKTOK_CLIENT_KEY',
        'TIKTOK_CLIENT_SECRET',
        'X_BEARER_TOKEN',
        'LINKEDIN_ACCESS_TOKEN',
        'DATABASE_URL'
    ]);
    static MANAGED_KEYS = [
        'FB_ACCESS_TOKEN',
        'FB_PAGE_ID',
        'IG_ACCESS_TOKEN',
        'IG_USER_ID',
        'YOUTUBE_API_KEY',
        'YOUTUBE_CHANNEL_ID',
        'TIKTOK_CLIENT_KEY',
        'TIKTOK_CLIENT_SECRET',
        'TIKTOK_USERNAME',
        'X_BEARER_TOKEN',
        'X_USERNAME',
        'LINKEDIN_ACCESS_TOKEN',
        'LINKEDIN_ORGANIZATION_ID',
        'LINKEDIN_VANITY_NAME',
        'DATABASE_URL',
        'PORT',
        'NODE_ENV'
    ];
    envPath;
    constructor(envPath) {
        this.envPath = envPath || path.resolve(__dirname, '../../../../.env');
        dotenv.config({ path: this.envPath });
    }
    loadConfig() {
        const items = [];
        for (const key of ConfigService.MANAGED_KEYS) {
            const val = process.env[key] || '';
            items.push({
                key,
                value: val,
                isSensitive: ConfigService.SENSITIVE_KEYS.has(key)
            });
        }
        return new AppConfig_1.AppConfig(items);
    }
    saveConfig(updates) {
        // 1. Update in-memory process.env
        for (const [key, val] of Object.entries(updates)) {
            process.env[key] = val;
        }
        // 2. Persist to .env file
        try {
            let existingContent = '';
            if (fs.existsSync(this.envPath)) {
                existingContent = fs.readFileSync(this.envPath, 'utf-8');
            }
            const lines = existingContent.split('\n');
            const updatedKeys = new Set();
            const newLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) {
                    return line;
                }
                const eqIdx = line.indexOf('=');
                if (eqIdx !== -1) {
                    const k = line.substring(0, eqIdx).trim();
                    if (k in updates) {
                        updatedKeys.add(k);
                        return `${k}=${updates[k]}`;
                    }
                }
                return line;
            });
            // Append any new keys not already in the file
            for (const [k, v] of Object.entries(updates)) {
                if (!updatedKeys.has(k)) {
                    newLines.push(`${k}=${v}`);
                }
            }
            fs.writeFileSync(this.envPath, newLines.join('\n'), 'utf-8');
        }
        catch (err) {
            console.error('[CONFIG] Error writing to .env file:', err);
        }
    }
}
exports.ConfigService = ConfigService;
