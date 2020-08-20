/*
 * Copyright (c) 2020
 */

const assert = require('assert'),
    moment = require('moment');

const logger = require('./logger');
const validate = require('./validator');

const config = require('config');
config.util.setModuleDefaults('stats', require('./config.js'));

/**
 * @param storageName redis \ mysql
 * @return Storage
 */
const createStorageService = (storageName) => {
    const Storage = require(`./storage/${storageName}-storage`);
    return new Storage(config);
};
/**
 *
 * @type {Storage}
 */
const storageService = createStorageService(config.get('stats.storage'));

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
 * Имя для счетчика
 * @param {string|null} entryPoint название операции
 * @param {string|null} profile профиль запроса
 * @return {string} например, flights:apirequests:ttservice или all:apirequests:default
 */
const generateCounterName = (entryPoint = null, profile = null) => `${entryPoint || 'all'}:apirequests:${profile || 'all'}`;

/**
 * Имя ключа для статистики запросов, например apirequests:all или apirequests:default
 * @param profile
 * @return {string} например, apirequests:ttservice или apirequests:default
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
 * @param {string | Number} value
 * @return {string} 'stats:2020:apirequests:default' или 'stats:19:Aug:2020:all' или 'stats:34:2020:ttservice'
 */
const generateStatsNameWithDate = (profile, precision, value) => {
    assert(config.get('stats.statsPrecisions').indexOf(precision) !== -1, `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.statsPrecisions').join(', ')}`);
    return `${generateStatsName(profile)}:${valueToDate(precision, value)}`;
};

/**
 * Нормализует полученное значение value и приводит его к нужной дате.
 *
 * Если задан отрезок (precision) - год, вернет номер года (если не указан, то текущий)
 * Если задан отрезок (precision) - неделя, вернет номер недели с годом в формате moment (если не указано, то текущая неделя текущего года, если указана только неделя - неделя текущего года)
 * Если задан отрезок (precision) - год, вернет номер года (текущий, или переданный)
 *
 * @param {string} precision year / month / week / day
 * @param {string} value дата в формате Moment (2020-08-19, 2020W34, 32, 1)
 * @return {string} дата для формирования ключа, например, 2020:, 2020:08, 2020:W34
 * @throws validation error
 */
const valueToDate = (precision, value) => {
    value = validate[precision](value);
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
 * @param entryPoint
 * @param profile
 */
const incrementRealtimeCounter = (entryPoint = null, profile = null) => {
    const keyName = generateCounterName(entryPoint, profile);
    /**
     *
     * @type {Map<Number, String>} где ключ - это timestamp начала отрезка времени (гачало текущего часа, минуты, и т.п), а значение - название ключа, например 3600:flights:apirequests:all
     */
    const timeSlicedHashes = new Map();
    config.get('stats.realtimePrecisions').forEach(precision => {
        const precisionInSeconds = precisionsInSeconds.get(precision); // переводим в секунды
        timeSlicedHashes.set(getTimeSliceStart(precisionInSeconds), `${precisionInSeconds}:${keyName}`);
        return `${precisionInSeconds}:${keyName}`;
    });

    storageService.updateRealtimeCounter(timeSlicedHashes);
};

/**
 * Обновляет статистику запросов по временным отрезкам. Примеры ключей:
 * apirequests:default:2020:12:30
 * apirequests:all:2020:w42
 * apirequests:ttservice:2020
 * apirequests:all:2020:08
 *
 * @param entryPoint название операции
 * @param {string|null} profile
 */
const incrementOperationTotals = (entryPoint, profile = null) => {
    const keyName = generateStatsName(profile);
    const hashes = config.get('stats.statsPrecisions').map(precision => {
        const formattedDate = moment().format(precisionFormats.get(precision));
        return `${keyName}:${formattedDate}`;
    });
    storageService.updateOperationTotals(entryPoint, hashes);
};

/**
 * Получение данных статистики реального времени
 *
 * @param {String} precision название временного отрезка (1 minutes, 3 months, etc)
 * @param {String|null} entryPoint
 * @param {String|null} profile
 * @param {Number|null} limit
 * @param {Number} offset
 * @return {Promise<{string: string}>} {<timeslice1>: <hits count>, <timeslice2>: <hits count>}
 */
const getRealtimeCounterData = async (precision, entryPoint = null, profile = null, limit = null, offset = 0) => {
    return storageService.getRealtimeCounterData(`${precisionsInSeconds.get(precision)}:${generateCounterName(entryPoint, profile)}`);
};

/**
 *
 * @param profile
 * @param precision
 * @param value
 * @return {Promise<{string: string}>} {<operationName>: hits, <ioerationName2>: hits}
 */
const getStatsData = async (profile, precision, value) => {
    return storageService.getOperationTotalsData(generateStatsNameWithDate(profile, precision, value));
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
        logger.verbose("[STATS][UPD] Update API calls stats " + process.env.NODE_ENV);

        assert(expressRequest.entryPoint !== undefined, 'Need entryPoint');
        assert(expressRequest.profile !== undefined, 'Need profile');

        const {entryPoint, profile} = expressRequest;

        incrementRealtimeCounter(); // все запросы всех пользователей
        incrementRealtimeCounter(entryPoint); // конкретный тип запроса всех пользователей
        incrementOperationTotals(entryPoint);
        if (profile) {
            incrementRealtimeCounter(null, profile);  // все запросы пользователя
            incrementRealtimeCounter(entryPoint, profile); // конкретный тип запроса пользователя
            incrementOperationTotals(entryPoint, profile);
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

        return await getRealtimeCounterData(precision, entryPoint, profile, limit, offset);
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
        precision = precision || defaultStatsPrecision;
        assert(precision === null || config.get('stats.statsPrecisions').indexOf(precision) !== -1,
            `Некорректное значение временного отрезка ${precision}, ожидается ${config.get('stats.statsPrecisions').join(', ')}`);

        value = value || getDefaultValueForPrecision(precision);
        return await getStatsData(profile, precision, value);
    },

    cleanup: () => {

    }
};