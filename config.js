module.exports = {
    timeseriesPrecisions: [ // возможный масштаб временных отрезков для исторических данных
        "1 minutes",
        "1 hours",
        "1 days",
        "1 months"
    ],
    responseTimePrecisions: [ // возможная величина временных отрезков для статистики длительности запроса
        "30 seconds",
        "1 minutes",
    ],
    totalHitsPrecisions: [ // возможная величина временных отрезков для сбора итоговой статистики по запросам
        "day",
        "week",
        "month",
        "year",
        "minute",
        "hour"
    ],
    timeseriesCounterTTL: "2 days", // сколько храним данные по запросам в реальном времени
    responseTimeTTL: "1 week",  // сколько храним данные по длительности запросов
    totalHitsTTL: "3 months",  // сколько храним данные по итоговой статистике запросами
    precisionFormats: [
        "Y:MM:DD:HH:mm", // 2020:01:09:00:30
        "Y:MM:DD:HH", // 2020:01:09:00
        "Y:MM:DD", // 2020:01:09
        "Y:[W]ww", // 2020:W45
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
