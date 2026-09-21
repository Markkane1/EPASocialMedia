"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = void 0;
class AppConfig {
    configMap;
    constructor(items = []) {
        this.configMap = new Map();
        items.forEach(item => this.configMap.set(item.key, item));
    }
    get(key) {
        return this.configMap.get(key)?.value || '';
    }
    set(key, value, isSensitive = false) {
        this.configMap.set(key, { key, value, isSensitive });
    }
    getAllMasked() {
        const masked = {};
        for (const [key, item] of this.configMap.entries()) {
            if (item.isSensitive && item.value && item.value.trim().length > 0) {
                masked[key] = this.maskValue(item.value);
            }
            else {
                masked[key] = item.value || '';
            }
        }
        return masked;
    }
    getAllRaw() {
        const raw = {};
        for (const [key, item] of this.configMap.entries()) {
            raw[key] = item.value || '';
        }
        return raw;
    }
    maskValue(val) {
        if (!val || val.length < 8) {
            return '••••••••';
        }
        return `${val.substring(0, 4)}••••••••${val.substring(val.length - 4)}`;
    }
}
exports.AppConfig = AppConfig;
//# sourceMappingURL=AppConfig.js.map