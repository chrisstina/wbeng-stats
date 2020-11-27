const {MongoClient} = require("mongodb");

const logger = require('./../logger');

const COUNTER_COLLECTION = 'realtime_hits';
const STATS_COLLECTION = 'aggregate_hits';
const RESPONSETIME_COLLECTION = 'responsetime';
const PROVIDER_STATS_COLLECTION = 'provider_aggregate_hits_';
const PROVIDER_RESPONSETIME_COLLECTION = 'provider_responsetime_';
const META_COLLECTION = 'meta';
const COUNTER_META_TYPE = 'known_realtime_hits_keys';
const STATS_META_TYPE = 'known_aggregate_hits_keys';
const PROVIDER_STATS_META_TYPE = 'known_provider_aggregate_hits_keys';

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
     * @param timeSlicedHashes {Map<string, number>} где ключ - это timestamp начала отрезка времени (начало текущего часа, минуты, и т.п), а значение - название ключа, например apirequests:allmethods:allprofiles3600
     * @param updateBy
     */
    async updateRealtimeCounter(timeSlicedHashes, updateBy = 1) {
        try {
            const database = this.client.db("wbeng-stats");
            const collection = database.collection(COUNTER_COLLECTION);
            const metaCollection = database.collection(META_COLLECTION);

            for (const [hash, timeSlice] of timeSlicedHashes.entries()) {
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
     *
     * @param collection
     * @param query
     * @param timeSlice
     * @param responseTime
     * @return {Promise<number>}
     */
    async getAvgForTimeSlice(collection, query, timeSlice, responseTime) {
        const options = {projection: {}};
        options.projection[timeSlice] = 1;
        const responseTimeForTimeSlice = await collection.findOne(query, options);

        let updatedAverageResponseTime = responseTime;
        if (responseTimeForTimeSlice !== null && responseTimeForTimeSlice[timeSlice]) { //( n * a + v ) / n + 1;
            const {hits, averageResponseTime} = responseTimeForTimeSlice[timeSlice];
            return this.updateAverage(hits, averageResponseTime, responseTime);
        }
        return updatedAverageResponseTime;
    }

    /**
     *
     * @param currentCount
     * @param currentAverage
     * @param updateWithValue
     * @return {number}
     */
    updateAverage(currentCount, currentAverage, updateWithValue) {
        const n = currentCount + 1; // new count
        return (n * currentAverage + updateWithValue) / (n + 1);
    }

    async updateAPIResponseTime(timeSlicedHashes, responseTime) {
        try {
            const database = this.client.db("wbeng-stats");
            const collection = database.collection(RESPONSETIME_COLLECTION);
            const metaCollection = database.collection(META_COLLECTION);

            for ( const [ hash, timeSlice ] of timeSlicedHashes.entries() ) {
                let updateDoc = {$inc: {}, $set: {}};
                updateDoc['$inc'][`${timeSlice}.hits`] = 1;
                updateDoc['$set'][`${timeSlice}.averageResponseTime`] = await this.getAvgForTimeSlice(collection, {key: hash}, timeSlice, responseTime);

                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
                await metaCollection.updateOne({type: COUNTER_META_TYPE}, {$addToSet: {keys: hash}});

                logger.info('[STATS][STORAGE][MONGO]' + timeSlice + ' ' + hash);
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async updateProviderResponseTime(timeSlicedHashes, responseTime, provider) {
        try {
            const database = this.client.db("wbeng-stats");
            const collection = database.collection(`${PROVIDER_RESPONSETIME_COLLECTION}${provider}`);
            const metaCollection = database.collection(META_COLLECTION);

            for ( const [ hash, timeSlice ] of timeSlicedHashes.entries() ) {
                let updateDoc = {$inc: {}, $set: {}};
                updateDoc['$inc'][`${timeSlice}.hits`] = 1;
                updateDoc['$set'][`${timeSlice}.averageResponseTime`] = await this.getAvgForTimeSlice(collection, {key: hash}, timeSlice, responseTime);

                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
                await metaCollection.updateOne({type: COUNTER_META_TYPE}, {$addToSet: {keys: hash}});

                logger.info('[STATS][STORAGE][MONGO]' + timeSlice + ' ' + hash);
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
        const stats = await collection.findOne({key: hash}, { projection: { key: 0, _id: 0 } });

        if (stats === null) {
            return {};
        }
        return stats;
    }

    async getResponseTimesData(hash, limit = null, offset = 0) {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(RESPONSETIME_COLLECTION);
        const stats = await collection.findOne({key: hash}, { projection: { key: 0, _id: 0 } });

        if (stats === null) {
            return {};
        }
        return stats;
    }

    async getOperationTotalsData(hash) {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(STATS_COLLECTION);
        const stats = await collection.findOne({ key: hash }, { projection: { key: 0, _id: 0 } });

        if (stats === null) {
            return {};
        }
        return stats;
    }

    async getProviderOperationTotalsData(provider, hash) {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(`${PROVIDER_STATS_COLLECTION}${provider}`);
        const stats = await collection.findOne({key: hash}, { projection: { key: 0, _id: 0 } });

        if (stats === null) {
            return {};
        }
        return stats;
    }

    async getRealtimeKeys() {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(META_COLLECTION);
        try {
            const meta = await collection.find({type: STATS_META_TYPE}).toArray();
            return meta[0].keys;
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
            return [];
        }

    }
}

module.exports = MongoStorage;