"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeyService = void 0;
const CreateExternalAPICallRecord_1 = require("../dto/CreateExternalAPICallRecord");
const CreateWbengAPIHitRecord_1 = require("../dto/CreateWbengAPIHitRecord");
const CreateWbengAPIErrorRecord_1 = require("../dto/CreateWbengAPIErrorRecord");
function createTimestampPart(timestamp, granularity) {
    const { year, month, week, day, hour } = timestamp;
    if (granularity !== undefined) {
        switch (granularity) {
            case "hour":
                return [year, month, week, day, hour];
            case "day":
                return [year, month, week, day];
            case "week":
                return [year, month, week];
            case "month":
                return [year, month];
            case "year":
                return [year];
            default:
                return Object.values(timestamp);
        }
    }
    const key = [];
    [year, month, week, day, hour].forEach((part) => {
        if (part === undefined || part === "") {
            return key;
        }
        key.push(part);
    });
    return key;
}
function normalizeOperationName(name) {
    return name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
}
function createKeyService(config) {
    return {
        createKey(recordOpts, timestamp, granularity) {
            const keyParts = [];
            const timestampPart = createTimestampPart(timestamp, granularity);
            if ((0, CreateExternalAPICallRecord_1.instanceOfExternalAPICallRecord)(recordOpts)) {
                // @todo normalize operation name
                keyParts.push(normalizeOperationName(recordOpts.operationName), recordOpts.provider, recordOpts.profile !== undefined ? recordOpts.profile : "*");
            }
            else if ((0, CreateWbengAPIHitRecord_1.instanceOfWbengAPIHitRecord)(recordOpts)) {
                let statType = "request";
                if ((0, CreateWbengAPIErrorRecord_1.instanceOfAPIErrorRecord)(recordOpts)) {
                    statType = "error";
                }
                keyParts.push(statType, recordOpts.entryPoint, recordOpts.profile !== undefined ? recordOpts.profile : "*", recordOpts.provider !== undefined ? recordOpts.provider : "*");
            }
            return [
                ...keyParts,
                ...timestampPart
            ]
                .filter((keyPart) => keyPart !== "")
                .join(config.keyDelimiter);
        }
    };
}
exports.createKeyService = createKeyService;
//# sourceMappingURL=createKey.js.map