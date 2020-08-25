const {MongoClient} = require("mongodb");

const logger = require('./../logger');

const COUNTER_COLLECTION = 'realtime';
const STATS_COLLECTION = 'stats';
const HASH_DELIMITER = ':';

const Storage = require('./storage');

class MongoStorage extends Storage {

    constructor(config) {
        super();
        this.config = config.get('stats.mongo');
    }

    async connect() {
        this.client = new MongoClient(this.config.get('connectionUri'), {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await this.client.connect();
    }

    /**
     *
     * @param timeSlicedHashes {Map<Number, String>} где ключ - это timestamp начала отрезка времени (начало текущего часа, минуты, и т.п), а значение - название ключа, например 3600:flights:apirequests:all
     * @param updateBy
     */
    async updateRealtimeCounter(timeSlicedHashes, updateBy = 1) {
        try {
            const database = this.client.db("wbeng-stats");
            const collection = database.collection(COUNTER_COLLECTION);
            let updateDoc = {
                $inc: {}
            };
            let countType; // apirequests, errors, etc. Берется из первого сегмента ключа.
            for (const [timeSlice, hash] of timeSlicedHashes.entries()) {
                let hashParts = hash.split(HASH_DELIMITER);
                countType = hashParts.shift();
                updateDoc.$inc[`${hashParts.join(HASH_DELIMITER)}.${timeSlice}`] = updateBy;
            }
            await collection.updateOne({key: countType}, updateDoc, {upsert: true});
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
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(STATS_COLLECTION);
            let updateDoc = {
                $inc: {}
            };

            for (const hash of hashesToUpdate) {
                updateDoc.$inc[operation] = updateBy;
                await collection.updateOne({key: hash}, updateDoc, {upsert: true}); // @todo оптимизировать
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async getRealtimeCounterData(hash, limit = null, offset = 0) {

    }

    async getOperationTotalsData(hash) {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(STATS_COLLECTION);
        const stats = await collection.findOne({key: hash});
        delete stats._id;
        delete stats.key;
        return stats;
    }
}

module.exports = MongoStorage;