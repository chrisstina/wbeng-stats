/*
 * Copyright (c) 2020
 */

const assert = require('assert'),
    moment = require('moment'),
    {promisify} = require('util'),
    redis = require('redis');

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
const config = require('config').get('stats');
const defaultConfig = require('./config/default');
config.util.setModuleDefaults('stats', defaultConfig);

const logger = require('./logger');

const redisClient = (() => {
    try {
        return redis.createClient(config.get('redisPort') || 6379);
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

const defaultPrecision = config.get('timelinePrecisions')[0];
const precisionsInSeconds = new Map();
config.get('timelinePrecisions').forEach(precision => {
    precisionsInSeconds.set(precision, getPrecisionInSeconds(precision));
});


/**
 *
 * @param name
 */
const updateCounter = name => {
    const updateBy = 1;

    const pipe = redisClient.multi(); // открываем транзакцию

    for (const precision of config.get('timelinePrecisions')) {
        const precisionInSeconds = precisionsInSeconds.get(precision); // переводим в секунды
        const timeSlice = parseInt(moment().unix() / precisionInSeconds) * precisionInSeconds; // получаем начало текущего временного отрезка
        const hash = `${precisionInSeconds}:${name}`; // 3600:flights:apirequests:all  3600:flights:apirequests:ttbooking

        pipe.zadd(`known:`, 0, hash, (err, replies) => {
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
 *
 * @param {string} precision название временного отрезка (1 minutes, 3 months, etc)
 * @param {string} name имя счетчика (all:apirequests:all, flights:apirequests:ttservice, etc)
 * @return {*}
 */
const getCounterData = async (precision, name, limit = null, offset = 0) => {
    const precisionInSeconds = precisionsInSeconds.get(precision);
    const hash = `${precisionInSeconds}:${name}`;
    const retrieveDataAsync = promisify(redisClient.hgetall).bind(redisClient);
    return await retrieveDataAsync(`count:${hash}`);

    /*
    const data = redisClient.hgetall(`count:${hash}`, (err, data) => {
        if (err) {
            logger.error("[STATS][VIEW] HGETALL got error " + err.toString());
        }

        console.dir(data);
    });
    return data;*/
};

/**
 * Имя для счетчика
 * @param {string|null} entryPoint название операции
 * @param {string|null} profile профиль запроса
 * @return {string} например, flights:apirequests:ttservice или all:apirequests:default
 */
const generateCounterName = (entryPoint = null, profile = null) => `${entryPoint || 'all'}:apirequests:${profile || 'all'}`;

/**
 *
 * @type {{updateAPICalls: function(*), getAPICalls: function((string|null)=, (string|null)=, (string|null)=, *=, *=), cleanup: function()}}
 */
module.exports = {
    /**
     * При необходимости, можно переписать дефольный конфиг stats
     * @param config
     */
    setDefaults: (config) => {
        // Mixin configs that have been passed in, and make those my defaults
        config.util.extendDeep(defaultConfig, config);
        config.util.setModuleDefaults('stats', defaultConfig);
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

        updateCounter(generateCounterName()); // все запросы всех пользователей
        updateCounter(generateCounterName(entryPoint)); // конкретный тип запроса всех пользователей
        if (profile) {
            updateCounter(generateCounterName(null, profile));  // все запросы пользователя
            updateCounter(generateCounterName(entryPoint, profile)); // конкретный тип запроса пользователя
        }
    },

    /**
     *
     * @param {string|null} precision - precision title from config, e.g. "1 minutes", "3 months"
     * @param {string|null} entryPoint
     * @param {string|null} profile
     * @param limit
     * @param offset
     * @return {Promise<*>}
     */
    getAPICalls: async (precision = null, entryPoint = null, profile = null, limit = null, offset = 0) => {
        precision = precision || defaultPrecision;

        if (config.get('timelinePrecisions').indexOf(precision) === -1) {
            precision = defaultPrecision;
            logger.warn(`[STATS][VIEW] Invalid precision ${precision}, using default`);
        }

        return await getCounterData(precision, generateCounterName(entryPoint, profile), limit, offset);
    },
    cleanup: () => {

    }
};