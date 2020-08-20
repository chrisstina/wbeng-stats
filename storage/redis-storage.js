const {promisify} = require('util'),
    redis = require('redis');

const logger = require('./../logger');

const Storage = require('./storage');

class RedisStorage extends Storage {

    constructor(config) {
        super();

        this.config = config;
        this.redisClient = (() => {
            try {
                return redis.createClient(this.config.get('stats.redis.port') || 6379);
            } catch (e) {
                logger.error(e.stack);
            }
            return null;
        })();
    }

    updateRealtimeCounter(timeSlicedHashes, updateBy = 1) {

        const pipe = this.redisClient.multi(); // открываем транзакцию

        for (const [timeSlice, hash] of timeSlicedHashes.entries()) {
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

    updateOperationTotals(operation, hashesToUpdate, updateBy = 1) {
        const pipe = this.redisClient.multi(); // открываем транзакцию

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

    async getRealtimeCounterData(hash, limit = null, offset = 0) {
        const retrieveDataAsync = promisify(this.redisClient.hgetall).bind(this.redisClient);
        try {
            return await retrieveDataAsync(`count:${hash}`);
        } catch (e) {
            logger.error("[STATS][VIEW] HGETALL got error " + err.toString());
        }
    };

    async getOperationTotalsData(hash) {
        const retrieveDataAsync = promisify(this.redisClient.hgetall).bind(this.redisClient);
        try {
            return await retrieveDataAsync(`stats:${hash}`);
        } catch (e) {
            logger.error("[STATS][VIEW] HGETALL got error " + err.toString());
        }
    };
}

module.exports = RedisStorage;