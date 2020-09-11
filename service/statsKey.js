
const ALL_PROFILES_KEY = 'allprofiles';
const ALL_METHODS_KEY = 'allmethods';
const API_REQUESTS_KEY = 'apirequests';
const API_ERRORS_KEY = 'apierrors';

module.exports = {
    /**
     * Имя для счетчика
     * @param {string} type тип записи - request | error
     * @param {string|null} entryPoint название операции
     * @param {string|null} profile профиль запроса
     * @return {string} например, apirequests:flights::ttservice или apirequests:allmethids:default
     */
    generateCounterName: (type, entryPoint = null, profile = null) => `${type === 'error' ? API_ERRORS_KEY : API_REQUESTS_KEY}:${entryPoint || ALL_METHODS_KEY}:${profile || ALL_PROFILES_KEY}`,

    /**
     * Имя ключа для статистики запросов, например apirequests:all или apirequests:default
     * @param {string} type тип записи - request | error
     * @param profile
     * @return {string} например, apirequests:ttservice или apirequests:default
     */
    generateStatsName: (type, profile = null) => `${type === 'error' ? API_ERRORS_KEY : API_REQUESTS_KEY}:${profile || ALL_PROFILES_KEY}`
};