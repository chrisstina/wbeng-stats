const {MongoClient} = require("mongodb");

const logger = require('./../logger');

const COUNTER_COLLECTION = 'realtime';
const STATS_COLLECTION = 'stats';
const PROVIDER_STATS_COLLECTION = 'provider_stats_';
const META_COLLECTION = 'meta';
const COUNTER_META_TYPE = 'known_realtime_keys';
const STATS_META_TYPE = 'known_stats_keys';
const PROVIDER_STATS_META_TYPE = 'known_provider_stats_keys';

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
     * @param timeSlicedHashes {Map<Number, String>} где ключ - это timestamp начала отрезка времени (начало текущего часа, минуты, и т.п), а значение - название ключа, например apirequests:allmethods:allprofiles3600
     * @param updateBy
     */
    async updateRealtimeCounter(timeSlicedHashes, updateBy = 1) {
        try {
            const database = this.client.db("wbeng-stats");
            const collection = database.collection(COUNTER_COLLECTION);
            const metaCollection = database.collection(META_COLLECTION);

            for (const [timeSlice, hash] of timeSlicedHashes.entries()) {
                let updateDoc = {
                    $inc: {}
                };
                updateDoc.$inc[`${timeSlice}`] = updateBy;
                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
                await metaCollection.updateOne({type: COUNTER_META_TYPE}, {$addToSet: {keys: hash}});
            }
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
            const metaCollection = database.collection(META_COLLECTION);

            let updateDoc = {
                $inc: {}
            };

            for (const hash of hashesToUpdate) {
                updateDoc.$inc[operation] = updateBy;
                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
                await metaCollection.updateOne({type: STATS_META_TYPE}, {$addToSet: {keys: hash}});
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async updateProviderOperationTotals(provider, operation, hashesToUpdate, updateBy = 1) {
        try {
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(`${PROVIDER_STATS_COLLECTION}${provider}`);
            const metaCollection = database.collection(META_COLLECTION);

            let updateDoc = {
                $inc: {}
            };
            updateDoc.$inc[operation] = updateBy;

            for (const hash of hashesToUpdate) {
                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
                await metaCollection.updateOne({type: PROVIDER_STATS_META_TYPE}, {$addToSet: {keys: hash}});
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async getRealtimeCounterData(hash, limit = null, offset = 0) {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(COUNTER_COLLECTION);
        const stats = await collection.findOne({key: hash});

        if (stats === null) {
            return {};
        }

        delete stats._id;
        delete stats.key;
        return stats;
    }

    async getOperationTotalsData(hash) {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(STATS_COLLECTION);
        const stats = await collection.findOne({key: hash});

        if (stats === null) {
            return {};
        }

        delete stats._id;
        delete stats.key;
        return stats;
    }

    async getProviderOperationTotalsData(provider, hash) {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(`${PROVIDER_STATS_COLLECTION}${provider}`);
        const stats = await collection.findOne({key: hash});

        if (stats === null) {
            return {};
        }

        delete stats._id;
        delete stats.key;
        return stats;
    }
}

module.exports = MongoStorage;