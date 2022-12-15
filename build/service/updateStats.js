"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStats = void 0;
const requestToStat_1 = require("../domain/stats/mappers/requestToStat");
function updateStats(request, type, writeRepository, keyService) {
    return __awaiter(this, void 0, void 0, function* () {
        // @todo validation
        if (type === 'request') {
            const statRecord = (0, requestToStat_1.requestToTimestampedStatRecord)(request, keyService);
            return yield writeRepository.incrementStatRecord(statRecord);
        }
        if (type === 'error') {
            const statRecord = (0, requestToStat_1.requestToErrorStatRecord)(request, keyService);
            return yield writeRepository.incrementErrorStatRecord(statRecord);
        }
        throw new Error('Unknown request type. Expected request or error type.');
    });
}
exports.updateStats = updateStats;
//# sourceMappingURL=updateStats.js.map