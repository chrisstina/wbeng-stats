"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateToTimestamp = void 0;
const luxon_1 = require("luxon");
function dateToTimestamp(date) {
    const d = luxon_1.DateTime.fromJSDate(date);
    return {
        year: d.toFormat('y'),
        month: d.toFormat('MM'),
        week: d.toFormat('W'),
        day: d.toFormat('dd'),
        hour: d.toFormat('HH'),
        minute: d.toFormat('mm')
    };
}
exports.dateToTimestamp = dateToTimestamp;
//# sourceMappingURL=dateToTimestamp.js.map