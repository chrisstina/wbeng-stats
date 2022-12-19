"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeyService = void 0;
function createKeyService(config) {
    return {
        createKey(request, timestamp) {
            return [request.entryPoint,
                request.profile,
                (request.provider != null) ? request.provider : '',
                request.server,
                ...Object.values(timestamp)]
                .filter(keyPart => keyPart !== '')
                .join(config.keyDelimiter);
        }
    };
}
exports.createKeyService = createKeyService;
//# sourceMappingURL=createKey.js.map