/*
 * Copyright (c) 2020
 */

const assert = require('assert'),
    config = require('config'),
    moment = require('moment');

config.util.setModuleDefaults('stats', require('./config.js'));

const logger = require('./logger');
const validate = require('./validator');

const StatsUpdater = require('./service/StatsUpdater');
const StatsReader = require('./service/StatsReader');
const {precisionFormats} = require('./service/precision');

let storageIsReady = false;

/**
 *
 * @type {Storage}
 */
let storageService;

/**
 *
 * @param storageName redis \ mysql \ mongo
 * @return {Promise<void>}
 */
const initStorageService = storageName => {
    try {
        const Storage = require(`./storage/${storageName}-storage`);
        storageService = new Storage(config);
        return storageService
            .connect()
            .then(() => {
                storageIsReady = true;
                logger.info(`[STATS][STORAGE] Подключено хранилище ${storageName}`);
            }).catch(e => {
                logger.error(`[STATS][STORAGE] Не удалось подключиться к хранилищу: ${e.stack}`);
            });
    } catch (e) {
        logger.error(`[STATS][STORAGE] Не удалось найти хранилище: ${e.stack}`);
    }
};

const defaultRealtimePrecision = config.get('stats.realtimePrecisions')[0];
const defaultStatsPrecision = config.get('stats.statsPrecisions')[0];

/**
 *
 * @param {string} precision - day, week, month, year
 * @return {string} текущее значение в нужном формате: например: 1.Aug.2020, 34.2020, Aug.2020, 2020
 */
const getDefaultValueForPrecision = precision =>  moment().format(precisionFormats.get(precision).replace(/:/g, ''));

/**
 *
 * @type {{connect: function(), getAllowedRealtimePrecisions: function(): value, getAllowedStatsPrecisions: function(): value, getAllowedOperations: function(): value, getAllowedProfiles: function(): value, validateStatsDate: function(*, *=), updateAPICalls: function(*, string=), updateProviderAPICalls: function({name: string, code: string}, {profile: string, entryPoint: string, WBtoken: string}, string=), getAPICallsRealtime: function((string|null)=, (string|null)=, (string|null)=, *=, *=), getAPIErrorsRealtime: function((string|null)=, (string|null)=, (string|null)=), getAPICallsStats: function(*=, (String|null)=, (String|null)=), getProviderAPICallsStats: function(String, (String|null)=, (String|null)=, (String|null)=), getAPICallsStatsByProfile: function((String|null)=, (String|null)=), getAPICallsStatsByProvider: function(String, (String|null)=, (String|null)=), cleanup: function()}}
 */
