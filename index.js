/*
 * Copyright (c) 2020
 */

const assert = require('assert'),
    moment = require('moment'),
    {promisify} = require('util'),
    redis = require('redis');

const config = require('config');
config.util.setModuleDefaults('stats', {
    "realtimePrecisions": [ // возможная величина временных отрезков для счетчиков текущих запросов
        "1 minutes",
        "1 hours",
        "1 days"
    ],
    "statsPrecisions": [ // возможная величина временных отрезков для сбора итоговой статистики по запросам
        "day",
        "week",
        "month",
        "year",
    ],
    "allowedOperations": [
        "flights",
        "price",
        "book",
        "display",
        "ancillaries",
        "ancillary",
        "ticket",
        "cancel",
        "void"
    ],
    "redisPort": 6379
});

const logger = require('./logger');

const redisClient = (() => {
    try {
        return redis.createClient(config.get('stats.redisPort') || 6379);
    } catch (e) {
        logger.error(e.stack);
    }
    return null;
})();


/**
 * Переводит название временного отрезка в секунды. Например, "1 minutes" => 60
 * @param {string} precision - precision title from config, e.g. "1 minutes", "3 months"
 * @return {number}
 */
const getPrecisionInSeconds = precision => {
    const [duration, unit] = precision.split(" ");
    return moment.duration(parseInt(duration), unit).asSeconds();
};

/**
 * получаем начало текущего временного отрезка в timestamp
 * @param precisionInSeconds
 * @return {number} timestamp в секундах
 */
const getTimeSliceStart = precisionInSeconds => parseInt(moment().unix() / precisionInSeconds) * precisionInSeconds;

const defaultPrecision = config.get('stats.realtimePrecisions')[0];
const precisionsInSeconds = new Map();
config.get('stats.realtimePrecisions').forEach(precision => {
    precisionsInSeconds.set(precision, getPrecisionInSeconds(precision));
});

/**
 * Обновляет счетчик запросов для таймлайна
 * @param name
 */
const updateRealtimeCounter = name => {
    const updateBy = 1;

    const pipe = redisClient.multi(); // открываем транзакцию

    for (const precision of config.get('stats.realtimePrecisions')) {
        const precisionInSeconds = precisionsInSeconds.get(precision); // переводим в секунды
        const timeSlice = getTimeSliceStart(precisionInSeconds);
        const hash = `${precisionInSeconds}:${name}`; // 3600:flights:apirequests:all  3600:flights:apirequests:ttbooking

        pipe.zadd(`knowncounters:`, 0, hash, (err, replies) => {
            if (err) {
                logger.error("[STATS][UPD] ZADD got error " + err.toString());
            }
        });
        pipe.hincrby(`count:${hash}`, timeSlice, updateBy, (err, replies) => {
            if (err) {
                logger.error("[STATS][UPD] HINCRBY got error " + err.toString());
            }
        });
    }

    pipe.exec((err, replies) => {
        if (err) {
            log.error("[STATS][UPD] MULTI got error " + err.toString());
        }
    });
};

/**
 * Обновляет статистику запросов по временным отрезкам
 *
 * @param entryPoint название операции
 * @param name например apirequests:all или apirequests:default
 */
const updateOperationTotals = (entryPoint, name) => {
    const updateBy = 1;
    const pipe = redisClient.multi(); // открываем транзакцию

    for (const precision of config.get('stats.statsPrecisions')) {
        const timeSlice = moment().startOf(precision).unix();
        const hash = `${timeSlice}:${name}`; // 1596240000:apirequests:all  1596240000:apirequests:ttbooking

        pipe.zadd(`knownstats:`, 0, hash, (err, replies) => {
            if (err) {
                logger.error("[STATS][UPD] ZADD got error " + err.toString());
            }
        });

        pipe.hincrby(`stats:${hash}`, entryPoint, updateBy, (err, replies) => {
            if (err) {
                logger.error("[STATS][UPD] HINCRBY got error " + err.toString());
            }
        });
    }
    pipe.exec((err, replies) => {
        if (err) {
            log.error("[STATS][UPD] MULTI got error " + err.toString());
        }
    });
};

