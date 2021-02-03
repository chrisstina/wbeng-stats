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
const StatsCleaner = require('./service/StatsCleaner');
const {precisionFormats} = require('./service/precision');

const REQUEST_TYPE_CALL = 'request';
const REQUEST_TYPE_ERROR = 'error';
const allowedRequestTypes = [REQUEST_TYPE_CALL, REQUEST_TYPE_ERROR];

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

const defaultResponsetimePrecision = config.get('stats.responseTimePrecisions')[0];
const defaultTimeseriesPrecision = config.get('stats.timeseriesPrecisions')[0];
const defaultStatsPrecision = config.get('stats.totalHitsPrecisions')[0];

/**
 *
 * @param {string} precision - day, week, month, year
 * @return {string} текущее значение в нужном формате: например: 1.Aug.2020, 34.2020, Aug.2020, 2020
 */
const getDefaultValueForPrecision = precision => {
    const [y, m, d, h, mm] = precisionFormats.get(precision).split(':');
    return moment().format([y, m, d].join('') + (h ? `T${[h,mm].join('')}` : ''));
}

/**
 *
 * @type {{
 *
 * REQUEST_TYPE_ERROR: string,
 * REQUEST_TYPE_CALL: string,
 *
 * connect: (function(): Promise<void>)
 * validateStatsDate: module.exports.validateStatsDate,
 *
 * getAllowedOperations: (function(): string[]),
 * getAllowedTimeseriesPrecisions: (function(): string[]),
 * getAllowedStatsPrecisions: (function(): string[]),
 * getAllowedProfiles: (function(): string[]),
 *
 * updateAPIStats: module.exports.updateAPIStats,
 * updateAPIResponseTime: module.exports.updateAPIResponseTime,
 * updateProviderStats: module.exports.updateProviderStats,
 * updateProviderResponseTime: module.exports.updateProviderResponseTime,
 *
 * getAPITotalHits: (function(String, (String|null)=, (String|null)=, (String|null)=): {string: string}),
 * getAPITimeseriesHits: (function(string=, (string|null)=, (string|null)=, (string|null)=, *=, *=): {string: string}),
 * getAPIResponseTime: (function(*=, *=, *=): {string: {}}),
 * getAPITotalHitsByProvider: (function(String, (String|null)=, (String|null)=): {}),
 * getAPITotalHitsByProfile: (function((String|null)=, (String|null)=): {}),
 * getProviderTotalHits: (function(String, String, (String|null)=, (String|null)=, (String|null)=): {string: string}),
 * getProviderTimeseriesHits: (function(string=, (string|null)=, (string|null)=, (string|null)=, *=, *=): {string: string}),
 * getProviderResponseTime: (function(*=, *=, *=, *=): {string: {averageResponseTime: Number, hits: Number}}),
 *
 * cleanup: (function(): Promise<*>),
 * }}
 */
