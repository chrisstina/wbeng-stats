const moment = require('moment');

module.exports = {
    normalizeWeek: value => {
        if (/[^W|\d]/.test(value)) {
            throw new Error('Недопустимое значение недели. Допустимый формат: w (например, 34) или Y[W]w (например, 2020W34)');
        }

        if (/^\d{1}$/.test(value)) {
            value = ('0' + value).slice(-2);
        }

        if (/^\d+$/.test(value)) {
            value = `${moment().format('Y')}W${value}`;
        }

        return value;
    },
    normalizeMonth: value => {
        if (/[^\d]/.test(value)) {
            throw new Error('Недопустимое значение месяца. Допустимый формат: MM (например, 08) или YMM (например, 202008)');
        }

        if (/^\d{1,2}$/.test(value)) {
            value = ('0' + value).slice(-2);
            value = `${moment().format('Y')}${value}`;
        }
        return value;
    },
    normalizeYear: value => {
        if ( ! /^2[\d]{3}$/.test(value)) {
            throw new Error('Недопустимое значение года. Допустимый формат: Y (например, 2020)');
        }
        return value;
    }
};