/**
 *
 * @param {string} precision название временного отрезка (1 minutes, 3 months, etc)
 * @param {string} name имя счетчика (all:apirequests:all, flights:apirequests:ttservice, etc)
 * @param limit
 * @param offset
 * @return {Promise<{}|null>}
 */
const getCounterData = async (precision, name, limit = null, offset = 0) => {
    const precisionInSeconds = precisionsInSeconds.get(precision);
    const hash = `${precisionInSeconds}:${name}`;
    const retrieveDataAsync = promisify(redisClient.hgetall).bind(redisClient);
    try {
        return await retrieveDataAsync(`count:${hash}`);
    } catch (e) {
        logger.error("[STATS][VIEW] HGETALL got error " + err.toString());
    }
};

/**
 * Имя для счетчика
 * @param {string|null} entryPoint название операции
 * @param {string|null} profile профиль запроса
 * @return {string} например, flights:apirequests:ttservice или all:apirequests:default
 */
const generateCounterName = (entryPoint = null, profile = null) => `${entryPoint || 'all'}:apirequests:${profile || 'all'}`;

/**
 * Имя для статистики запросов
 * @param profile
 * @return {string}  например, apirequests:ttservice или apirequests:default
 */
const generateStatsName = (profile = null) => `apirequests:${profile || 'all'}`;

/**
 *
 * @type {{getAllowedTimelinePrecisions: function(), updateAPICalls: function(*), getAPICallsRealtime: function((string|null)=, (string|null)=, (string|null)=, *=, *=), cleanup: function()}}
 */
module.exports = {
    /**
     *
     * @return {value}
     */
    getAllowedTimelinePrecisions: () => {
        return config.get('stats.realtimePrecisions');
    },
    /**
     * Обновит все счетчики обращений к апи
     * @param expressRequest
     */
    updateAPICalls: (expressRequest) => {
        logger.verbose("[STATS][UPD] Update API calls stats");

        assert(expressRequest.entryPoint !== undefined, 'Need entryPoint');
        assert(expressRequest.profile !== undefined, 'Need profile');

        const {entryPoint, profile} = expressRequest;

        updateRealtimeCounter(generateCounterName()); // все запросы всех пользователей
        updateRealtimeCounter(generateCounterName(entryPoint)); // конкретный тип запроса всех пользователей
        updateOperationTotals(entryPoint, generateStatsName());
        if (profile) {
            updateRealtimeCounter(generateCounterName(null, profile));  // все запросы пользователя
            updateRealtimeCounter(generateCounterName(entryPoint, profile)); // конкретный тип запроса пользователя
            updateOperationTotals(entryPoint, generateStatsName(profile));
        }
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
        logger.verbose(`[STATS][VIEW] Retrieve API calls stats for ${precision || 'default precision'}, ${entryPoint || 'all operations'}, ${profile || 'all profiles'}`);
        precision = precision || defaultPrecision;

        if (config.get('stats.realtimePrecisions').indexOf(precision) === -1) {
            precision = defaultPrecision;
            logger.warn(`[STATS][VIEW] Invalid precision ${precision}, using default`);
        }

        return await getCounterData(precision, generateCounterName(entryPoint, profile), limit, offset);
    },


    /**
     *
     * @param {string|null} precision - precision title from config, e.g. "1 minutes", "3 months"
     * @param {string|null} entryPoint
     * @param {string|null} profile
     * @return {Promise<{}|null>}
     */
    getAPILastCallsStats: async(precision = null, entryPoint = null, profile = null) => {
        logger.verbose(`[STATS][VIEW] Retrieve API calls stats for the last ${precision || defaultPrecision}, ${entryPoint || 'all operations'}, ${profile || 'all profiles'}`);
        precision = precision || defaultPrecision;

        const statsByOperation = new Map();
        config.get('stats.allowedOperations').forEach(operation => {
            statsByOperation.set(operation, 1);
        });
    },
    getAPIPeriodCallsStats: async(dateFrom, dateTo, entryPoint = null, profile = null) => {
        logger.verbose(`[STATS][VIEW] Retrieve API calls stats for the period ${dateFrom} - ${dateTo}, ${entryPoint || 'all operations'}, ${profile || 'all profiles'}`);

    },
    cleanup: () => {

    }
};