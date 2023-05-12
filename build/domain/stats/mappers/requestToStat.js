"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestToTimestampedStatRecord = void 0;
const dateToTimestamp_1 = require("./dateToTimestamp");
/**
 * Used for aggregated stats
 * @param request
 * @param keyService
 */
function requestToTimestampedStatRecord(request, keyService) {
    const timestamp = (0, dateToTimestamp_1.dateToTimestamp)(new Date());
    const key = keyService.createKey(request, timestamp, "minute");
    return Object.assign(Object.assign({ key }, request), { timestamp });
}
exports.requestToTimestampedStatRecord = requestToTimestampedStatRecord;
//# sourceMappingURL=requestToStat.js.map