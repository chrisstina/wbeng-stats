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

    flushOldTotals() {
        const timestamp = moment().subtract(...statsConfig.totalHitsTTL.split(' ')).unix();
        this._storage.safeDeleteTotalHitsOlderThan(timestamp);
        this._storage.safeDeleteProviderTotalHitsOlderThan(timestamp);
    }

    flushOldTimeseries() {
        const timestamp = moment().subtract(moment.duration(...statsConfig.timeseriesCounterTTL.split(' '))).unix();
        this._storage.deleteTimeseriesHitsOlderThan(timestamp);
    }

    flushOldResponseTime() {
        const timestamp = moment().subtract(moment.duration(...statsConfig.responseTimeTTL.split(' '))).unix();
        this._storage.deleteTimeseriesResponseTimeOlderThan(timestamp);
        this._storage.deleteProviderTimeseriesResponseTimeOlderThan(timestamp);
    }
}

module.exports = StatsCleaner;