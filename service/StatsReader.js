const config = require('config'),
    moment = require('moment');

const {generateStatsName, generateResponseTimeName, HASH_DELIMITER} = require('./statsKey'),
    {valueToDate, precisionFormats, precisionsInSeconds, getTimeSliceStart, getPreviousTimestampsForPrecision} = require('./precision');

class StatsReader {
    constructor(storageService, statType = 'request') {
        this._storage = storageService;
        this._type = statType;
        this._env = process.env.NODE_ENV || 'test';
    }

    set env(value) {
        this._env = value;
    }

    /**
     * Получение количества вызовов каждой операции за указанный период времени, общее количество по всем провайдерам
     *
     * @param {String} profile
     * @param {"second"|"minute"|"day"|"week"|"month"|"year"|null} precision название отрезка времени, возможные значения "day", "month", "week", "year"
     * @param {String} value дата в формате moment
     * @return {Promise<{string: string}>} {<operationName>: hits, <ioerationName2>: hits}
     */
    async getTotalHits(profile, precision, value) {
        const key = `${generateStatsName(this._type, profile)}${HASH_DELIMITER}${valueToDate(precision, value)}`;
        return this._storage.getTotalHits(key);
    };

    /**
     * Получение количества вызовов каждой операции за указанный период времени для конкретного провайдера
     *
     * @param provider
     * @param profile
     * @param precision
     * @param value
     * @return {Promise<{string: string}>} {<operationName>: hits, <operationName2>: hits}
     */
    async getProviderTotalHits(provider, profile, precision, value) {
        return this._storage.getProviderTotalHits(provider, `${generateStatsName(this._type, profile)}:${valueToDate(precision, value)}`);
    };

    /**
     * Получение количества вызовов за указанный период времени для конкретной а\к с разбивкой по провайдерам и операциям
     * @param carrier
     * @param profile
     * @param precision
     * @param value
     * @return {Promise<{}>} - например { FV: {flights: { KW: 6, total: 6 }}, {price: {...}} }
     */
    async getCarrierTotalHits(carrier, profile, precision, value) {
        const hash = `${generateStatsName(this._type, profile)}:${valueToDate(precision, value)}`;
        return this._storage.getCarrierTotalHits(carrier, hash);
    }

    /**
     * Получение исторических данных по количеству вызовов операций, общее количество по всем провайдерам
     *
     * @param {String} precision название временного отрезка (1 minutes, 3 months, etc)
     * @param {String|null} entryPoint
     * @param {String|null} profile
     * @param {Number} limit
     * @param {Number} offset
     * @return {Promise<{string: string}>} {<timeslice1>: <hits count>, <timeslice2>: <hits count>}
     */
    async getTimeseriesHits(precision, entryPoint = null, profile = null, limit = 50, offset = 0) {
        const keyPart = `${generateStatsName(this._type, profile)}${HASH_DELIMITER}`;

        // сформируем список ключей - в выбранном масштабе от текущего момента limit записей
        const keys = getPreviousTimestampsForPrecision(precision, limit)
            .map(timestamp => keyPart + moment(timestamp).format(precisionFormats.get(precision)))

        return this._storage.getTimeseriesHits(keys, entryPoint);
    };

    /**
     * Получение исторических данных по количеству вызовов операций для указанного провайдера
     * @param {string} provider
     * @param {String} precision название временного отрезка (1 minutes, 3 months, etc)
     * @param {String|null} entryPoint
     * @param {String|null} profile
     * @param {Number} limit
     * @param {Number} offset
     * @return {Promise<{string: string}>} {<timeslice1>: <hits count>, <timeslice2>: <hits count>}
     */
    async getProviderTimeseriesHits(provider, precision, entryPoint = null, profile = null, limit = 50, offset = 0) {
        const keyPart = `${provider}${HASH_DELIMITER}${generateStatsName(this._type, profile)}${HASH_DELIMITER}`

        // сформируем список ключей - в выбранном масштабе от текущего момента limit записей
        const keys = getPreviousTimestampsForPrecision(precision, limit)
            .map(timestamp => keyPart + moment(timestamp).format(precisionFormats.get(precision)))

        return this._storage.getProviderTimeseriesHits(provider, keys, entryPoint);
    };

    /**
     * Получение исторических данных по среднему времени выполнения запроса
     *
     * @param entryPoint
     * @param {"minute"|null} precision название временного отрезка (1 minutes, 30 seconds)
     * @return {Promise<{string: {}}>} {<timeslice1>: {averageResponseTime: <float>, hits: <number>}, {averageResponseTime: <float>, hits: <number>}}
     */
    async getTimeseriesResponseTime(entryPoint, precision = 'minute') {
        return this._storage.getTimeseriesResponseTime(`${generateResponseTimeName(entryPoint)}:${precisionsInSeconds.get(precision)}`);
    }
    /**
     * олучение исторических данных по среднему времени выполнения запроса для указанного провайдера
     *
     * @param {string} provider
     * @param {string} entryPoint
     * @param {string} precision
     * @returns {Promise<{string: {averageResponseTime: Number, hits: Number}}>}
     */
    async getProviderTimeseriesResponseTime(provider, entryPoint, precision = '1 minutes') {
        return this._storage.getProviderTimeseriesResponseTime(provider, `${generateResponseTimeName(entryPoint)}:${precisionsInSeconds.get(precision)}`);
    }

    /**
     *
     * @return {Promise<string[]>}
     */
    async getKnownCarriers() {
        return this._storage.getKnownCarriers();
    }

    /**
     *
     * @return {Promise<string[]>}
     */
    async getKnownProviders() {
        return config.get('stats.allowedProviders');
    }
}

module.exports = StatsReader;