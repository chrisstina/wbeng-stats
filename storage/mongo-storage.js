const {MongoClient} = require("mongodb");
const moment = require('moment');

const logger = require('./../logger');

const COUNTER_COLLECTION = 'realtime_hits';
const STATS_COLLECTION = 'aggregate_hits';
const RESPONSETIME_COLLECTION = 'responsetime';
const PROVIDER_STATS_COLLECTION = 'provider_aggregate_hits';
const PROVIDER_RESPONSETIME_COLLECTION = 'provider_responsetime_';
const META_COLLECTION = 'meta';
const COUNTER_META_TYPE = 'known_realtime_hits_keys';
const STATS_META_TYPE = 'known_aggregate_hits_keys';
const PROVIDER_STATS_META_TYPE = 'known_provider_aggregate_hits_keys';

const HASH_DELIMITER = ':';

const Storage = require('./storage');

/**
 *
 * @param filterConditions
 * @constructor
 */
function SearchFilter(filterConditions) {
    const excludeDeleted = {deleted: {$ne: true}}

    this.filter = {...filterConditions, ...excludeDeleted};

    this.withDeleted = function () {
        delete this.filter.deleted;
        return this;
    }

    return this.filter;
}

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

    // ============= Обновление =============

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

            for (const [hash, timeSlice] of timeSlicedHashes.entries()) {
                let updateDoc = {$inc: {}, $set: {}};
                updateDoc['$inc'][`${timeSlice}.hits`] = 1;
                updateDoc['$set'][`${timeSlice}.averageResponseTime`] = await this.getAvgForTimeSlice(collection, {key: hash}, timeSlice, responseTime);

                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
                await metaCollection.updateOne({type: COUNTER_META_TYPE}, {$addToSet: {keys: hash}});
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

            for (const [hash, timeSlice] of timeSlicedHashes.entries()) {
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
    async updateAggregateHits(operation, hashesToUpdate, updateBy = 1) {
        try {
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(STATS_COLLECTION);
            const metaCollection = database.collection(META_COLLECTION);

            let updateDoc = {
                $setOnInsert: {createdAt: Math.floor(Date.now() / 1000)},
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

    async updateProviderAggregateHits(provider, operation, hashesToUpdate, updateBy = 1) {
        try {
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(`${PROVIDER_STATS_COLLECTION}`);
            const metaCollection = database.collection(META_COLLECTION);

            let updateDoc = {
                $setOnInsert: {createdAt: Math.floor(Date.now() / 1000)},
                $inc: {}
            };
            updateDoc.$inc[operation] = updateBy;

            for (const hash of hashesToUpdate) {
                await collection.updateOne({key: `${provider}${HASH_DELIMITER}${hash}`}, updateDoc, {upsert: true});
                await metaCollection.updateOne({type: PROVIDER_STATS_META_TYPE}, {$addToSet: {keys: hash}});
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    // ============= Получение =============

    async getRealtimeCounterData(hash, limit = null, offset = 0) {
        const stats = await this.client
            .db(this.config.dbName)
            .collection(COUNTER_COLLECTION)
            .findOne(
                new SearchFilter({key: hash}),
                {projection: {key: 0, _id: 0}});

        if (stats === null) {
            return {};
        }
        return stats;
    }

    async getResponseTimesData(hash, limit = null, offset = 0) {
        const stats = await this.client
            .db(this.config.dbName)
            .collection(RESPONSETIME_COLLECTION)
            .findOne(
                new SearchFilter({key: hash}),
                {projection: {key: 0, _id: 0}});
        return (stats === null)
            ? null
            : stats;
    }

    async getAggregateHits(hash) {
        const stats = await this.client
            .db(this.config.dbName)
            .collection(STATS_COLLECTION)
            .findOne(
                new SearchFilter({key: hash}),
                {projection: {key: 0, _id: 0}});
        return (stats === null)
            ? null
            : stats;
    }

    async getProviderAggregateHits(provider, hash) {
        const stats = await this.client
            .db(this.config.dbName)
            .collection(PROVIDER_STATS_COLLECTION)
            .findOne(
                new SearchFilter({key: hash}),
                {projection: {key: 0, _id: 0}});
        return (stats === null)
            ? null
            : stats;
    }

    // ============= Удаление =============

    async safeDeleteAggregateHitsOlderThan(timestamp) {
        await this.safeDelete(STATS_COLLECTION, {createdAt: {$lt: timestamp}});
    }

    async safeDeleteProviderAggregateHitsOlderThan(timestamp) {
        await this.safeDelete(PROVIDER_STATS_COLLECTION, {createdAt: {$lt: timestamp}});
    }

    async safeDeleteRealtimeCounterDataOlderThan(timestamp) {
        const timeLimit = moment.unix(timestamp),
            timeSlicesToDelete = {};

        // получим все ключи
        const allCounters = await this.client
            .db(this.config.dbName)
            .collection(COUNTER_COLLECTION)
            .find({}, {projection: {key: 0, _id: 0}});

        for (const record of await allCounters.toArray()) {
            for (const [key, v] of Object.entries(record)) {
                const timeSlice = isNaN(key) ? moment() : moment.unix(key);
                if (timeSlice.isBefore(timeLimit)) {
                    timeSlicesToDelete[key] = "";
                }
            }
        }

        if (Object.entries(timeSlicesToDelete).length > 0) {
            await this.client
                .db(this.config.dbName)
                .collection(COUNTER_COLLECTION)
                .updateMany({},
                    {$unset: timeSlicesToDelete}
                );
        }
    };

    /**
     *
     * @param {string} collectionName
     * @param {{}} filter mongo filter
     * @returns {Promise<void>}
     */
    async safeDelete(collectionName, filter) {
        const database = this.client.db(this.config.dbName);
        const collection = database.collection(collectionName);
        try {
            await collection.updateMany(
                new SearchFilter(filter),
                {$set: {deleted: true}},
                {upsert: true}
            );
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }
}

module.exports = MongoStorage;