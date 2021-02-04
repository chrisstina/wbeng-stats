const assert = require('assert'),
    config = require('config'),
    moment = require('moment');

const statsConfig = config.get('stats');
const validate = require('./../validator');

/**
 * Переводит название временного отрезка в секунды. Например, "1 minutes" => 60
 * @param {string} precision - precision title from config, e.g. "1 minutes", "3 months" OR "minute", "month" etc
 * @return {number}
 */
const getPrecisionInSeconds = precision => {
    const defaultUnit = 1;
    if (precision.indexOf(' ') === -1) {
        precision = [defaultUnit, precision].join(' ')
    }
    const [duration, unit] = precision.split(" ");
    return moment.duration(parseInt(duration), unit).asSeconds();
};

/**
 * Ассоциация названия временного отрезка и его формата для moment
 * @type {Map<String, String>}
 */
const precisionFormats = new Map();
statsConfig.get('totalHitsPrecisions').forEach((precision, idx) => {
    precisionFormats.set(precision, statsConfig.get('precisionFormats')[idx])
});

/**
 * Ассоциация названия отрезка и его длительности в секундах
 * @type {Map<String, Number>}
 */
const precisionsInSeconds = new Map();
    [...statsConfig.get('totalHitsPrecisions'),
    ...statsConfig.get('timeseriesPrecisions'),
    ...statsConfig.get('responseTimePrecisions')]
    .forEach(precision => {
        precisionsInSeconds.set(precision, getPrecisionInSeconds(precision));
});

/**
 * Генерирует <limit> предыдущих значений timestamp с периодом duration
 * @param {Moment} timestamp
 * @param {Duration} duration
 * @param {Number} limit
 * @param {Moment[]} timestampStack
 * @return {Moment[]}
 */
const subtractDuration = function (timestamp, duration, limit, timestampStack = []) {
    if (timestampStack.length === limit) {
        return timestampStack;
    } else {
        const prevTimestamp = moment(timestamp).subtract(duration);
        return subtractDuration(prevTimestamp, duration, limit, [...timestampStack, prevTimestamp]);
    }
}

module.exports = {
    /**
     * получаем начало текущего временного отрезка в timestamp
     * @param precisionInSeconds
     * @return {number} timestamp в секундах
     */
    getTimeSliceStart: precisionInSeconds => parseInt(moment().unix() / precisionInSeconds) * precisionInSeconds,

    /**
     * Генерирует указанное количество предыдущих значений timestamp с периодом duration
     * @param {"second"|"minute"|"day"|"week"|"month"|"year"} precision - precision название отрезка времени
     * @param {Number} limit - сколько значений нужно сгенерировать
     * @param {Number|null} offset
     * @throws Error
     * @return {(Moment)[]}
     */
    getPreviousTimestampsForPrecision: (precision, limit = 10, offset = 0) => {
        assert(Number.isInteger(limit));
        const step = 1;
        const duration = moment.duration(step, precision);
        assert(duration.isValid(), 'Некорректное значение масштаба по времени');
        return [moment(), ...subtractDuration(moment(), duration, limit)];
    },
    /**
     * Нормализует полученное значение value и приводит его к нужной дате.
     *
     * Если задан масштаб (precision) - год, вернет номер года (если не указан, то текущий)
     * Если задан масштаб (precision) - неделя, вернет номер недели с годом в формате moment (если не указано, то текущая неделя текущего года, если указана только неделя - неделя текущего года)
     * Если задан масштаб (precision) - год, вернет номер года (текущий, или переданный)
     *
     * @param {string} precision year / month / week / day / hour / minute - масштаб приближения
     * @param {string} value дата в формате Moment (2020-08-19, 2020W34, 32, 1)
     * @return {string} дата для формирования ключа, например, 2020:, 2020:08, 2020:W34
     * @throws validation error
     */
    valueToDate: (precision, value) => {
        const date = moment(validate.normalizers[precision](value));
        assert(date.isValid(), `Некорректное значение value для ${precision}. Ожидается валидная дата`);
        return date.format(precisionFormats.get(precision));
    },
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