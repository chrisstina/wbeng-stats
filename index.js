/*
 * Copyright (c) 2020
 */

const assert = require('assert'),
    moment = require('moment'),
    {promisify} = require('util'),
    redis = require('redis');

const config = require('config');
config.util.setModuleDefaults('stats', require('./config.js'));

const logger = require('./logger');
const validator = require('./validator');

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

const defaultRealtimePrecision = config.get('stats.realtimePrecisions')[0];
const defaultStatsPrecision = config.get('stats.statsPrecisions')[0];

/**
 * Ассоциация названия отрезка и его длительности в секундах
 * @type {Map<String, Number>}
 */
const precisionsInSeconds = new Map();
config.get('stats.realtimePrecisions').forEach(precision => {
    precisionsInSeconds.set(precision, getPrecisionInSeconds(precision));
});

/**
 * Ассоциация названия временного отрезка и его формата для moment
 * @type {Map<String, String>}
 */
const precisionFormats = new Map();
config.get('stats.statsPrecisions').forEach((precision, idx) => {
    precisionFormats.set(precision, config.get('stats.precisionFormats')[idx])
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
 * Обновляет статистику запросов по временным отрезкам. Примеры ключей:
 * apirequests:default:1:Dec:2020
 * apirequests:all:w42:2020
 * apirequests:ttservice:2020
 * apirequests:all:Dec:2020
 *
 * @param entryPoint название операции
 * @param name например apirequests:all или apirequests:default
 */
const updateOperationTotals = (entryPoint, name) => {
    const updateBy = 1;
    const pipe = redisClient.multi(); // открываем транзакцию

    for (const precision of config.get('stats.statsPrecisions')) {
        const formattedDate = moment().format(precisionFormats.get(precision));
        const hash = `${name}:${formattedDate}`; // apirequests:all:1:Dec:2020:  apirequests:ttbooking:Jan:2020

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
const getRealtimeCounterData = async (precision, name, limit = null, offset = 0) => {
    const precisionInSeconds = precisionsInSeconds.get(precision);
    const hash = `${precisionInSeconds}:${name}`;
    const retrieveDataAsync = promisify(redisClient.hgetall).bind(redisClient);
    try {
        return await retrieveDataAsync(`count:${hash}`);
    } catch (e) {
        logger.error("[STATS][VIEW] HGETALL got error " + err.toString());
    }
};

const getStatsData = async (name) => {
    const retrieveDataAsync = promisify(redisClient.hgetall).bind(redisClient);
    try {
        return await retrieveDataAsync(`stats:${name}`);
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
 * Имя ключа для статистики запросов
 * @param profile
 * @return {string}  например, apirequests:ttservice или apirequests:default
 */
const generateStatsName = (profile = null) => `apirequests:${profile || 'all'}`;

/**
 * Полное имя ключа с датой для получения статистики запросов
 *
 *
 * "week" - number 0 - 52 optionally year
 * "year" -  number 2020+
 * "month" - number 1 - 12 | string months
 * "day" - 2020.08.19
 *
 * @param {string | null} profile
 * @param {string} precision
 * @param {string | Date | Number} value
 * @return {string} 'stats:2020:apirequests:default' или 'stats:19:Aug:2020:all' или 'stats:34:2020:ttservice'
 */
const generateStatsNameWithDate = (profile, precision, value) => {
    assert(config.get('stats.statsPrecisions').indexOf(precision) !== -1, `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.statsPrecisions').join(', ')}`);
    return `${generateStatsName(profile)}:${valueToDate(precision, value)}`;;
};

/**
 * year: as is
 * month: as
 * week: 2020W11
 * day: as is
 *
 * @param precision
 * @param value
 * @return {string}
 * @throws validation error
 */
const valueToDate = (precision, value) => {
    switch (precision) {
        case "week":
            value = validator.normalizeWeek(value);
            break;
        case "month":
            value = validator.normalizeMonth(value);
            break;
        case "year":
            value = validator.normalizeYear(value);
            break;
    }

    const date = moment(value);
    assert(date.isValid(), `Некорректное значение value для ${precision}. Ожидается валидная дата`);
    return date.format(precisionFormats.get(precision));
};

/**
 *
 * @param {string} precision - day, week, month, year
 * @return {string} текущее значение в нужном формате: например: 1.Aug.2020, 34.2020, Aug.2020, 2020
 */
const getDefaultValueForPrecision = precision => {
    return moment().format(precisionFormats.get(precision).replace(/:/g, ''));
};

/**
 *
 * @type {{getAllowedRealtimePrecisions: function(), getAllowedStatsPrecisions: function(), updateAPICalls: function(*), getAPICallsRealtime: function((string|null)=, (string|null)=, (string|null)=, *=, *=), getAPICallsStats: function(*=, (String|null)=, (String|null)=), cleanup: function()}}
 */
module.exports = {
    /**
     *
     * @return {[]}
     */
    getAllowedRealtimePrecisions: () => {
        return config.get('stats.realtimePrecisions');
    },
    /**
     *
     * @return {[]}
     */
    getAllowedStatsPrecisions: () => {
        return config.get('stats.statsPrecisions');
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
        precision = precision || defaultRealtimePrecision;

        if (config.get('stats.realtimePrecisions').indexOf(precision) === -1) {
            precision = defaultRealtimePrecision;
            logger.warn(`[STATS][VIEW] Invalid precision ${precision}, using default`);
        }

        return await getRealtimeCounterData(precision, generateCounterName(entryPoint, profile), limit, offset);
    },

    /**
     * Вернет статистику по всем запросам за указанный промежуток времени.
     *
     * Нпаример,
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
     * @return {Promise<void>}
     */
    getAPICallsStats: async(profile = null, precision = null, value = null) => {
        logger.verbose(`[STATS][VIEW] Retrieve all API calls stats for the ${value || 'last'} ${precision}, ${`${profile} profile` || 'all profiles'}`);

        assert(precision === null || config.get('stats.statsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.statsPrecisions').join(', ')}`);
        precision = precision || defaultStatsPrecision;
        value = value || getDefaultValueForPrecision(precision);

        return await getStatsData(generateStatsNameWithDate(profile, precision, value));
    },

    cleanup: () => {

    }
};