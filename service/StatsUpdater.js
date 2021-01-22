const config = require('config'),
    moment = require('moment');

const {generateStatsName, generateCounterName, generateResponseTimeName, HASH_DELIMITER} = require('./statsKey'),
    precisionModule = require('./precision');

const statsConfig = config.get('stats');

class StatsUpdater {
    constructor(storageService, statType) {
        this._storage = storageService;
        this._type = statType;
        this._env = process.env.NODE_ENV || 'test';
    }

    set env(value) {
        this._env = value;
    }

    set type(value) {
        this._type = value;
    }

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
    incrementTotalHits(entryPoint = null, profile = null) {
        const keyName = generateStatsName(this._type, profile);
        const hashes = statsConfig.get('totalHitsPrecisions').map(precision => {
            const formattedDate = moment().format(precisionModule.precisionFormats.get(precision));
            return `${keyName}${HASH_DELIMITER}${formattedDate}`;
        });
        this._storage.updateTotalHits(entryPoint, hashes);
    }

    /**
     *
     * @param providerCode
     * @param entryPoint
     * @param profile
     */
    incrementProviderTotalHits(providerCode, entryPoint, profile = null) {
        const keyName = generateStatsName(this._type, profile);
        const hashes = statsConfig.get('totalHitsPrecisions').map(precision => {
            const formattedDate = moment().format(precisionModule.precisionFormats.get(precision));
            return `${keyName}${HASH_DELIMITER}${formattedDate}`;
        });
        this._storage.updateProviderTotalHits(providerCode, entryPoint, hashes);
    };

    /**
     *
     * @param entryPoint
     * @param profile
     * @return {Promise<*>}
     */
    incrementTimeseriesHits(entryPoint = null, profile = null) {
        const keyName = generateCounterName(this._type, entryPoint, profile);
        /**
         *
         * @type {Map<Number, String>} где ключ - это timestamp начала отрезка времени (гачало текущего часа, минуты, и т.п), а значение - название ключа, например 3600:flights:apirequests:all
         */
        const timeSlicedHashes = new Map();
        statsConfig.get('timeseriesPrecisions').forEach(precision => {
            const precisionInSeconds = precisionModule.precisionsInSeconds.get(precision); // переводим в секунды
            timeSlicedHashes.set(precisionModule.getTimeSliceStart(precisionInSeconds), `${keyName}${HASH_DELIMITER}${precisionInSeconds}`);
        });

        return this._storage.updateTimeseriesHits(timeSlicedHashes);
    }

    /**
     *
     * @param responseTime
     * @param entryPoint
     * @param {string|null} provider
     * @return {*|Promise<void>}
     */
    updateResponseTime(responseTime, entryPoint, provider) {
        const keyName = generateResponseTimeName(entryPoint);
        /**
         *
         * @type {Map<String, Number>} где ключ  - название ключа, например responsetime:flights:30, а значение - timestamp начала отрезка времени (начало текущего часа, минуты, и т.п)
         */
        const timeSlicedHashes = new Map();
        statsConfig.get('responseTimePrecisions').forEach(precision => {
            const precisionInSeconds = precisionModule.precisionsInSeconds.get(precision); // переводим в секунды
            timeSlicedHashes.set(`${keyName}${HASH_DELIMITER}${precisionInSeconds}`, precisionModule.getTimeSliceStart(precisionInSeconds));
        });
        return this._storage.updateTimeseriesResponseTime(timeSlicedHashes, responseTime);
    }

    /**
     *
     * @param responseTime
     * @param entryPoint
     * @param {string|null} provider
     * @return {*|Promise<void>}
     */
    updateProviderResponseTime(responseTime, entryPoint, provider) {
        const keyName = generateResponseTimeName(entryPoint);
        /**
         *
         * @type {Map<String, Number>} где ключ - название ключа, например 1S:responsetime:flights:30, а значение - это timestamp начала отрезка времени (начало текущего часа, минуты, и т.п)
         */
        const timeSlicedHashes = new Map();
        statsConfig.get('responseTimePrecisions').forEach(precision => {
            const precisionInSeconds = precisionModule.precisionsInSeconds.get(precision); // переводим в секунды
            timeSlicedHashes.set(`${provider}${HASH_DELIMITER}${keyName}${HASH_DELIMITER}${precisionInSeconds}`, precisionModule.getTimeSliceStart(precisionInSeconds));
        });
        return this._storage.updateProviderTimeseriesResponseTime(timeSlicedHashes, responseTime);
    }
}

module.exports = StatsUpdater;