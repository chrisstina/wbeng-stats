const chai = require('chai');

const expect = chai.expect;

const validator = require('./../validator');

describe('Stats date validator', function () {
    it('should check day', () => {
        expect(() => { validator.checkers.day(1) }).to.throw();
        expect(() => { validator.checkers.day(0) }).to.throw();
        expect(() => { validator.checkers.day(23) }).to.throw();
        expect(() => { validator.checkers.day('20200812') }).to.not.throw();
        expect(() => { validator.checkers.day('2020-08-12') }).to.not.throw();
    });

    it('should check week', () => {
        expect(() => { validator.checkers.week(0) }).to.throw();
        expect(() => { validator.checkers.week(143) }).to.throw();
        expect(() => { validator.checkers.week('20200812') }).to.throw();
        expect(() => { validator.checkers.week('202034') }).to.throw();
        expect(() => { validator.checkers.week('2020-08-12') }).to.throw();
        expect(() => { validator.checkers.week('2020week34') }).to.throw();
        expect(() => { validator.checkers.week(1) }).to.not.throw();
        expect(() => { validator.checkers.week('2020W34') }).to.not.throw();
    });

    it('should check month', () => {
        expect(() => { validator.checkers.month(0) }).to.throw();
        expect(() => { validator.checkers.month(13) }).to.throw();
        expect(() => { validator.checkers.month('2020-08-12') }).to.throw();
        expect(() => { validator.checkers.month('2020-08') }).to.throw();
        expect(() => { validator.checkers.month(1) }).to.not.throw();
        expect(() => { validator.checkers.month('202008') }).to.not.throw();
    });

    it('should check year', () => {
        expect(() => { validator.checkers.year(0) }).to.throw();
        expect(() => { validator.checkers.year(23) }).to.throw();
        expect(() => { validator.checkers.year('20200812') }).to.throw();
        expect(() => { validator.checkers.year('2020-08-12') }).to.throw();
        expect(() => { validator.checkers.year('2020') }).to.not.throw();
        expect(() => { validator.checkers.year(2020) }).to.not.throw();
    })
});