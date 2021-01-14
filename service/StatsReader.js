const keyModule = require('./statsKey'),
    precisionModule = require('./precision');

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
     * @param profile
     * @param precision
     * @param value
     * @return {Promise<{string: string}>} {<operationName>: hits, <ioerationName2>: hits}
     */
    async getTotalHits(profile, precision, value) {
        return this._storage.getTotalHits(`${keyModule.generateStatsName(this._type, profile)}:${precisionModule.valueToDate(precision, value)}`);
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
        return this._storage.getProviderTotalHits(provider, `${keyModule.generateStatsName(this._type, profile)}:${precisionModule.valueToDate(precision, value)}`);
    };

    /**
     * Получение исторических данных по количеству вызовов операций, общее количество по всем провайдерам
     *
     * @param {String} precision название временного отрезка (1 minutes, 3 months, etc)
     * @param {String|null} entryPoint
     * @param {String|null} profile
     * @param {Number|null} limit
     * @param {Number} offset
     * @return {Promise<{string: string}>} {<timeslice1>: <hits count>, <timeslice2>: <hits count>}
     */
    async getTimeseriesHits(precision, entryPoint = null, profile = null, limit = null, offset = 0) {
        return this._storage.getTimeseriesHits(`${keyModule.generateCounterName(this._type, entryPoint, profile)}:${precisionModule.precisionsInSeconds.get(precision)}`);
    };

    /**
     * Получение исторических данных по среднему времени выполнения запроса
     *
     * @param entryPoint
     * @param {string} precision название временного отрезка (1 minutes, 30 seconds)
     * @return {Promise<{string: {}}>} {<timeslice1>: {averageResponseTime: <float>, hits: <number>}, {averageResponseTime: <float>, hits: <number>}}
     */
    async getTimeseriesResponseTime(entryPoint, precision = '1 minutes') {
        return this._storage.getTimeseriesResponseTime(`${keyModule.generateResponseTimeName(entryPoint)}:${precisionModule.precisionsInSeconds.get(precision)}`);
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
        return this._storage.getProviderTimeseriesResponseTime(provider, `${keyModule.generateResponseTimeName(entryPoint)}:${precisionModule.precisionsInSeconds.get(precision)}`);
    }
}

module.exports = StatsReader;