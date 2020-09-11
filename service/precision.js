const moment = require('moment'),
    config = require('config');

const statsConfig = config.get('stats');

/**
 * Переводит название временного отрезка в секунды. Например, "1 minutes" => 60
 * @param {string} precision - precision title from config, e.g. "1 minutes", "3 months"
 * @return {number}
 */
const getPrecisionInSeconds = precision => {
    const [duration, unit] = precision.split(" ");
    return moment.duration(parseInt(duration), unit).asSeconds();
};

/**
 * Ассоциация названия временного отрезка и его формата для moment
 * @type {Map<String, String>}
 */
const precisionFormats = new Map();
statsConfig.get('statsPrecisions').forEach((precision, idx) => {
    precisionFormats.set(precision, statsConfig.get('precisionFormats')[idx])
});

/**
 * Ассоциация названия отрезка и его длительности в секундах
 * @type {Map<String, Number>}
 */
const precisionsInSeconds = new Map();
statsConfig.get('realtimePrecisions').forEach(precision => {
    precisionsInSeconds.set(precision, getPrecisionInSeconds(precision));
});

module.exports = {
    /**
     * получаем начало текущего временного отрезка в timestamp
     * @param precisionInSeconds
     * @return {number} timestamp в секундах
     */
    getTimeSliceStart: precisionInSeconds => parseInt(moment().unix() / precisionInSeconds) * precisionInSeconds,
    /**
     * Ассоциация названия отрезка и его длительности в секундах
     * @type {Map<String, Number>}
     */
    precisionsInSeconds,
    /**
     * Ассоциация названия временного отрезка и его формата для moment
     * @type {Map<String, String>}
     */
    precisionFormats
};