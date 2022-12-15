"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestToErrorStatRecord = exports.requestToTimestampedStatRecord = void 0;
const dateToTimestamp_1 = require("./dateToTimestamp");
function requestToTimestampedStatRecord(request, keyService) {
    const timestamp = (0, dateToTimestamp_1.dateToTimestamp)(new Date());
    const key = keyService.createKey(request, timestamp);
    return Object.assign(Object.assign({ key }, request), { timestamp });
}
exports.requestToTimestampedStatRecord = requestToTimestampedStatRecord;
function requestToErrorStatRecord(request, keyService) {
    const timestamp = (0, dateToTimestamp_1.dateToTimestamp)(new Date());
    const key = keyService.createKey(request, timestamp);
    return Object.assign(Object.assign({ key }, request), { timestamp });
}
exports.requestToErrorStatRecord = requestToErrorStatRecord;
//# sourceMappingURL=requestToStat.js.map