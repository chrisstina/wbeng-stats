import {Knex} from "knex";

export async function up(knex: Knex): Promise<void[]> {
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
}

export async function down(knex: Knex): Promise<void[]> {
    return Promise.all([
        knex.schema.dropTable('hit_count'),
        knex.schema.dropTable('provider_hit_count'),
        knex.schema.dropTable('error_count')
    ]);
}
