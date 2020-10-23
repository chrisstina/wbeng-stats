const {promisify} = require('util'),
    redis = require('redis');

const logger = require('./../logger');

const Storage = require('./storage');

class RedisStorage extends Storage {

    constructor(config) {
        super();
        this.config = config.get('stats.redis');
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.client = redis.createClient(this.config.get('port') || 6379);
            this.client.on("error", reject);
            this.client.on("ready", resolve);
        });
    }

    async updateRealtimeCounter(timeSlicedHashes, updateBy = 1) {

        const pipe = this.client.multi(); // открываем транзакцию

        for (const [hash, timeSlice] of timeSlicedHashes.entries()) {
            pipe.zadd(`knowncounters:`, 0, hash, (err, replies) => {
                if (err) {
                    logger.error("[STATS][UPD] ZADD got error " + err.toString());
                }
            });
            pipe.hincrby(`count:${hash}`, timeSlice, updateBy, (err, replies) => {
                if (err) {
                    logger.error("[STATS][UPD] HINCRBY got error " + err.toString());
                }
            });
        }

        pipe.exec((err, replies) => {
            if (err) {
                logger.error("[STATS][UPD] MULTI got error " + err.toString());
            }
        });
    };

    async updateOperationTotals(operation, hashesToUpdate, updateBy = 1) {
        const pipe = this.client.multi(); // открываем транзакцию

        for (const hash of hashesToUpdate) {
            pipe.zadd(`knownstats:`, 0, hash, (err, replies) => {
                if (err) {
                    logger.error("[STATS][UPD] ZADD got error " + err.toString());
                }
            });

            pipe.hincrby(`stats:${hash}`, operation, updateBy, (err, replies) => {
                if (err) {
                    logger.error("[STATS][UPD] HINCRBY got error " + err.toString());
                }
            });
        }
        pipe.exec((err, replies) => {
            if (err) {
                logger.error("[STATS][UPD] MULTI got error " + err.toString());
            }
        });
    };

    async updateProviderOperationTotals(provider, operation, hashesToUpdate, updateBy = 1) {
        throw new Error('Not implemented');
    }

    async getRealtimeCounterData(hash, limit = null, offset = 0) {
        const retrieveDataAsync = promisify(this.client.hgetall).bind(this.client);
        try {
            return await retrieveDataAsync(`count:${hash}`);
        } catch (e) {
            logger.error("[STATS][VIEW] HGETALL got error " + err.toString());
        }
    };

    async getOperationTotalsData(hash) {
        const retrieveDataAsync = promisify(this.client.hgetall).bind(this.client);
        try {
            return await retrieveDataAsync(`stats:${hash}`);
        } catch (e) {
            logger.error("[STATS][VIEW] HGETALL got error " + err.toString());
        }
    };
}

module.exports = RedisStorage;