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
const defaultRealtimePrecision = config.get('stats.realtimePrecisions')[0];
const defaultStatsPrecision = config.get('stats.aggregateHitsPrecisions')[0];

/**
 *
 * @param {string} precision - day, week, month, year
 * @return {string} текущее значение в нужном формате: например: 1.Aug.2020, 34.2020, Aug.2020, 2020
 */
const getDefaultValueForPrecision = precision =>  moment().format(precisionFormats.get(precision).replace(/:/g, ''));

/**
 *
 * @type {{connect: function(), getAllowedRealtimePrecisions: function(): value, getAllowedStatsPrecisions: function(): value, getAllowedOperations: function(): value, getAllowedProfiles: function(): value, validateStatsDate: function(*, *=), updateAPICalls: function(*, string=), updateAPIResponseTime: function(*), updateProviderAPICalls: function({provider: {name: string, code: string}, profile: string, entryPoint: string, WBtoken: string}, (string|undefined)=), updateProviderResponseTime: function(*), getAPIRealtime: function(string=, (string|null)=, (string|null)=, (string|null)=, *=, *=), getAPIStats: function(*=, *=, (String|null)=, (String|null)=), getAPIResponseTime: function(*=, *=, *=), getProviderAPICallsStats: function(String, (String|null)=, (String|null)=, (String|null)=), getAPICallsStatsByProfile: function((String|null)=, (String|null)=), getAPICallsStatsByProvider: function(String, (String|null)=, (String|null)=), cleanup: function(), REQUEST_TYPE_CALL: string, REQUEST_TYPE_ERROR: string}}
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
    getAllowedStatsPrecisions: () => config.get('stats.aggregateHitsPrecisions'),
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
    updateProviderAPICalls: (request, type = "request") => {
        logger.verbose(`[STATS][UPD] Update provider ${type}s stats, ${process.env.NODE_ENV} env`);
        assert(request.provider !== undefined, 'Need provider');
        assert(request.entryPoint !== undefined, 'Need entryPoint');
        assert(request.profile !== undefined, 'Need profile');
        assert(storageIsReady);

        const {provider, entryPoint, profile} = request;
        const updater = new StatsUpdater(storageService, type, precisionFormats);
        updater.incrementProviderOperationTotals(provider.code, entryPoint);
        updater.incrementProviderOperationTotals(provider.code, entryPoint, profile);
    },
    /**
     * Обновит среднее время запроса к конкретному провайдеру за текущий промежуток времени (минута \ 30 секунд)
     * @param request
     */
    updateProviderResponseTime: (request) => {
        logger.verbose(`[STATS][UPD] Update API response time, ${process.env.NODE_ENV} env`);

        assert(request.entryPoint !== undefined, 'Need entryPoint');
        assert(request.provider !== undefined, 'Need entryPoint');
        assert(request.startedAt !== undefined, 'Need starting timestamp startedAt');
        assert(storageIsReady);

        const {entryPoint, provider, startedAt} = request;
        const responseDuration = moment().diff(moment(startedAt), 'miliseconds');
        const updater = new StatsUpdater(storageService, 'request');

        updater.updateProviderResponseTime(responseDuration, entryPoint, provider.code);
    },
    /**
     * @param {string} type request | error
     * @param {string|null} precision - precision title from config, e.g. "1 minutes", "3 months"
     * @param {string|null} entryPoint
     * @param {string|null} profile
     * @param limit
     * @param offset
     * @return {Promise<{}|null>}
     */
    getAPIRealtime: async (type = 'request', precision = null, entryPoint = null, profile = null, limit = null, offset = 0) => {
        assert(allowedRequestTypes.indexOf(type) !== -1, 'Некорректный тип запроса. Для получения данных по API запросам, используйте тип request. Для получения данных по API запросам, используйте тип error.');
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultRealtimePrecision;

        if (config.get('stats.realtimePrecisions').indexOf(precision) === -1) {
            precision = defaultRealtimePrecision;
            logger.warn(`[STATS][VIEW] Invalid precision ${precision}, using default`);
        }
        logger.verbose(`[STATS][VIEW] Retrieve API calls stats for ${precision || 'default precision'}, ${entryPoint || 'all operations'}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService, type);
        return await reader.getRealtimeCounterData(precision, entryPoint, profile, limit, offset);
    },
    /**
     * Вернет статистику по всем запросам за указанный промежуток времени.
     *
     * Например,
     * getAPIStats("request", "default", "week", 34) // количество всех запросов для профиля default за последнюю неделю
     * getAPIStats("request","default", "day", 19.08.2020) // количество всех запросов для профиля default за 19 августа 2020
     * getAPIStats("request", null, "month") // количество всех запросов за последний месяц
     * getAPIStats("request", null, "month", "Jun.2017") // количество всех запросов за июнь 2017 года
     * getAPIStats("error", null, "month", "Jun.2017") // количество всех ошибок за июнь 2017 года
     *
     * @param type request | error
     * @param profile
     * @param {String|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String|null}value конкретный отрезок времени.
     *          если день, то дата, если год - номер года, номер недели года или номер месяца года. если не указан, берется текущий.
     *          например, unit = day, value = 19.08.2020, unit = week, value = 43.2020 или 43, unit = month, value = 02.2019 или 02 или 2.
     * @return {Promise<{string: string}>}
     */
    getAPIStats: async(type = 'request', profile = null, precision = null, value = null) => {
        assert(allowedRequestTypes.indexOf(type) !== -1, 'Некорректный тип запроса. Для получения данных по API запросам, используйте тип request. Для получения данных по API запросам, используйте тип error.');
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.aggregateHitsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.aggregateHitsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, ${profile || 'all profiles'}`);
        const reader = new StatsReader(storageService, type);
        return await reader.getStatsData(profile, precision, value);
    },
    /**
     * Вернет статистику по средней длительности запроса.
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
        return await reader.getResponseTimesData(entryPoint, precision);
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
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.aggregateHitsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.aggregateHitsPrecisions').join(', ')}`);

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
        assert(precision === null || config.get('stats.aggregateHitsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.aggregateHitsPrecisions').join(', ')}`);

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
    getAPICallsStatsByProvider: async(profile, precision = null, value = null) => {
        assert(storageIsReady, 'Не удалось подключиться к хранилищу. Удостоверьтесь, что был вызван метод connect()');

        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.aggregateHitsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.aggregateHitsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, for profile ${profile}, every provider`);

        const reader = new StatsReader(storageService);
        const table = {};

        for (const provider of config.get('stats.allowedProviders')) {
            table[provider] = await reader.getProviderStatsData(provider, profile, precision, value);
        }

        return table;
    },
    /**
     *
     * @return {Promise<*>}
     */
    cleanup: () => {
        const cleaner = new StatsCleaner(storageService);
        cleaner.flushOldAggregateData();
        cleaner.flushOldRealtimeData();
    },
    REQUEST_TYPE_CALL,
    REQUEST_TYPE_ERROR
};