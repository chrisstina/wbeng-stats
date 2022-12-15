"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorStatRecord = void 0;
/**
 * VO
 */
class ErrorStatRecord {
    constructor(key, timestamp, server, entryPoint, profile, provider) {
        this.key = key;
        this.timestamp = timestamp;
        this.server = server;
        this.entryPoint = entryPoint;
        this.profile = profile;
        this.provider = provider;
    }
}
exports.ErrorStatRecord = ErrorStatRecord;
//# sourceMappingURL=ErrorStatRecord.js.map