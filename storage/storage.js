class Storage {
    /**
     *
     * @param timeSlicedHashes {Map<Number, String>} где ключ - это timestamp начала отрезка времени (гачало текущего часа, минуты, и т.п), а значение - название ключа, например 3600:flights:apirequests:all
     * @param updateBy
     */
    updateRealtimeCounter(timeSlicedHashes, updateBy = 1) {

    }

    /**
     * Обновляет статистику запросов на операцию по временным отрезкам.
     * @param {String} operation название API операции (entryPoint)
     * @param {String[]} hashesToUpdate набор ключей, которые надо обновить. Ключи сформированы по временным отрезкам
     * @param {Number} updateBy default 1
     */
    updateOperationTotals(operation, hashesToUpdate, updateBy = 1) {
    }

    async getRealtimeCounterData() {

    }

    async getOperationTotalsData () {

    }
}

module.exports = Storage;