const config = require('config'),
    moment = require('moment');

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
        const timestamp = moment().subtract(...statsConfig.totalHitsPrecisionsTTL.split(' ')).unix();
        this._storage.safeDeleteTotalHitsOlderThan(timestamp);
        this._storage.safeDeleteProviderTotalHitsOlderThan(timestamp);
    }

    flushOldRealtimeData() {
        const timestamp = moment().subtract(moment.duration(...statsConfig.realtimePrecisionsTTL.split(' '))).unix();
        this._storage.deleteRealtimeCounterDataOlderThan(timestamp);
    }

    flushOldResponsetimeData() {
        const timestamp = moment().subtract(moment.duration(...statsConfig.responseTimePrecisionsTTL.split(' '))).unix();
        this._storage.deleteResponsetimeDataOlderThan(timestamp);
        this._storage.deleteProviderResponsetimeDataOlderThan(timestamp);
    }
}

module.exports = StatsCleaner;