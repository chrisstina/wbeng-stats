/**
 * Модуль для вывода логов в консоль
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, splat, colorize } = format;
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

module.exports = createLogger({
    format: combine(
        splat(),
        colorize(),
        timestamp(),
        myFormat
    ),
    transports: [ new transports.Console({ level: 'silly' }) ]
});