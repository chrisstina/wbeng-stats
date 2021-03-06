const assert = require('assert'),
    config = require('config'),
    moment = require('moment');

const {generateStatsName, generateCounterName, generateResponseTimeName, HASH_DELIMITER} = require('./statsKey'),
    {precisionFormats, precisionsInSeconds, getTimeSliceStart} = require('./precision');

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
        const {hashes, timeSlicedHashes} = this.prepareTotalHitsHashes(profile);
        this._storage.updateTotalHits(entryPoint, hashes, timeSlicedHashes);
    }

    /**
     *
     * @param providerCode
     * @param entryPoint
     * @param profile
     */
    incrementProviderTotalHits(providerCode, entryPoint, profile = null) {
        const {hashes, timeSlicedHashes} = this.prepareTotalHitsHashes(profile);
        this._storage.updateProviderTotalHits(providerCode, entryPoint, hashes, timeSlicedHashes);
    };

    /**
     *
     * @param {string} carrierCode
     * @param {string} providerCode
     * @param {string} entryPoint
     * @param {string|null} profile
     */
    incrementCarrierTotalHits(carrierCode, providerCode, entryPoint, profile = null) {
        const {hashes, timeSlicedHashes} = this.prepareTotalHitsHashes(profile);
        this._storage.updateCarrierTotalHits(carrierCode, providerCode, entryPoint, hashes, timeSlicedHashes);
    }

    updateKnownCarriers(carrierCode) {
        this._storage.updateKnownCarriers(carrierCode);
    }

    /**
     *
     * @param entryPoint
     * @param profile
     * @return {Promise<*>}
     * @deprecated
     */
    incrementTimeseriesHits(entryPoint = null, profile = null) {
        const keyName = generateCounterName(this._type, entryPoint, profile);
        /**
         *
         * @type {Map<Number, String>} где ключ - это timestamp начала отрезка времени (гачало текущего часа, минуты, и т.п), а значение - название ключа, например 3600:flights:apirequests:all
         */
        const timeSlicedHashes = new Map();
        statsConfig.get('timeseriesPrecisions').forEach(precision => {
            const precisionInSeconds = precisionsInSeconds.get(precision); // переводим в секунды
            timeSlicedHashes.set(getTimeSliceStart(precisionInSeconds), `${keyName}${HASH_DELIMITER}${precisionInSeconds}`);
        });

        return this._storage.updateTimeseriesHits(timeSlicedHashes);
    }

    /**
     *
     * @param providerCode
     * @param entryPoint
     * @param profile
     * @returns {Promise<*>}
     * @deprecated
     */
    incrementProviderTimeseriesHits(providerCode, entryPoint = null, profile = null) {
        const keyName = generateCounterName(this._type, entryPoint, profile);
        /**
         *
         * @type {Map<Number, String>} где ключ - это timestamp начала отрезка времени (начало текущего часа, минуты, и т.п), а значение - название ключа, например 3600:flights:apirequests:all
         */
        const timeSlicedHashes = new Map();
        statsConfig.get('timeseriesPrecisions').forEach(precision => {
            const precisionInSeconds = precisionsInSeconds.get(precision); // переводим в секунды
            timeSlicedHashes.set(getTimeSliceStart(precisionInSeconds), `${providerCode}${HASH_DELIMITER}${keyName}${HASH_DELIMITER}${precisionInSeconds}`);
        });

        return this._storage.updateProviderTimeseriesHits(timeSlicedHashes);
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
            const precisionInSeconds = precisionsInSeconds.get(precision); // переводим в секунды
            timeSlicedHashes.set(`${keyName}${HASH_DELIMITER}${precisionInSeconds}`, getTimeSliceStart(precisionInSeconds));
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
            const precisionInSeconds = precisionsInSeconds.get(precision); // переводим в секунды
            timeSlicedHashes.set(`${provider}${HASH_DELIMITER}${keyName}${HASH_DELIMITER}${precisionInSeconds}`, getTimeSliceStart(precisionInSeconds));
        });
        return this._storage.updateProviderTimeseriesResponseTime(timeSlicedHashes, responseTime);
    }


    /**
     *
     * @param profile
     * @return {{hashes: string[], timeSlicedHashes: Map<string, number>}}
     */
    prepareTotalHitsHashes(profile = null) {
        const keyName = generateStatsName(this._type, profile),
            /**
             * @type {string[]}
             */
            hashes = [],
            /**
             * @type {Map<string, number>} <key, timestampStart>
             */
            timeSlicedHashes = new Map();

        statsConfig.get('totalHitsPrecisions').forEach(precision => {
            const formattedDate = moment().format(precisionFormats.get(precision)),
                hash = `${keyName}${HASH_DELIMITER}${formattedDate}`;
            hashes.push(hash);

            const precisionInSeconds = precisionsInSeconds.get(precision); // переводим в секунды
            assert(precisionInSeconds !== undefined);
            timeSlicedHashes.set(hash, getTimeSliceStart(precisionInSeconds));
        });

        return {
            hashes,
            timeSlicedHashes
        }
    }
}

module.exports = StatsUpdater;