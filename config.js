module.exports = {
    realtimePrecisions: [ // возможная величина временных отрезков для счетчиков текущих запросов
        "1 minutes",
        "1 hours",
        "1 days"
    ],
    responseTimePrecisions: [ // возможная величина временных отрезков для статистики длительности запроса
        "30 seconds",
        "1 minutes",
    ],
    "statsPrecisions": [ // возможная величина временных отрезков для сбора итоговой статистики по запросам
        "day",
        "week",
        "month",
        "year",
    ],
    "precisionFormats": [
        "Y:MM:DD", // 2020:01:09
        "Y:[W]w", // 2020:W45
        "Y:MM", // 01:2020
        "Y" // 2020
    ],
    "allowedOperations": [
        "flights",
        "price",
        "book",
        "display",
        "ancillaries",
        "ancillary",
        "ticket",
        "cancel",
        "void"
    ],
    "allowedProfiles": [
        "allprofiles",
        "default",
        "ttservice",
        "farf",
        "ttbkz",
        "goravia",
        "tsg"
    ],
    "allowedProviders": [
        "1S",
        "2S",
        "1H",
        "2H",
        "1A",
        "TA",
        "TS",
        "S7",
        "DP",
        "AC",
        "KW",
        "1B"
    ],
    "storage": "mongo", // redis | mysql | mongo
    "redis": {
        "port": 6379
    },
    "mysql": {},
    "mongo": {
        "connectionUri": "",
        "dbName": "wbeng-stats",
    }
};
