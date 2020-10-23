const chai = require('chai'),
    mockery = require('mockery'),
    moment = require('moment');

const expect = chai.expect;

const statsModule = require('./../index');

describe('Stats module', () => {

    before(async () => {
        mockery.enable({
            warnOnUnregistered: false
        });
        mockery.registerSubstitute('./storage/mongo-storage', './tests/storage/mock-storage');
        return await statsModule.connect();
    });

    after(() => {
        mockery.disable();
    });

    it('should list api stats for profile', async function () {
        const statsRequestsTodayAll = await statsModule.getAPIStats();

        const statsErrorsTodayAll = await statsModule.getAPIStats('error');
        expect(statsErrorsTodayAll).to.have.property('hash', `apierrors:allprofiles:${moment().format('YYYY')}:${moment().format('MM')}:${moment().format('DD')}`);
        expect(statsErrorsTodayAll).to.have.property('flights').which.is.finite;
        expect(statsErrorsTodayAll).to.have.property('price').which.is.finite;

        const statsRequestsThisMonthDefault = await statsModule.getAPIStats('request', 'default', 'month');
        expect(statsRequestsThisMonthDefault).to.have.property('hash', `apirequests:default:${moment().format('YYYY')}:${moment().format('MM')}`);
        expect(statsRequestsThisMonthDefault).to.have.property('flights').which.is.finite;
        expect(statsRequestsThisMonthDefault).to.have.property('price').which.is.finite;

        const statsErrorsSomeWeekDefault = await statsModule.getAPIStats('error', 'default', 'week', '2020W35');
        expect(statsErrorsSomeWeekDefault).to.have.property('hash', `apierrors:default:2020:W35`);
        expect(statsErrorsSomeWeekDefault).to.have.property('flights').which.is.finite;
        expect(statsErrorsSomeWeekDefault).to.have.property('price').which.is.finite;

        const statsRequestsLastYearAll = await statsModule.getAPIStats('request', null, 'year');
        expect(statsRequestsLastYearAll).to.have.property('hash', `apirequests:allprofiles:2020`);
        expect(statsRequestsLastYearAll).to.have.property('flights').which.is.finite;
        expect(statsRequestsLastYearAll).to.have.property('price').which.is.finite;
    });

    it('should list api stats across all profiles', async function () {
        const stats = await statsModule.getAPICallsStatsByProfile('day', '2020-10-23');
        expect(stats).to.have.property('allprofiles');
        expect(stats).to.have.property('default');
        expect(stats).to.have.property('ttservice');
        expect(stats).to.have.property('farf');
        expect(stats.allprofiles).to.have.property('hash', 'apirequests:allprofiles:2020:10:23');

        const statsToday = await statsModule.getAPICallsStatsByProfile('day');
        expect(statsToday).to.have.property('allprofiles');
        expect(statsToday).to.have.property('default');
        expect(statsToday).to.have.property('ttservice');
        expect(statsToday).to.have.property('farf');
        expect(statsToday.allprofiles).to.have.property('hash', `apirequests:allprofiles:${moment().format('YYYY')}:${moment().format('MM')}:${moment().format('DD')}`);

        const statsMonth = await statsModule.getAPICallsStatsByProfile('month');
        expect(statsMonth).to.have.property('allprofiles');
        expect(statsMonth).to.have.property('default');
        expect(statsMonth).to.have.property('ttservice');
        expect(statsMonth).to.have.property('farf');
        expect(statsMonth.allprofiles).to.have.property('hash', `apirequests:allprofiles:${moment().format('YYYY')}:${moment().format('MM')}`);

        const statsMonthNov19 = await statsModule.getAPICallsStatsByProfile('month', '201911');
        const november19 = moment('2019-11-01');
        expect(statsMonthNov19).to.have.property('allprofiles');
        expect(statsMonthNov19).to.have.property('default');
        expect(statsMonthNov19).to.have.property('ttservice');
        expect(statsMonthNov19).to.have.property('farf');
        expect(statsMonthNov19.allprofiles).to.have.property('hash', `apirequests:allprofiles:${november19.format('YYYY')}:${november19.format('MM')}`);

    });

    it.skip('should list api stats table for every profile', function (done) {});

    it.skip('should list realtime api stats for profile', function (done) {
    });
});