"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeyService = void 0;
const CreateWbengAPIErrorRecord_1 = require("../dto/CreateWbengAPIErrorRecord");
function createKeyService(config) {
    return {
        createKey(request, timestamp) {
            let statType = 'request';
            if ((0, CreateWbengAPIErrorRecord_1.instanceOfAPIErrorRecord)(request)) {
                statType = 'error';
            }
            return [
                statType,
                request.entryPoint,
                request.profile,
                (request.provider != null) ? request.provider : '',
                ...Object.values(timestamp)
            ]
                .filter(keyPart => keyPart !== '')
                .join(config.keyDelimiter);
        }
    };
}
exports.createKeyService = createKeyService;
//# sourceMappingURL=createKey.js.map