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
exports.AuthService = void 0;
const crypto = __importStar(require("crypto"));
class AuthService {
    static SECRET = process.env.JWT_SECRET || 'EPA_PUNJAB_SECURE_AUTH_SECRET_2026_KEY_#$';
    static hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }
    static verifyPassword(password, storedHash) {
        const parts = storedHash.split(':');
        if (parts.length !== 2)
            return false;
        const [salt, originalHash] = parts;
        const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
    }
    static createToken(payload, expiresInHours = 24) {
        const fullPayload = {
            ...payload,
            exp: Date.now() + expiresInHours * 3600 * 1000
        };
        const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
        const signature = crypto
            .createHmac('sha256', this.SECRET)
            .update(payloadB64)
            .digest('base64url');
        return `${payloadB64}.${signature}`;
    }
    static verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 2)
                return null;
            const [payloadB64, signature] = parts;
            const expectedSignature = crypto
                .createHmac('sha256', this.SECRET)
                .update(payloadB64)
                .digest('base64url');
            if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
                return null;
            }
            const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
            if (Date.now() > payload.exp) {
                return null; // Expired
            }
            return payload;
        }
        catch {
            return null;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map