module.exports = {
    connect: () => {
        return initStorageService(config.get('stats.storage'));
    },

    // ===== Валидация и построение интерфейса =====

    /**
     * Список допустимых отрезков времени для получения данных реального времени
     * @return {[]}
     */
    getAllowedTimeseriesPrecisions: () => config.get('stats.timeseriesPrecisions'),
    /**
     * Список допустимых отрезков времени для получения данных статистики запросов
     * @return {[]}
     */
    getAllowedStatsPrecisions: () => config.get('stats.totalHitsPrecisions'),
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

    // ===== Обновление счетчиков  =====

    /**
     * Обновит все счетчики обращений к апи - timeseries и totals
     * @param {string} type тип записи - request | error
     * @param {{entryPoint: string, profile: string}} expressRequest
     */
    updateAPIStats: (expressRequest, type = "request") => {
        logger.verbose(`[STATS][UPD] Update API ${type} stats, ${process.env.NODE_ENV} env`);

        assert(expressRequest.entryPoint !== undefined, 'Need entryPoint');
        assert(expressRequest.profile !== undefined, 'Need profile');
        assert(storageIsReady);

        const {entryPoint, profile} = expressRequest;

        const updater = new StatsUpdater(storageService, type, precisionFormats);

        updater.incrementTimeseriesHits();// все запросы всех пользователей
        updater.incrementTimeseriesHits(entryPoint); // конкретный тип запроса всех пользователей
        updater.incrementTotalHits(entryPoint);
        if (profile) {
            updater.incrementTimeseriesHits(null, profile);  // все запросы пользователя
            updater.incrementTimeseriesHits(entryPoint, profile); // конкретный тип запроса пользователя
            updater.incrementTotalHits(entryPoint, profile);
        }
    },

    /**
     * Обновит среднее время запроса за текущий промежуток времени (минута \ 30 секунд)
     * @param expressRequest
     */
    updateAPIResponseTime: (expressRequest) => {
        logger.verbose(`[STATS][UPD] Update API response time, ${process.env.NODE_ENV} env`);

        assert(expressRequest.entryPoint !== undefined, 'Need entryPoint');
        assert(expressRequest.startedAt !== undefined, 'Need starting timestamp startedAt');
        assert(storageIsReady);

        const {entryPoint, startedAt} = expressRequest;
        const responseDuration = moment().diff(moment(startedAt), 'miliseconds');
        const updater = new StatsUpdater(storageService, 'request');

        updater.updateResponseTime(responseDuration, entryPoint);
    },
    /**
     * Обновит счетчик обращений к АПИ конкретного провайдера
     *
     * @param {{provider: {name: string, code: string}, profile: string, entryPoint: string, WBtoken: string}} request
     * @param {string|undefined} type тип записи - request | error
     */
    updateProviderStats: (request, type = "request") => {
        logger.verbose(`[STATS][UPD] Update provider ${type}s stats, ${process.env.NODE_ENV} env`);
        assert(request.provider !== undefined, 'Need provider');
        assert(request.entryPoint !== undefined, 'Need entryPoint');
        assert(request.profile !== undefined, 'Need profile');
        assert(storageIsReady);

        const {provider, entryPoint, profile} = request;
        const updater = new StatsUpdater(storageService, type, precisionFormats);
        updater.incrementProviderTotalHits(provider.code, entryPoint);
        updater.incrementProviderTotalHits(provider.code, entryPoint, profile);

        updater.incrementProviderTimeseriesHits(provider.code); // все запросы всех пользователей
        updater.incrementProviderTimeseriesHits(provider.code, entryPoint); //  конкретный тип запроса всех пользователей
        if (profile) {
            updater.incrementProviderTimeseriesHits(provider.code, null, profile); // все запросы конкретного пользователя
            updater.incrementProviderTimeseriesHits(provider.code, entryPoint, profile); //  конкретный тип запроса конкретного пользователя
        }
    },
    /**
     * Обновит среднее время запроса к конкретному провайдеру за текущий промежуток времени (минута \ 30 секунд)
     * @param {{entryPoint: string, provider: {code: string}, startedAt: Number}} request
     */
    updateProviderResponseTime: (request) => {
        logger.verbose(`[STATS][UPD] Update API response time, ${process.env.NODE_ENV} env`);

        assert(request.entryPoint !== undefined, 'Need entryPoint');
        assert(request.provider !== undefined, 'Need provider');
        assert(request.startedAt !== undefined, 'Need starting timestamp startedAt');
        assert(storageIsReady);

        const {entryPoint, provider, startedAt} = request;
        const responseDuration = moment().diff(moment(startedAt), 'miliseconds');
        const updater = new StatsUpdater(storageService, 'request');

        updater.updateProviderResponseTime(responseDuration, entryPoint, provider.code);
    },

    // ===== Чтение счетчиков  =====

    /**
     * Вернет статистику вызовов запросов за указанный промежуток времени.
     *
     * Например,
     * getAPITotalHits("request", "default", "week", 34) // количество всех запросов для профиля default за последнюю неделю
     * getAPITotalHits("request","default", "day", 19.08.2020) // количество всех запросов для профиля default за 19 августа 2020
     * getAPITotalHits("request", null, "month") // количество всех запросов за последний месяц
     * getAPITotalHits("request", null, "month", "Jun.2017") // количество всех запросов за июнь 2017 года
     * getAPITotalHits("error", null, "month", "Jun.2017") // количество всех ошибок за июнь 2017 года
     *
     * @param {String} type request | error
     * @param {String|null} profile
     * @param {String|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String|null}value конкретный отрезок времени.
     *          если день, то дата, если год - номер года, номер недели года или номер месяца года. если не указан, берется текущий.
     *          например, unit = day, value = 19.08.2020, unit = week, value = 43.2020 или 43, unit = month, value = 02.2019 или 02 или 2.
     * @return {Promise<{string: string}>}
     */
    getAPITotalHits: async(type, profile = null, precision = null, value = null) => {
        assert(allowedRequestTypes.indexOf(type) !== -1, 'Некорректный тип запроса. Для получения данных по API запросам, используйте тип request. Для получения данных по API запросам, используйте тип error.');
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.totalHitsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.totalHitsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService, type);
        return await reader.getTotalHits(profile, precision, value);
    },
    /**
     * Получение исторических данных по вызовам методов, общее количество по всем провайдерам
     *
     * @param {string} type request | error
     * @param {"second"|"minute"|"day"|"week"|"month"|"year"|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {string|null} entryPoint
     * @param {string|null} profile
     * @param limit
     * @param offset
     * @return {Promise<{}|null>}
     */
    getAPITimeseriesHits: async (type = 'request', precision = null, entryPoint = null, profile = null, limit = 10, offset = 0) => {
        assert(allowedRequestTypes.indexOf(type) !== -1, 'Некорректный тип запроса. Для получения данных по API запросам, используйте тип request. Для получения данных по API запросам, используйте тип error.');
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;

        assert(config.get('stats.totalHitsPrecisions').indexOf(precision) !== -1, `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.totalHitsPrecisions').join(', ')}`);
        logger.verbose(`[STATS][VIEW] Retrieve API calls timeseries by ${precision || 'default precision'}, ${entryPoint || 'all operations'}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService, type);
        return await reader.getTimeseriesHits(precision, entryPoint, profile, limit, offset);
    },
    /**
     * Получение исторических данных по вызовам методов, общее количество по всем провайдерам
     *
     * @param {string} type request | error
     * @param {String} provider код провайдера
     * @param {string|null} precision - precision title from config, e.g. "1 minutes", "3 months"
     * @param {string|null} entryPoint
     * @param {string|null} profile
     * @param limit
     * @param offset
     * @return {Promise<{}|null>}
     */
    getProviderTimeseriesHits: async (type = 'request', provider, precision = null, entryPoint = null, profile = null, limit = null, offset = 0) => {
        assert(allowedRequestTypes.indexOf(type) !== -1, 'Некорректный тип запроса. Для получения данных по API запросам, используйте тип request. Для получения данных по API запросам, используйте тип error.');
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultTimeseriesPrecision;

        if (config.get('stats.timeseriesPrecisions').indexOf(precision) === -1) {
            precision = defaultTimeseriesPrecision;
            logger.warn(`[STATS][VIEW] Invalid precision ${precision}, using default`);
        }
        logger.verbose(`[STATS][VIEW] Retrieve provider ${provider} calls stats for ${precision || 'default precision'}, ${entryPoint || 'all operations'}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService, type);
        return await reader.getProviderTimeseriesHits(provider, precision, entryPoint, profile, limit, offset);
    },
    /**
     * Вернет статистику вызовов метода или ошибкам указанного провайдера за указанный промежуток времени.
     *
     * @param {String} type "request" | "error"
     * @param {String} provider код провайдера
     * @param {String|null} profile
     * @param {String|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String|null}value конкретный отрезок времени.
     *          если день, то дата, если год - номер года, номер недели года или номер месяца года. если не указан, берется текущий.
     *          например, unit = day, value = 19.08.2020, unit = week, value = 43.2020 или 43, unit = month, value = 02.2019 или 02 или 2.
     * @return {Promise<{string: string}>}
     */
    getProviderTotalHits: async (type, provider, profile = null, precision = null, value = null) => {
        assert(allowedRequestTypes.indexOf(type) !== -1, 'Некорректный тип запроса. Для получения данных по API запросам, используйте тип request. Для получения данных по API запросам, используйте тип error.');
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.totalHitsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.totalHitsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve ${provider} API calls stats for the ${value || 'last'} ${precision}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService, type);
        return await reader.getProviderTotalHits(provider, profile, precision, value);
    },
    /**
     * Вернет историческую статистику по средней длительности запроса.
     *
     * Например,
     * getAPIResponseTime('flights') - среднее время запроса поиска в минуту
     * getAPIResponseTime('flights', '30 seconds') - среднее время запроса поиска в полминуты
     *
     * @param entryPoint
     * @param precision
     * @param profile
     * @return {Promise<{string: {}}>}
     */
    getAPIResponseTime: async (entryPoint, precision = null, profile = null) => {
        precision = precision || defaultResponsetimePrecision;
        assert(precision === null || config.get('stats.responseTimePrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.responseTimePrecisions').join(', ')}`);
        logger.verbose(`[STATS][VIEW] Retrieve response times for the ${entryPoint} operation by ${precision} across ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService);
        return await reader.getTimeseriesResponseTime(entryPoint, precision);
    },
    /**
     * Вернет историческую статистику по средней длительности запроса для конкретного провайдера
     * @param provider
     * @param entryPoint
     * @param precision
     * @param profile
     * @returns {Promise<{string: {averageResponseTime: Number, hits: Number}}>}
     */
    getProviderResponseTime: async (provider, entryPoint, precision = null, profile = null) => {
        precision = precision || defaultResponsetimePrecision;
        assert(precision === null || config.get('stats.responseTimePrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.responseTimePrecisions').join(', ')}`);
        logger.verbose(`[STATS][VIEW] Retrieve provider response times for the ${entryPoint} operation by ${precision} across ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService);
        return await reader.getProviderTimeseriesResponseTime(provider, entryPoint, precision);
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
    getAPITotalHitsByProfile: async(precision = null, value = null) => {
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.totalHitsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.totalHitsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, every profile`);

        const reader = new StatsReader(storageService);
        const table = {};

        for (const profile of config.get('stats.allowedProfiles')) {
            table[profile] = await reader.getTotalHits(profile, precision, value);
        }

        return table;
    },
    /**
     * Вернет таблицу данных по всем операциям для указанного профайла и провайдера.
     *
     * Например,
     * getAPICallsStatsByProvider("week", 34) // данные для профиля default за последнюю неделю
     * getAPICallsStatsByProvider("day", 19.08.2020) // данные для профиля default за 19 августа 2020
     * getAPICallsStatsByProvider("month") // все данные за последний месяц
     * getAPICallsStatsByProvider("month", "201706") // все данные за июнь 2017 года
     *
     * @param {String} profile
     * @param {String|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String|null}value конкретный отрезок времени.
     *          если день, то дата, если год - номер года, номер недели года или номер месяца года. если не указан, берется текущий.
     *          например, unit = day, value = 19.08.2020, unit = week, value = 43.2020 или 43, unit = month, value = 02.2019 или 02 или 2.
     * @return {Promise<{string: {}}>}
     */
    getAPITotalHitsByProvider: async(profile, precision = null, value = null) => {
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.totalHitsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.totalHitsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, for profile ${profile}, every provider`);

        const reader = new StatsReader(storageService);
        const table = {};

        for (const provider of config.get('stats.allowedProviders')) {
            table[provider] = await reader.getProviderTotalHits(provider, profile, precision, value);
        }

        return table;
    },

    // ===== Очищение старых данных ====

    /**
     *
     * @return {Promise<*>}
     */
    cleanup: () => {
        const cleaner = new StatsCleaner(storageService);
        cleaner.flushOldTotals();
        cleaner.flushOldTimeseries();
        cleaner.flushOldResponseTime();
        logger.verbose(`[STATS][CLEANER] Cleaning has been executed`);
    },
    REQUEST_TYPE_CALL,
    REQUEST_TYPE_ERROR
};