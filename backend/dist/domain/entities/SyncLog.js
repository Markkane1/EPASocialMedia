"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncLog = void 0;
class SyncLog {
    id;
    timestamp;
    status;
    message;
    details;
    constructor(props) {
        this.id = props.id;
        this.timestamp = props.timestamp || new Date().toISOString();
        this.status = props.status;
        this.message = props.message;
        this.details = props.details;
    }
    toJSON() {
        return {
            timestamp: this.timestamp,
            status: this.status,
            message: this.message,
            ...(this.details ? { details: this.details } : {})
        };
    }
}
exports.SyncLog = SyncLog;
