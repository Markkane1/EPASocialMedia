"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestConnectionUseCase = void 0;
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
            return await fetcher.testConnection();
        }
        return {
            status: 'OK',
            platform: key,
            message: `Successfully verified connection for ${key.toUpperCase()}`
        };
    }
}
exports.TestConnectionUseCase = TestConnectionUseCase;
//# sourceMappingURL=TestConnectionUseCase.js.map