const {MongoClient} = require("mongodb");
const assert = require('assert'),
    moment = require('moment');

const logger = require('./../logger');

const COUNTER_COLLECTION = 'timeseries_hits';
const TOTALS_COLLECTION = 'total_hits';
const RESPONSETIME_COLLECTION = 'responsetime';
const PROVIDER_TOTALS_COLLECTION = 'provider_total_hits';
const PROVIDER_COUNTER_COLLECTION = 'provider_timeseries_hits';
const PROVIDER_RESPONSETIME_COLLECTION = 'provider_responsetime';

const {HASH_DELIMITER} = require('./../service/statsKey');

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

/**
 *
 * @type {{createdAt: number, _id: number, key: number}}
 */
const defaultProjection = {key: 0, _id: 0, createdAt: 0};

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
     * @deprecated
     */
    async updateTimeseriesHits(timeSlicedHashes, updateBy = 1) {
        await this.updateTimeseries(COUNTER_COLLECTION, timeSlicedHashes, updateBy);
    }

    /**
     *
     * @param timeSlicedHashes
     * @param updateBy
     * @return {Promise<void>}
     * @deprecated
     */
    async updateProviderTimeseriesHits(timeSlicedHashes, updateBy = 1) {
        await this.updateTimeseries(PROVIDER_COUNTER_COLLECTION, timeSlicedHashes, updateBy);
    }

    async updateTimeseriesResponseTime(timeSlicedHashes, responseTime) {
        try {
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(RESPONSETIME_COLLECTION);

            for (const [hash, timeSlice] of timeSlicedHashes.entries()) {
                let updateDoc = {$inc: {}, $set: {}};
                updateDoc['$inc'][`${timeSlice}.hits`] = 1;
                updateDoc['$set'][`${timeSlice}.averageResponseTime`] = await this.getAvgForTimeSlice(collection, {key: hash}, timeSlice, responseTime);

                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    async updateProviderTimeseriesResponseTime(timeSlicedHashes, responseTime) {
        try {
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(`${PROVIDER_RESPONSETIME_COLLECTION}`);

            for (const [hash, timeSlice] of timeSlicedHashes.entries()) {
                let updateDoc = {$inc: {}, $set: {}};
                updateDoc['$inc'][`${timeSlice}.hits`] = 1;
                updateDoc['$set'][`${timeSlice}.averageResponseTime`] = await this.getAvgForTimeSlice(collection, {key: hash}, timeSlice, responseTime);

                await collection.updateOne({key: hash}, updateDoc, {upsert: true});

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
     * @param {Map} timeSlicedHashesToUpdate - набор значений таймпстэмпов начала временного отрезка
     * @param {Number} updateBy default 1
     */
    async updateTotalHits(operation, hashesToUpdate, timeSlicedHashesToUpdate, updateBy = 1) {
        try {
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(TOTALS_COLLECTION);

            let updateDoc = this.createUpdateDocForTotalHits(operation, updateBy);

            for (const hash of hashesToUpdate) {
                assert( ! Number.isNaN(timeSlicedHashesToUpdate.get(hash)));
                updateDoc.$set.startSliceTimestamp = timeSlicedHashesToUpdate.get(hash);
                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    /**
     * Обновляет статистику запросов по провайдерам на операцию по временным отрезкам.
     * @param {string} provider
     * @param {string} operation
     * @param {string[]} hashesToUpdate
     * @param {Map<string, number>} timeSlicedHashesToUpdate
     * @param {number} updateBy
     * @return {Promise<void>}
     */
    async updateProviderTotalHits(provider, operation, hashesToUpdate, timeSlicedHashesToUpdate, updateBy = 1) {
        try {
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(`${PROVIDER_TOTALS_COLLECTION}`);

            let updateDoc = this.createUpdateDocForTotalHits(operation, updateBy);

            for (const hash of hashesToUpdate) {
                assert( ! Number.isNaN(timeSlicedHashesToUpdate.get(hash)));
                updateDoc.$set.startSliceTimestamp = timeSlicedHashesToUpdate.get(hash);
                await collection.updateOne({key: `${provider}${HASH_DELIMITER}${hash}`}, updateDoc, {upsert: true});
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    // ============= Получение =============

    async getTimeseriesHits(hashes, operation= null) {
        return this.getTimeseries(TOTALS_COLLECTION, hashes, operation);
    }

    async getProviderTimeseriesHits(provider, hashes, operation= null) {
        return this.getTimeseries(PROVIDER_TOTALS_COLLECTION, hashes, operation);
    }

    async getTimeseriesResponseTime(hash, limit = null, offset = 0) {
        const stats = await this.client
            .db(this.config.dbName)
            .collection(RESPONSETIME_COLLECTION)
            .findOne(
                new SearchFilter({key: hash}),
                {projection: defaultProjection});
        return (stats === null)
            ? null
            : stats;
    }

    async getProviderTimeseriesResponseTime(provider, hash) {
        const stats = await this.client
            .db(this.config.dbName)
            .collection(PROVIDER_RESPONSETIME_COLLECTION)
            .findOne(
                new SearchFilter({key: `${provider}${HASH_DELIMITER}${hash}`}),
                {projection: defaultProjection});
        return (stats === null)
            ? null
            : stats;
    }

    async getTotalHits(hash) {
        const stats = await this.client
            .db(this.config.dbName)
            .collection(TOTALS_COLLECTION)
            .findOne(
                new SearchFilter({key: hash}),
                {projection: defaultProjection});
        return (stats === null)
            ? null
            : stats;
    }

    async getProviderTotalHits(provider, hash) {
        const stats = await this.client
            .db(this.config.dbName)
            .collection(PROVIDER_TOTALS_COLLECTION)
            .findOne(
                new SearchFilter({key: `${provider}${HASH_DELIMITER}${hash}`}),
                {projection: defaultProjection});
        return (stats === null)
            ? null
            : stats;
    }

    // ============= Удаление =============

    async safeDeleteTotalHitsOlderThan(timestamp) {
        await this.safeDelete(TOTALS_COLLECTION, {createdAt: {$lt: timestamp}});
    }

    async safeDeleteProviderTotalHitsOlderThan(timestamp) {
        await this.safeDelete(PROVIDER_TOTALS_COLLECTION, {createdAt: {$lt: timestamp}});
    }

    async deleteTimeseriesHitsOlderThan(timestamp) {
        await this.deleteTimeseriesOlderThan(COUNTER_COLLECTION, timestamp);
    };

    async deleteTimeseriesResponseTimeOlderThan(timestamp) {
        await this.deleteTimeseriesOlderThan(RESPONSETIME_COLLECTION, timestamp);
    };

    async deleteProviderTimeseriesResponseTimeOlderThan(timestamp) {
        await this.deleteTimeseriesOlderThan(PROVIDER_RESPONSETIME_COLLECTION, timestamp);
    };

    /**
     *
     * @param collectionName
     * @param timeSlicedHashes
     * @param updateBy
     * @returns {Promise<void>}
     * @deprecated
     */
    async updateTimeseries(collectionName, timeSlicedHashes, updateBy = 1) {
        try {
            const database = this.client.db(this.config.dbName);
            const collection = database.collection(collectionName);

            for (const [timeSlice, hash] of timeSlicedHashes.entries()) {
                let updateDoc = {
                    $inc: {}
                };
                updateDoc.$inc[`${timeSlice}`] = updateBy;
                await collection.updateOne({key: hash}, updateDoc, {upsert: true});
            }
        } catch (e) {
            logger.error('[STATS][STORAGE][MONGO]' + e.stack);
        }
    }

    /**
     *
     * @param collection
     * @param hashes
     * @param operation
     * @returns {Promise<*|{}>}
     */
    async getTimeseries(collection, hashes, operation) {
        let operationsProjection = {};
        if (operation && operation !== null) {
            operationsProjection = {key: 1, startSliceTimestamp: 1};
            operationsProjection[operation] = 1;
        }

        const stats = await this.client
            .db(this.config.dbName)
            .collection(collection)
            .find(
                new SearchFilter({key: {$in: hashes}}),
                {projection: defaultProjection})
            .project(operationsProjection)

        if (stats === null) {
            return {};
        }

        const timestampedResults = {};
        for await (const doc of stats) {
            if (doc.startSliceTimestamp) {
                timestampedResults[doc.startSliceTimestamp] = operation
                    ? doc[operation]
                    : this.sumUpOperations(doc);
            }
        }
        return timestampedResults;
    }

    createUpdateDocForTotalHits(operation, updateBy) {
        let updateDoc = {
            $setOnInsert: {
                createdAt: Math.floor(Date.now() / 1000),
            },
            $inc: {},
            $set: {startSliceTimestamp: 0} // timestamp начала временного отрезка для данного масштаба (начало часа, начало минуты и т.п.)
        };
        updateDoc.$inc[operation] = updateBy;
        return updateDoc;
    }

    /**
     * Для записи в коллекции просуммирует все значения полей с названиями операций
     * @param key
     * @param startSliceTimestamp
     * @param _id
     * @param createdAt
     * @param {{}} operations
     * @return {Number}
     */
    sumUpOperations({key, startSliceTimestamp, _id, createdAt, ...operations}) {
        return Object.values(operations).reduce((total, current) => total + current, 0);
    }

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

    /**
     * Для документов, имеющих структуру {timesamp: hits} удаляет все записи, где timestamp меньше указанного
     * @param collectionName
     * @param timestamp
     * @returns {Promise<void>}
     */
    async deleteTimeseriesOlderThan(collectionName, timestamp) {
        const timeLimit = moment.unix(timestamp),
            timeSlicesToDelete = {};

        // получим все ключи для каждого документа коллекции
        const allCounters = await this.client
            .db(this.config.dbName)
            .collection(collectionName)
            .find({}, {projection: {key: 0, _id: 0}});

        // отсортируем старые записи для каждого документа коллекции
        for (const record of await allCounters.toArray()) {
            for (const [key, v] of Object.entries(record)) {
                const timeSlice = isNaN(key) ? moment() : moment.unix(key);
                if (timeSlice.isBefore(timeLimit)) {
                    timeSlicesToDelete[key] = "";
                }
            }
        }

        // удалим старые записи для каждого документа коллекции
        const count = Object.entries(timeSlicesToDelete).length;
        if (count > 0) {
            logger.info(`[STATS][STORAGE][MONGO] Removing ${count} old records`);
            await this.client
                .db(this.config.dbName)
                .collection(collectionName)
                .updateMany({},
                    {$unset: timeSlicesToDelete}
                );
            logger.info(`[STATS][STORAGE][MONGO] ${count} old records have been deleted from ${collectionName}`);
        }
    }

    /**
     * Запрашивает среднее значение величин для указанного отрезка времени
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
        if (responseTimeForTimeSlice !== null && responseTimeForTimeSlice[timeSlice]) {
            const {hits, averageResponseTime} = responseTimeForTimeSlice[timeSlice];
            return this.updateAverage(hits, averageResponseTime, responseTime);
        }
        return updatedAverageResponseTime;
    }

    /**
     *  Пересчитывает значение среднего при добавлении нового элемента
     *  ( n * a + v ) / n + 1;
     * @param currentCount
     * @param currentAverage
     * @param updateWithValue
     * @return {number}
     */
    updateAverage(currentCount, currentAverage, updateWithValue) {
        const n = currentCount + 1; // new count
        return (n * currentAverage + updateWithValue) / (n + 1);
    }
}

module.exports = MongoStorage;