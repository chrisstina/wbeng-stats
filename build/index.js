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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProvider = exports.updateTotal = void 0;
const config_1 = __importDefault(require("config"));
const createKey_1 = require("./service/createKey");
const createWriteRepository_1 = require("./service/createWriteRepository");
const updateStats_1 = require("./service/updateStats");
const statsConfig = config_1.default.get('stats');
const writeRepository = (0, createWriteRepository_1.createWriteRepository)(statsConfig.get('storage'));
const keyService = (0, createKey_1.createKeyService)({ keyDelimiter: statsConfig.get('keyDelimiter') });
function updateTotal(request) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, updateStats_1.updateAPIStats)(request, writeRepository, keyService);
    });
}
exports.updateTotal = updateTotal;
function updateProvider(request) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, updateStats_1.updateProviderStats)(request, writeRepository, keyService);
    });
}
exports.updateProvider = updateProvider;
//# sourceMappingURL=index.js.map