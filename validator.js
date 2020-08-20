const moment = require('moment');

/**
 * Допустипые значения для дня:
 * дата в формате 2020-08-19
 *
 * @param value
 * @return {string} день в формате moment (Y-M-D) например, 2020-08-19
 */
const normalizeDay = value => {
    if ( ! /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Недопустимое значение дня. Допустимый формат: Y-M-D (например, 2020-08-19)');
    }
    return value;
};

/**
 * Допустимые значения для недели:
 * номер недели 1 - 53 или 01 - 53
 * номер недели с годом 2020W01
 *
 * @param value
 * @return {string} неделя в формате moment (Y[W]w) например, 2020W34, 2020W09
 */
const normalizeWeek = value => {
    if (/[^W|\d]/.test(value)) {
        throw new Error('Недопустимое значение недели. Допустимый формат: w (например, 34) или Y[W]w (например, 2020W34)');
    }

    if (/^\d$/.test(value)) { // добавим leading zero, если номер недели из одной цифры
        value = ('0' + value).slice(-2);
    }

    if (/^\d+$/.test(value)) { // если пришел только номер недели, добавим текущий год
        if (parseInt(value) <= 0 || parseInt(value) > 53) {
            throw new Error('Недопустимое значение недели. Номер недели должен быть между 1 и 53');
        }
        value = `${moment().format('Y')}W${value}`;
    }

    return value;
};

/**
 * Допустимые значения для месяца:
 * номер месяца 1 - 12 или 01 - 12
 * номер месяца с годом 202008
 * @param value
 * @return {string} месяц в формате moment (YMM) например, 202008
 */
const normalizeMonth = value => {
    if ( ! /^\d$|^\d{2}$|^\d{6}$/.test(value)) {
        throw new Error('Недопустимое значение месяца. Допустимый формат: MM (например, 08) или YMM (например, 202008)');
    }

    if (/^\d{1,2}$/.test(value)) {
        value = ('0' + value).slice(-2);
        if (parseInt(value) <= 0 || parseInt(value) > 12) {
            throw new Error('Недопустимое значение месяца. Номер месяца должен быть между 1 и 12');
        }
        value = `${moment().format('Y')}${value}`;
    }
    return value;
};

/**
 * Допустимые значения для года:
 * полный номер года, например, 2020
 * @param value
 * @return {string} год в формате moment (Y) например, 2020
 */
const normalizeYear = value => {
    if ( ! /^2[\d]{3}$/.test(value)) {
        throw new Error('Недопустимое значение года. Допустимый формат: Y (например, 2020)');
    }
    return value;
};

module.exports = {
    'day': normalizeDay,
    'week': normalizeWeek,
    'month': normalizeMonth,
    'year': normalizeYear
};