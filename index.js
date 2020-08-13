/*
 * Copyright (c) 2020
 */

const assert = require('assert'),
    moment = require('moment'),
    redis = require('redis');

const config = require('config');
const logger = require('./logger');

const redisClient = (() => {
    try {
        return redis.createClient(config.get('redisPort') || 6379);
    } catch (e) {
        logger.error(e.stack);
    }
    return null;
})();

const getPrecisionInSeconds = precision => {
    const [duration, unit] = precision.split(" ");
    return moment.duration(parseInt(duration), unit).asSeconds();
};

/**
 *
 * @param name
 */
const updateCounter = name => {
    const updateBy = 1;

    const pipe = redisClient.multi();

    for (const precision of config.get('timelinePrecisions')) {
        // переводим в секунды @todo вынести
        const precisionInSeconds = getPrecisionInSeconds(precision);

        // получаем начало текущего временного отрезка
        const timeSlice = parseInt(moment().unix() / precisionInSeconds) * precisionInSeconds;
        const hash = `${precisionInSeconds}:${name}`; // 3600:flights:apirequests:all  3600:flights:apirequests:ttbooking

        pipe.zadd(`known:`, 0, hash, (err, replies) => {
            if (err) {
                logger.error("[STATS] ZADD got error " + err.toString());
            }
        });
        pipe.hincrby(`count:${hash}`, timeSlice, updateBy, (err, replies) => {
            if (err) {
                logger.error("[STATS] HINCRBY got error " + err.toString());
            }
        });
    }

    pipe.exec((err, replies) => {
        if (err) {
            log.error("[STATS] MULTI got error " + err.toString());
        }
    });
};

/**
 *
 * @type {{updateAPICalls: function(*, *)}}
 */
module.exports = {
    /**
     * Обновит все счетчики обращений к апи
     * @param expressRequest
     */
    updateAPICalls: (expressRequest) => {
        logger.verbose("[STATS] Update API calls stats");

        assert(expressRequest.entryPoint !== undefined, 'Need entryPoint');
        assert(expressRequest.profile !== undefined, 'Need profile');

        const { entryPoint, profile } = expressRequest;

        updateCounter(`all:apirequests:all`); // все запросы всех пользователей
        updateCounter(`${entryPoint}:apirequests:all`); // конкретный тип запроса всех пользователей
        if (profile) {
            updateCounter(`all:apirequests:${profile}`);  // все запросы пользователя
            updateCounter(`${entryPoint}:apirequests:${profile}`); // конкретный тип запроса пользователя
        }
    }
};