"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeyService = void 0;
function createKeyService(config) {
    return {
        createKey(recordOpts, timestamp, granularity) {
            const timestampPart = createTimestampPart(timestamp, granularity);
            return [
                recordOpts.type,
                recordOpts.entryPoint,
                (recordOpts.profile !== undefined) ? recordOpts.profile : '*',
                (recordOpts.provider !== undefined) ? recordOpts.provider : '*',
                ...timestampPart
            ]
                .filter(keyPart => keyPart !== '')
                .join(config.keyDelimiter);
        }
    };
}
exports.createKeyService = createKeyService;
function createTimestampPart(timestamp, granularity) {
    const { year, month, week, day, hour } = timestamp;
    if (granularity !== undefined) {
        switch (granularity) {
            case 'hour':
                return [year, month, week, day, hour];
            case 'day':
                return [year, month, week, day];
            case 'week':
                return [year, month, week];
            case 'month':
                return [year, month];
            case 'year':
                return [year];
            default:
                return Object.values(timestamp);
        }
    }
    const key = [];
    [year, month, week, day, hour].forEach(part => {
        if (part === undefined || part === '') {
            return key;
        }
        key.push(part);
    });
    return key;
}
//# sourceMappingURL=createKey.js.map