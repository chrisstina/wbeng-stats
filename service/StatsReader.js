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
     *
     * @param profile
     * @param precision
     * @param value
     * @return {Promise<{string: string}>} {<operationName>: hits, <ioerationName2>: hits}
     */
    async getStatsData (profile, precision, value) {
        return this._storage.getOperationTotalsData(`${keyModule.generateStatsName(this._type, profile)}:${precisionModule.valueToDate(precision, value)}`);
    };


    /**
     * @param provider
     * @param profile
     * @param precision
     * @param value
     * @return {Promise<{string: string}>} {<operationName>: hits, <operationName2>: hits}
     */
    async getProviderStatsData(provider, profile, precision, value) {
        return this._storage.getProviderOperationTotalsData(provider, `${keyModule.generateStatsName('request', profile)}:${precisionModule.valueToDate(precision, value)}`);
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
    async getRealtimeCounterData(precision, entryPoint = null, profile = null, limit = null, offset = 0) {
        return this._storage.getRealtimeCounterData(`${keyModule.generateCounterName(this._type, entryPoint, profile)}:${precisionModule.precisionsInSeconds.get(precision)}`);
    };
}

module.exports = StatsReader;