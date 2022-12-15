"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWriteRepository = void 0;
const MysqlWriteRepository_1 = require("../../infrastructure/storage/mysql/MysqlWriteRepository");
function createWriteRepository(storageType, storageConfig = {}) {
    if (storageType === "mysql") {
        return new MysqlWriteRepository_1.MysqlWriteRepository();
    }
    throw new Error('Unsupported storage type');
}
exports.createWriteRepository = createWriteRepository;
//# sourceMappingURL=createWriteRepository.js.map