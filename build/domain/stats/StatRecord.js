"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatRecord = void 0;
/**
 * VO
 */
class StatRecord {
    constructor(key, timestamp, hasErrors, server, entryPoint, profile, provider) {
        this.key = key;
        this.timestamp = timestamp;
        this.hasErrors = hasErrors;
        this.server = server;
        this.entryPoint = entryPoint;
        this.profile = profile;
        this.provider = provider;
    }
}
exports.StatRecord = StatRecord;
//# sourceMappingURL=StatRecord.js.map