# SteamStatsDiscordBot
This is a bot I am working on that pulls information from Steam, OpenDota, and maybe others in the future to give information.
## Commands
`!ping` to see if the bot is online.

![!ping](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!ping.png "!ping")

`!help` to see available commands.

![!help](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!help.png "!help")

`!gethero <hero-name>` to see hero info.

![!gethero](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!gethero.png "!gethero")

`!getitem <item-name>` to see item info.

![!getitem](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!getitem.png "!getitem")

`!dotaprofile <steam id (custom or not)>` to get basic dota info.

![!dotaprofile](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!dotaprofile.png "!dotaprofile")

`!csgostats <steam id (custom or not)>` to get csgo info.

![!csgostats](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!csgostats.png "!csgostats")

`!banstatus <steam id (custom or not)>` to get ban info.

![!banstatus](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!banstatus.png "!banstatus")

`!randtablenum <Line> <Min> <Max> <Number Of Numbers> <Repeats(true or false)>` to get a random number from the AP Stats Table.

![!randtablenum](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!randtablenum.png "!randtablenum")

`!playercounts` to see how many players are on steam and in steam games.

![!playercounts](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!playercounts.png "!playercounts")

`!dotaleaderboards` to see the current Dota 2 MMR leaderboards.

![!dotaleaderboards](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!dotaleaderboards.png "!dotaleaderboards")

`!mmrconversion` to see the approximate Dota 2 MMR conversion table.

![!mmrconversion](https://raw.githubusercontent.com/Thedarkbobman/SteamStatsDiscordBot/master/images/!mmrconversion.png "!mmrconversion")

## Anti-Spam
The bot only accepts commands every 5 seconds for each user, so multiple people can send 1 command each within 5 seconds, but a single person can't send commands more than 1 per 5 seconds.

## Setup
Create a file named `auth.json` in the same directory as `bot.js`.
It should consist of
```json
{
   "token": "discord-bot-token",
   "steamKey": "steam-api-key",
   "adminID": "admin-discord-id"
}

```
You can get a steam api key [here](http://steamcommunity.com/dev/apikey). 

Create a discord bot [here](https://discordapp.com/developers/applications/me#tophttps://discordapp.com/developers/applications/me#top).

Find your discord id with [this guide](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-).

The bot refreshes dota data once a week, but it can be manually refreshed by `!refreshdotadata`. Only the admin of the bot defined in `auth.json` can use this command. This data is pulled from this [repository](https://github.com/odota/dotaconstants).
