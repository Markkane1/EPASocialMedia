"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestConnectionUseCase = void 0;
function sanitizeProviderDetails(details) {
    if (!details)
        return undefined;
    if (typeof details !== 'object') {
        return String(details).replace(/(access_token|bearer|key|secret)=[^&\s]+/gi, '$1=[REDACTED]');
    }
    const clean = Array.isArray(details) ? [] : {};
    for (const [k, v] of Object.entries(details)) {
        if (/token|secret|key|password|auth|credential/i.test(k)) {
            clean[k] = '[REDACTED]';
        }
        else if (typeof v === 'string') {
            clean[k] = v.replace(/(access_token|bearer|key|secret)=[^&\s]+/gi, '$1=[REDACTED]');
        }
        else if (typeof v === 'object' && v !== null) {
            clean[k] = sanitizeProviderDetails(v);
        }
        else {
            clean[k] = v;
        }
    }
    return clean;
}
class TestConnectionUseCase {
    fetcherMap;
    constructor(fetchers) {
        this.fetcherMap = new Map();
        fetchers.forEach(f => this.fetcherMap.set(f.platformKey.toLowerCase(), f));
    }
    async execute(platform) {
        const key = (platform || 'general').toLowerCase().trim();
        const fetcher = this.fetcherMap.get(key);
        if (fetcher) {
            const result = await fetcher.testConnection();
            if (result.details) {
                result.details = sanitizeProviderDetails(result.details);
            }
            return result;
        }
        return {
            status: 'ERROR',
            platform: key,
            message: `Unknown or unconfigured platform: "${key}". Supported platforms are: ${Array.from(this.fetcherMap.keys()).join(', ')}`
        };
    }
}
exports.TestConnectionUseCase = TestConnectionUseCase;
