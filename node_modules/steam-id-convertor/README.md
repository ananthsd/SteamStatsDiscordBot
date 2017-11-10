# steam-id-convertor
Convert SteamIds from 32-bit to 64-bit numbers and vice versa

Useful when using dota 2 api http://dev.dota2.com/showthread.php?t=58317

> The Dota2 API generally gives you people's SteamIDs as 32-bit numbers.

> In order to convert from these 32-bit numbers to Steam Names, you must first convert between the 32-bit ID and 64-bit ID:
> On a system that supports up to 64-bit numbers you can do the following:
> - STEAMID64 - 76561197960265728 = STEAMID32
> - STEAMID32 + 76561197960265728 = STEAMID64

```sh
    npm install steam-id-convertor
```

```javascript
    var dendi32 = '70388657';
    var dendi64 = '76561198030654385';

    var convertor = require('steam-id-convertor');

    convertor.to64(dendi32) == dendi64;
    convertor.to32(dendi64) == dendi64;
```
