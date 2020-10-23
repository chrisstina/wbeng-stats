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
    async updateRealtimeCounter(timeSlicedHashes, updateBy = 1) {
        try {
            logger.verbose('[STATS][STORAGE][MOCK] updateRealtimeCounter');
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async updateAPIResponseTime(timeSlicedHashes, responseTime) {
        try {
            logger.verbose('[STATS][STORAGE][MOCK] updateAPIResponseTime');
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    /**
     * Обновляет статистику запросов на операцию по временным отрезкам.
     * @param {String} operation название API операции (entryPoint)
     * @param {String[]} hashesToUpdate набор ключей, которые надо обновить. Ключи сформированы по временным отрезкам
     * @param {Number} updateBy default 1
     */
    async updateOperationTotals(operation, hashesToUpdate, updateBy = 1) {
        try {
            logger.verbose('[STATS][STORAGE][MOCK] updateOperationTotals');
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async updateProviderOperationTotals(provider, operation, hashesToUpdate, updateBy = 1) {
        try {
            logger.verbose('[STATS][STORAGE][MOCK] updateProviderOperationTotals');
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async getRealtimeCounterData(hash, limit = null, offset = 0) {
        logger.verbose('[STATS][STORAGE][MOCK] getRealtimeCounterData');
        return {};
    }

    async getOperationTotalsData(hash) {
        logger.verbose(`[STATS][STORAGE][MOCK] getOperationTotalsData for ${hash}`);
        return {
            hash,
            flights : 37,
            book: 6,
            display: 6,
            price: 6
        };
    }

    async getProviderOperationTotalsData(provider, hash) {
        logger.verbose('[STATS][STORAGE][MOCK] getProviderOperationTotalsData');

        return {};
    }

    async getRealtimeKeys() {
        logger.verbose('[STATS][STORAGE][MOCK] getRealtimeKeys');
        return {};
    }
}

module.exports = MockStorage;