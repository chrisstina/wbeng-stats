"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeyService = void 0;
function createKeyService(config) {
    return {
        createKey(request, timestamp) {
            return [request.entryPoint,
                request.profile,
                (request.provider != null) || '',
                request.server,
                ...Object.values(timestamp)].join(config.keyDelimiter);
        }
    };
}
exports.createKeyService = createKeyService;
//# sourceMappingURL=createKey.js.map