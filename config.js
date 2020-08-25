module.exports = {
    realtimePrecisions: [ // возможная величина временных отрезков для счетчиков текущих запросов
        "1 minutes",
        "1 hours",
        "1 days"
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
    "storage": "mongo", // redis | mysql | mongo
    "redis": {
        "port": 6379
    },
    "mysql": {},
    "mongo": {
        "connectionUri": "mongodb+srv://wbengStatsUser:AY6T7FFxzN@wbeng-stats.wepfa.mongodb.net/wbeng-stats?retryWrites=true&w=majority",
        "dbName": "wbeng-stats",
    }
};
