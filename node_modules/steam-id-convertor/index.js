var BigNumber = require('bignumber.js');
var convert = new BigNumber('76561197960265728');

module.exports = {
    to64: function(steamId32) {
        steamId32 = new BigNumber(steamId32);
        var staemId64 = steamId32.plus(convert);
        return staemId64.toString();
    },
    to32: function(steamId64) {
        steamId64 = new BigNumber(steamId64);
        var steamId32 = steamId64.minus(convert);
        return steamId32.toString();
    }
};