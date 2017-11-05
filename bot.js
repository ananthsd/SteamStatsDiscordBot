var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
	colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
		token: auth.token,
		autorun: true
	});
bot.on('ready', function (evt) {
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(bot.username + ' - (' + bot.id + ')');
});
const https = require("https");
const heroStatsUrl =
	"https://api.opendota.com/api/herostats";
bot.on('message', function (user, userID, channelID, message, evt) {
	// Our bot needs to know if it will execute a command
	// It will listen for messages that will start with `!`
	if (message.substring(0, 1) == '!') {
		var args = message.substring(1).split(' ');
		var cmd = args[0];

		args = args.splice(1);
		switch (cmd) {
			// !ping
		case 'ping':
			bot.sendMessage({
				to: channelID,
				message: 'Pong!'
			});
			break;
			case 'help':
			bot.sendMessage({
				to: channelID,
				message: "Hey " + user.toString() + ", here's what I can do.You can say:\n `!ping` to see if the bot is online.\n `!herostats <hero-id>` to see hero stats."
			});
			break;
		case 'herostats':
			var heroID = message.substring(message.indexOf(' ') + 1);
			console.log(heroID);

			https.get(heroStatsUrl, res => {
				res.setEncoding("utf8");
				let body = "";
				res.on("data", data => {
					body += data;
				});
				res.on("end", () => {
					body = JSON.parse(body);
				
				
					var index = heroID - 1;
					var messageSend = "";
					
					if ((heroID > 114 || heroID <= 0)&& !(heroID == 119 || heroID == 120)) {
						
						bot.sendMessage({
						to: channelID,
						message: "Hey " + user.toString() + ", that's not a valid hero."

					});
						return;
					}
			
					if (heroID == 119) {
						index = 113;
			
					}
					if (heroID == 120) {
						index = 114;
					
					}
								var attribute = body[index].primary_attr;
					if (attribute.valueOf() == "str") {
						attribute = "strength";
					} else if (attribute.valueOf() == "int") {
						attribute = "intelligence";
					} else {
						attribute = "agility";
					}
						messageSend = "Hey " + user.toString() + ", " +
							body[index].localized_name

							 + " is a " +
							body[index].attack_type

							.toLowerCase() + " " + attribute + " hero with " +
							body[index].legs

							 + " legs.";
					bot.sendMessage({
						to: channelID,
						message: messageSend

					});
				});
			});
			break;
			// Just add any case commands if you want to..
		}
	}
});
