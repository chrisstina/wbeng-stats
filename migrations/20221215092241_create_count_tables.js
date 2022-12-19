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
exports.down = exports.up = void 0;
function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.all([
            knex.schema.createTable('hit_count', function (table) {
                table.string('record_key', 128);
                table.string('entryPoint', 32).notNullable();
                table.string('profile', 32).nullable().defaultTo(null);
                table.smallint('year').notNullable().unsigned();
                table.tinyint('month').notNullable().unsigned();
                table.tinyint('week').notNullable().unsigned();
                table.tinyint('day').notNullable().unsigned();
                table.tinyint('hour').notNullable().unsigned();
                table.tinyint('minute').notNullable().unsigned();
                table.integer('total').notNullable().unsigned().defaultTo(1);
                table.primary(['record_key']);
                table.index('entryPoint');
                table.index('profile');
            }),
            knex.schema.createTable('provider_hit_count', function (table) {
                table.string('record_key', 128);
                table.string('provider', 32).notNullable();
                table.string('entryPoint', 32).notNullable();
                table.string('profile', 32).nullable().defaultTo(null);
                table.smallint('year').notNullable().unsigned();
                table.tinyint('month').notNullable().unsigned();
                table.tinyint('week').notNullable().unsigned();
                table.tinyint('day').notNullable().unsigned();
                table.tinyint('hour').notNullable().unsigned();
                table.tinyint('minute').notNullable().unsigned();
                table.integer('total').notNullable().unsigned().defaultTo(1);
                table.primary(['record_key']);
                table.index('entryPoint');
                table.index('profile');
                table.index('provider');
            }),
            knex.schema.createTable('error_count', function (table) {
                table.string('record_key', 128);
                table.string('provider', 32).notNullable();
                table.string('entryPoint', 32).notNullable();
                table.string('profile', 32).nullable().defaultTo(null);
                table.smallint('year').notNullable().unsigned();
                table.tinyint('month').notNullable().unsigned();
                table.tinyint('week').notNullable().unsigned();
                table.tinyint('day').notNullable().unsigned();
                table.tinyint('hour').notNullable().unsigned();
                table.tinyint('minute').notNullable().unsigned();
                table.integer('total').notNullable().unsigned().defaultTo(1);
                table.primary(['record_key']);
                table.index('entryPoint');
                table.index('profile');
                table.index('provider');
            })
        ]);
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.all([
            knex.schema.dropTable('hit_count'),
            knex.schema.dropTable('provider_hit_count'),
            knex.schema.dropTable('error_count')
        ]);
    });
}
exports.down = down;
//# sourceMappingURL=20221215092241_create_count_tables.js.map