const config = require('config'),
    moment = require('moment');

const keyModule = require('./statsKey');

const statsConfig = config.get('stats');

class StatsCleaner {
    constructor(storageService) {
        this._storage = storageService;
        this._env = process.env.NODE_ENV || 'test';
    }

    set env(value) {
        this._env = value;
    }

    flushOldAggregateData() {
        const timestamp = moment().subtract(...statsConfig.aggregateHitsPrecisionsTTL.split(' ')).unix();
        this._storage.safeDeleteAggregateHitsOlderThan(timestamp);
        this._storage.safeDeleteProviderAggregateHitsOlderThan(timestamp);
    }

    flushOldRealtimeData() {

    }
}

module.exports = StatsCleaner;