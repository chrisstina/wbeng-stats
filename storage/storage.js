class Storage {
    async connect() {};

    /**
     *
     * @param timeSlicedHashes {Map<string, number>} где ключ - это timestamp начала отрезка времени (гачало текущего часа, минуты, и т.п), а значение - название ключа, например 3600:flights:apirequests:all
     * @param updateBy
     * @return {Promise<void>}
     */
    async updateTimeseriesHits(timeSlicedHashes, updateBy = 1) {}

    /**
     * Обновляет среднюю длительность запроса операции по временным отрезкам
     * @param timeSlicedHashes{Map<string, number>} где ключ - это timestamp начала отрезка времени (начало текущего часа, минуты, и т.п), а значение - название ключа, например responsetime:flights:30
     * @param responseTime значение длительности обработки запроса
     * @return {Promise<void>}
     */
    async updateTimeseriesResponseTime(timeSlicedHashes, responseTime) {}

    /**
     * Обновляет среднюю длительность запроса операции конкретного провайдера по временным отрезкам
     * @param timeSlicedHashes{Map<string, number>} где ключ - это timestamp начала отрезка времени (начало текущего часа, минуты, и т.п), а значение - название ключа, например responsetime:flights:30
     * @param responseTime значение длительности обработки запроса
     * @return {Promise<void>}
     */
    async updateProviderTimeseriesResponseTime(timeSlicedHashes, responseTime) {}

    /**
     * Обновляет статистику запросов на операцию по временным отрезкам.
     * @param {String} operation название API операции (entryPoint)
     * @param {String[]} hashesToUpdate набор ключей, которые надо обновить. Ключи сформированы по временным отрезкам
     * @param {Number} updateBy default 1
     * @return {Promise<void>}
     */
    async updateTotalHits(operation, hashesToUpdate, updateBy = 1) {}

    /**
     * Обновляет статистику запросов на операцию конкретного провайдера по временным отрезкам.
     * @param {String} provider код провайдера (1S, 1H, etc)
     * @param {String} operation название API операции (entryPoint)
     * @param {String[]} hashesToUpdate набор ключей, которые надо обновить. Ключи сформированы по временным отрезкам
     * @param {Number} updateBy default 1
     * @return {Promise<void>}
     */
    async updateProviderTotalHits(provider, operation, hashesToUpdate, updateBy = 1) {}

    /**
     * Возвращает разбивку событий по временным промежуткам
     * @param {String} hash
     * @param limit
     * @param offset
     * @return {Promise<{string: string}>} {<timeslice1>: <hits count>, <timeslice2>: <hits count>}
     */
    async getTimeseriesHits(hash, limit = null, offset = 0) {}

    /**
     * Возвращает среднее время ответа по временным промежуткам
     * @param {String} hash
     * @return {Promise<{string: {}}>} {<timeslice1>: {averageResponseTime: <float>, hits: <number>}, {averageResponseTime: <float>, hits: <number>}}
     */
    async getTimeseriesResponseTime(hash) {}

    /**
     * Возвращает разбивку по количеству операций на указанный промежуток времени (ключ)
     * @param hash ключ, например apirequests:default:2020:W35
     * @return {Promise<{string: number}>} {<entryPoint1>: <hits count>, <entryPoint2>: <hits count>}
     */
    async getTotalHits(hash) {}

    /**
     * Возвращает разбивку по количеству операций на указанный промежуток времени (ключ) для провайдера
     * @param provider код провайдера
     * @param hash ключ, например apirequests:default:2020:W35
     * @return {Promise<{string: number}>} {<entryPoint1>: <hits count>, <entryPoint2>: <hits count>}
     */
    async getProviderTotalHits(provider, hash) {}

    /**
     * Возвращает среднее время ответа по временным промежуткам для провайдера
     * @param provider код провайдера
     * @param hash
     * @returns {Promise<void>}
     */
    async getProviderTimeseriesResponseTime(provider, hash) {}

    /**
     * Вернет названия ключей, ассоциированных с записями реального времени
     * @return {Promise<[]>}
     */
    async getTimeseriesKeys() {}

    /**
     * Удаляет записи об общем количестве вызовов
     * @param {Number} timestamp timestamp дата, записи старше которой надо удалить.
     * @return {Promise<void>}
     */
    async safeDeleteTotalHitsOlderThan(timestamp) {}

    /**
     * Удаляет записи о количестве вызовов провайдеров
     * @param {Number} timestamp timestamp дата, записи старше которой надо удалить.
     * @returns {Promise<void>}
     */
    async safeDeleteProviderTotalHitsOlderThan(timestamp) {}

    /**
     *
     * @param  {Number} timestamp timestamp дата, записи старше которой надо удалить.
     * @returns {Promise<void>}
     */
    async deleteTimeseriesHitsOlderThan(timestamp) {};

    /**
     * Удаляет старые записи о длительности выполнения запросов
     * @param  {Number} timestamp timestamp дата, записи старше которой надо удалить.
     * @returns {Promise<void>}
     */
    async deleteTimeseriesResponseTimeOlderThan(timestamp) {};

    /**
     * Удаляет старые записи о длительности выполнения запросов провайдеров
     * @param timestamp
     * @returns {Promise<void>}
     */
    async deleteProviderTimeseriesResponseTimeOlderThan(timestamp) {};

    async flushDeleted() {}
}

module.exports = Storage;