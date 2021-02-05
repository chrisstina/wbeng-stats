const logger = require('./../../logger');
const Storage = require('./../../storage/storage');

class MockStorage extends Storage {

    constructor(config) {
        super();
    }

    async connect() {
        logger.verbose('Mock storage connected');
    }

    /**
     *
     * @param timeSlicedHashes {Map<string, number>} где ключ - это timestamp начала отрезка времени (начало текущего часа, минуты, и т.п), а значение - название ключа, например apirequests:allmethods:allprofiles3600
     * @param updateBy
     */
    async updateTimeseriesHits(timeSlicedHashes, updateBy = 1) {
        try {
            logger.verbose('[STATS][STORAGE][MOCK] updateTimeseriesHits');
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async updateTimeseriesResponseTime(timeSlicedHashes, responseTime) {
        try {
            logger.verbose('[STATS][STORAGE][MOCK] updateTimeseriesResponseTime');
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    /**
     * Обновляет статистику запросов на операцию по временным отрезкам.
     * @param {String} operation название API операции (entryPoint)
     * @param {String[]} hashesToUpdate набор ключей, которые надо обновить. Ключи сформированы по временным отрезкам
     * @param {Map} timeSlicedHashesTpUpdate - набор значений таймпстэмпов начала временного отрезка
     * @param {Number} updateBy default 1
     */
    async updateTotalHits(operation, hashesToUpdate, timeSlicedHashesTpUpdate, updateBy = 1) {
        try {
            logger.verbose('[STATS][STORAGE][MOCK] updateTotalHits');
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async updateProviderTotalHits(provider, operation, hashesToUpdate, timeSlicedHashesToUpdate, updateBy = 1) {
        try {
            logger.verbose('[STATS][STORAGE][MOCK] updateProviderTotalHits');
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async getTimeseriesHits(hashesToUpdate, operation = null) {
        logger.verbose('[STATS][STORAGE][MOCK] getTimeseriesHits');
        return {};
    }

    async getTotalHits(hash) {
        logger.verbose(`[STATS][STORAGE][MOCK] getTotalHits for ${hash}`);
        return {
            hash,
            flights : 37,
            book: 6,
            display: 6,
            price: 6
        };
    }

    async getProviderTotalHits(provider, hash) {
        logger.verbose('[STATS][STORAGE][MOCK] getProviderTotalHits');

        return {};
    }

    async getTimeseriesKeys() {
        logger.verbose('[STATS][STORAGE][MOCK] getTimeseriesKeys');
        return {};
    }

    async getTimeseriesResponseTime(hash) {
        logger.verbose(`[STATS][STORAGE][MOCK] getTimeseriesResponseTime for ${hash}`);
        return {
            "1597325940": {
                "averageResponseTime": 3.66,
                "hits": 3
            },
            "1597389360": {
                "averageResponseTime": 1320.6666666666667,
                "hits": 5
            },
            "1597393500": {
                "averageResponseTime": 124.66441,
                "hits": 1
            }
        };
    }
}

module.exports = MockStorage;