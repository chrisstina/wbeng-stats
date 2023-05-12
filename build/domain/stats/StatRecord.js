"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatRecord = void 0;
/**
 * VO
 */
class StatRecord {
    constructor(key, timestamp, entryPoint, operationName, profile, provider) {
        this.key = key;
        this.timestamp = timestamp;
        this.entryPoint = entryPoint;
        this.operationName = operationName;
        this.profile = profile;
        this.provider = provider;
    }
}
exports.StatRecord = StatRecord;
//# sourceMappingURL=StatRecord.js.map