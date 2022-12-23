"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestToTimestampedStatRecord = void 0;
const dateToTimestamp_1 = require("./dateToTimestamp");
const CreateWbengAPIErrorRecord_1 = require("../../../dto/CreateWbengAPIErrorRecord");
function requestToTimestampedStatRecord(request, keyService) {
    const timestamp = (0, dateToTimestamp_1.dateToTimestamp)(new Date());
    let statType = 'request';
    if ((0, CreateWbengAPIErrorRecord_1.instanceOfAPIErrorRecord)(request)) {
        statType = 'error';
    }
    const key = keyService.createKey(Object.assign({ type: statType }, request), timestamp, 'minute');
    return Object.assign(Object.assign({ key }, request), { timestamp });
}
exports.requestToTimestampedStatRecord = requestToTimestampedStatRecord;
//# sourceMappingURL=requestToStat.js.map