# SteamStatsDiscordBot
This is a bot I am working on that pulls information from Steam, OpenDota, and maybe others in the future to give information.
## Commands
`!ping` to see if the bot is online.

`!help` to see available commands.

`!gethero <hero-name>` to see hero info.

`!getitem <item-name>` to see item info.

`!dotaprofile <steam id (custom or not)>` to get basic dota info.

`!csgostats <steam id (custom or not)>` to get csgo info.

`!banstatus <steam id (custom or not)>` to get ban info.

`!randtablenum <Line> <Min> <Max> <Number Of Numbers> <Repeats(true or false)>` to get a random number from the AP Stats Table.

`!playercounts` to see how many players are on steam and in steam games.

`!dotaleaderboards` to see the current Dota 2 MMR leaderboards.

`!mmrconversion` to see the approximate Dota 2 MMR conversion table.
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
