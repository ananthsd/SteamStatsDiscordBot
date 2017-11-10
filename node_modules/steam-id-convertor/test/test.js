var should = require('should');
var dendi32 = '70388657';
var dendi64 = '76561198030654385';
var convertor = require('../index');

describe('Steam Id Convertor', function() {

    it('should convert number from 32-bit to 64-bit', function() {
        convertor.to64(dendi32).should.be.equal(dendi64);
    });

    it('should convert number from 64-bit to 32-bit', function() {
        convertor.to32(dendi64).should.be.equal(dendi32);
    });

});