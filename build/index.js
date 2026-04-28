"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatsClient = void 0;
const createKey_1 = require("./service/createKey");
const createWriteRepository_1 = require("./service/createWriteRepository");
const updateStats_1 = require("./service/updateStats");
/**
 * Фабрика: принимает конфигурацию и возвращает готовый к работе клиент.
 */
function createStatsClient(cfg) {
    const writeRepository = (0, createWriteRepository_1.createWriteRepository)(cfg.storage);
    const keyService = (0, createKey_1.createKeyService)({ keyDelimiter: cfg.keyDelimiter });
    return {
        updateHits: (req) => (0, updateStats_1.updateAPIStats)(req, writeRepository, keyService),
        updateProviderHits: (req) => (0, updateStats_1.updateProviderStats)(req, writeRepository, keyService),
        updateErrors: (req) => (0, updateStats_1.updateErrorStats)(req, writeRepository, keyService),
        updateExternalCalls: (req) => (0, updateStats_1.updateExternalAPIUsageStats)(req, writeRepository, keyService),
    };
}
exports.createStatsClient = createStatsClient;
//# sourceMappingURL=index.js.map