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

`!refreshdotadata` only works if your id matches the one in auth.json. It takes dota data from OpenDota's github so the bot doesn't have to download it each time it wants to look up hero/item/ability info.

`!randtablenum <Line> <Min> <Max> <Number Of Numbers> <Repeats(true or false)>` to get a random number from the AP Stats Table.

`!playercounts` to see how many players are on steam and in steam games.

`!dotaleaderboards` to see the current Dota 2 MMR leaderboards.
## Anti-Spam
The bot only accepts commands every 5 seconds for each user, so multiple people can send 1 command each within 5 seconds, but a single person can't send commands more than 1 per 5 seconds.
