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
exports.MysqlWriteRepository = void 0;
const knex_1 = require("knex");
class MysqlWriteRepository {
    constructor(config) {
        this.hit_count_tablename = 'hit_count';
        this.provider_hit_count_tablename = 'provider_hit_count';
        this.error_count_tablename = 'error_count';
        this.knexInstance = (0, knex_1.knex)(config);
    }
    incrementStatRecord(statRecord, incrementBy = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.knexInstance.table(this.hit_count_tablename)
                .insert(Object.assign({ record_key: statRecord.key, entryPoint: statRecord.entryPoint, server: statRecord.server, profile: statRecord.profile }, statRecord.timestamp))
                .onConflict('record_key')
                .merge({
                total: this.knexInstance.raw(`?? + ${incrementBy}`, 'total')
            })
                .then((res) => {
                return res;
            })
                .catch(function (error) {
                console.error(error.stack);
            });
        });
    }
    incrementProviderStatRecord(statRecord, incrementBy = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.knexInstance.table(this.provider_hit_count_tablename)
                .insert(Object.assign({ record_key: statRecord.key, entryPoint: statRecord.entryPoint, provider: statRecord.provider, server: statRecord.server, profile: statRecord.profile }, statRecord.timestamp))
                .onConflict('record_key')
                .merge({
                total: this.knexInstance.raw(`?? + ${incrementBy}`, 'total')
            })
                .then((res) => {
                return res;
            })
                .catch(function (error) {
                console.error(error.stack);
            });
        });
    }
    incrementErrorRecord(statRecord, incrementBy = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.knexInstance.table(this.error_count_tablename)
                .insert(Object.assign({ record_key: statRecord.key, entryPoint: statRecord.entryPoint, provider: statRecord.provider, server: statRecord.server, profile: statRecord.profile }, statRecord.timestamp))
                .onConflict('record_key')
                .merge({
                total: this.knexInstance.raw(`?? + ${incrementBy}`, 'total')
            })
                .then((res) => {
                return res;
            })
                .catch(function (error) {
                console.error(error.stack);
            });
        });
    }
}
exports.MysqlWriteRepository = MysqlWriteRepository;
//# sourceMappingURL=MysqlWriteRepository.js.map