module.exports = {
    connect: () => {
        return initStorageService(config.get('stats.storage'));
    },
    /**
     * Список допустимых отрезков времени для получения данных реального времени
     * @return {[]}
     */
    getAllowedRealtimePrecisions: () => config.get('stats.realtimePrecisions'),
    /**
     * Список допустимых отрезков времени для получения данных статистики запросов
     * @return {[]}
     */
    getAllowedStatsPrecisions: () => config.get('stats.statsPrecisions'),
    /**
     * Список допустимых названий API методов
     * @return {[]}
     */
    getAllowedOperations: () => config.get('stats.allowedOperations'),
    /**
     * Список допустимых названий профилей @todo ask wbeng
     */
    getAllowedProfiles: () => config.get('stats.allowedProfiles'),
    /**
     * Валидирует данные для получения статистики на конкретный отрезок времени
     * @param precision
     * @param value
     */
    validateStatsDate: (precision, value) => {
        validate.checkers[precision](value);
    },
    /**
     * Обновит все счетчики обращений к апи
     * @param {string} type тип записи - request | error
     * @param expressRequest
     */
    updateAPICalls: (expressRequest, type = "request") => {
        logger.verbose(`[STATS][UPD] Update API ${type} stats, ${process.env.NODE_ENV} env`);

        assert(expressRequest.entryPoint !== undefined, 'Need entryPoint');
        assert(expressRequest.profile !== undefined, 'Need profile');
        assert(storageIsReady);

        const {entryPoint, profile} = expressRequest;

        const updater = new StatsUpdater(storageService, type, precisionFormats);

        updater.incrementRealtimeCounter();// все запросы всех пользователей
        updater.incrementRealtimeCounter(entryPoint); // конкретный тип запроса всех пользователей
        updater.incrementOperationTotals(entryPoint);
        if (profile) {
            updater.incrementRealtimeCounter(null, profile);  // все запросы пользователя
            updater.incrementRealtimeCounter(entryPoint, profile); // конкретный тип запроса пользователя
            updater.incrementOperationTotals(entryPoint, profile);
        }
    },

    /**
     * Обновит счетчик обращений к АПИ конкретного провайдера
     *
     * @param {{name: string, code: string}} provider
     * @param {{profile: string, entryPoint: string, WBtoken: string}} parameters
     * @param {string} type тип записи - request | error
     */
    updateProviderAPICalls: (provider, parameters, type = "request") => {
        const updater = new StatsUpdater(storageService, type, precisionFormats);
        updater.incrementProviderOperationTotals(provider.code, parameters.entryPoint);
        updater.incrementProviderOperationTotals(provider.code, parameters.entryPoint, parameters.profile);
    },

    /**
     *
     * @param {string|null} precision - precision title from config, e.g. "1 minutes", "3 months"
     * @param {string|null} entryPoint
     * @param {string|null} profile
     * @param limit
     * @param offset
     * @return {Promise<{}|null>}
     */
    getAPICallsRealtime: async (precision = null, entryPoint = null, profile = null, limit = null, offset = 0) => {
        assert(storageIsReady);

        precision = precision || defaultRealtimePrecision;

        if (config.get('stats.realtimePrecisions').indexOf(precision) === -1) {
            precision = defaultRealtimePrecision;
            logger.warn(`[STATS][VIEW] Invalid precision ${precision}, using default`);
        }
        logger.verbose(`[STATS][VIEW] Retrieve API calls stats for ${precision || 'default precision'}, ${entryPoint || 'all operations'}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService);
        return await reader.getRealtimeCounterData(precision, entryPoint, profile, limit, offset);
    },
    /**
     *
     * @param {string|null} precision - precision title from config, e.g. "1 minutes", "3 months"
     * @param {string|null} entryPoint
     * @param {string|null} profile
     * @return {Promise<{}|null>}
     */
    getAPIErrorsRealtime: async (precision = null, entryPoint = null, profile = null) => {
        assert(storageIsReady);

        precision = precision || defaultRealtimePrecision;

        if (config.get('stats.realtimePrecisions').indexOf(precision) === -1) {
            precision = defaultRealtimePrecision;
            logger.warn(`[STATS][VIEW] Invalid precision ${precision}, using default`);
        }
        logger.verbose(`[STATS][VIEW] Retrieve API calls stats for ${precision || 'default precision'}, ${entryPoint || 'all operations'}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService, 'error');
        return await reader.getRealtimeCounterData(precision, entryPoint, profile);
    },

    /**
     * Вернет статистику по всем запросам за указанный промежуток времени.
     *
     * Например,
     * getAPICallsStats("default", "week", 34) // данные для профиля default за последнюю неделю
     * getAPICallsStats("default", "day", 19.08.2020) // данные для профиля default за 19 августа 2020
     * getAPICallsStats(null, "month") // все данные за последний месяц
     * getAPICallsStats(null, "month", "Jun.2017") // все данные за июнь 2017 года
     *
     * @param profile
     * @param {String|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String|null}value конкретный отрезок времени.
     *          если день, то дата, если год - номер года, номер недели года или номер месяца года. если не указан, берется текущий.
     *          например, unit = day, value = 19.08.2020, unit = week, value = 43.2020 или 43, unit = month, value = 02.2019 или 02 или 2.
     * @return {Promise<{string: string}>}
     */
    getAPICallsStats: async(profile = null, precision = null, value = null) => {
        assert(storageIsReady);

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.statsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.statsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService);
        return await reader.getStatsData(profile, precision, value);
    },
    /**
     * Вернет статистику по всем запросам указанного провайдера за указанный промежуток времени.
     *
     * @param {String} provider код провайдера
     * @param {String|null} profile
     * @param {String|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String|null}value конкретный отрезок времени.
     *          если день, то дата, если год - номер года, номер недели года или номер месяца года. если не указан, берется текущий.
     *          например, unit = day, value = 19.08.2020, unit = week, value = 43.2020 или 43, unit = month, value = 02.2019 или 02 или 2.
     * @return {Promise<{string: string}>}
     */
    getProviderAPICallsStats: async (provider, profile = null, precision = null, value = null) => {
        assert(storageIsReady);

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.statsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.statsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve ${provider} API calls stats for the ${value || 'last'} ${precision}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService);
        return await reader.getProviderStatsData(provider, profile, precision, value);
    },
    /**
     * Вернет таблицу данных по всем операциям для каждого профайла.
     *
     * Например,
     * getAPICallsStatsByProfile("week", 34) // данные для профиля default за последнюю неделю
     * getAPICallsStatsByProfile("day", 19.08.2020) // данные для профиля default за 19 августа 2020
     * getAPICallsStatsByProfile("month") // все данные за последний месяц
     * getAPICallsStatsByProfile("month", "201706") // все данные за июнь 2017 года
     *
     * @param {String|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String|null}value конкретный отрезок времени.
     *          если день, то дата, если год - номер года, номер недели года или номер месяца года. если не указан, берется текущий.
     *          например, unit = day, value = 19.08.2020, unit = week, value = 43.2020 или 43, unit = month, value = 02.2019 или 02 или 2.
     * @return {Promise<{string: {}}>}
     */
    getAPICallsStatsByProfile: async(precision = null, value = null) => {
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.statsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.statsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, every profile`);

        const reader = new StatsReader(storageService);
        const table = {};

        for (const profile of config.get('stats.allowedProfiles')) {
            table[profile] = await reader.getStatsData(profile, precision, value);
        }

        return table;
    },
    /**
     * Вернет таблицу данных по всем операциям для указанного профайла и провайдера.
     *
     * Например,
     * getAPICallsStatsByProfile("week", 34) // данные для профиля default за последнюю неделю
     * getAPICallsStatsByProfile("day", 19.08.2020) // данные для профиля default за 19 августа 2020
     * getAPICallsStatsByProfile("month") // все данные за последний месяц
     * getAPICallsStatsByProfile("month", "201706") // все данные за июнь 2017 года
     *
     * @param {String} profile
     * @param {String|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String|null}value конкретный отрезок времени.
     *          если день, то дата, если год - номер года, номер недели года или номер месяца года. если не указан, берется текущий.
     *          например, unit = day, value = 19.08.2020, unit = week, value = 43.2020 или 43, unit = month, value = 02.2019 или 02 или 2.
     * @return {Promise<{string: {}}>}
     */
    getAPICallsStatsByProvider: async(profile, precision = null, value = null) => {
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.statsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.statsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, for profile ${profile}, every provider`);

        const reader = new StatsReader(storageService);
        const table = {};

        for (const provider of config.get('stats.allowedProviders')) {
            table[provider] = await reader.getProviderStatsData(provider, profile, precision, value);
        }

        return table;
    },
    cleanup: async () => {
        return await cleanupRealtimeCounter();
    }
};