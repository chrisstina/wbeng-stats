class Storage {
    async connect() {};

    /**
     *
     * @param timeSlicedHashes {Map<Number, String>} где ключ - это timestamp начала отрезка времени (гачало текущего часа, минуты, и т.п), а значение - название ключа, например 3600:flights:apirequests:all
     * @param updateBy
     * @return {Promise<void>}
     */
    async updateRealtimeCounter(timeSlicedHashes, updateBy = 1) {

    }

    /**
     * Обновляет статистику запросов на операцию по временным отрезкам.
     * @param {String} operation название API операции (entryPoint)
     * @param {String[]} hashesToUpdate набор ключей, которые надо обновить. Ключи сформированы по временным отрезкам
     * @param {Number} updateBy default 1
     * @return {Promise<void>}
     */
    async updateOperationTotals(operation, hashesToUpdate, updateBy = 1) {}

    /**
     * Возвращает разбивку событий по временным промежуткам
     * @param {String} hash
     * @param limit
     * @param offset
     * @return {Promise<{string: string}>} {<timeslice1>: <hits count>, <timeslice2>: <hits count>}
     */
    async getRealtimeCounterData(hash, limit = null, offset = 0) {}

    /**
     * Возвращает разбивку по количеству операций на указанный промежок времени (ключ)
     * @param hash ключ, например apirequests:default:2020:W35
     * @return {Promise<{string: number}>} {<entryPoint1>: <hits count>, <entryPoint2>: <hits count>}
     */
    async getOperationTotalsData(hash) {}
}

module.exports = Storage;