var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var converter = require('steam-id-convertor');
var bigInt = require("big-integer");
var fs = require("fs");
var schedule = require('node-schedule');

var j = schedule.scheduleJob('0 20 * * 2', function() {
  refreshDotaData();
});
var userCommands = [];

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
bot.on('ready', function(evt) {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.username + ' - (' + bot.id + ')');
});
const https = require("https");
const heroStatsUrl =
  "https://api.opendota.com/api/herostats";

function doProfileStats(steam32ID, channelID, steam64ID, userID) {
  var wins = "";
  var loss = "";
  https.get("https://api.opendota.com/api/players/" + steam32ID, res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      body = JSON.parse(body);

      console.log(wins);
      https.get("https://api.opendota.com/api/players/" + steam32ID + "/wl", res => {

        res.setEncoding("utf8");
        let body2 = "";
        res.on("data", data2 => {
          body2 += data2;
        });
        res.on("end", () => {
          body2 = JSON.parse(body2);
          if (body.profile == undefined) {
            console.log("profile not found");
            bot.sendMessage({
              to: channelID,
              message: "No tracked profile on OpenDota."

            });
            return;
          }
          wins = body2.win;
          loss = body2.lose;
          console.log(body.profile.account_id);


          bot.sendMessage({
            to: channelID,
            message: "Your wish is my command " + "<@!" + userID + ">" + "!",
            embed: {
              title: "Steam",
              url: "http://steamcommunity.com/id/" + steam64ID,
              description: "[OpenDota](https://www.opendota.com/players/" + body.profile.account_id + ")",
              thumbnail: {
                url: body.profile.avatarfull + ""
              },
              fields: [{
                name: "Name",
                value: body.profile.personaname + ""
              }, {
                name: "Estimated MMR",
                value: body.mmr_estimate.estimate + ""
              }, {
                name: "Win/Loss",
                value: "Wins: " + wins + " Losses: " + loss
              }]
            }
          }, function(error, response) {
            console.log(error);
            console.log(response);
          });

        });
      });


    });
  });

}

function doCSGOStats(channelID, steam64ID, profilePic, name, customUrl, userID) {

  https.get("https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?key=" + auth.steamKey + "&steamid=" + steam64ID + "&appid=730", res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      body = JSON.parse(body);
      if (body.playerstats == undefined) {
        console.log("profile not found");
        bot.sendMessage({
          to: channelID,
          message: "No CSGO profile found."

        });
        return;
      }
      var kd = bigInt("" + body.playerstats.stats[0].value).divmod(""+body.playerstats.stats[1].value);
      console.log("kd: "+new String(kd.quotient));
      var tempString = new String(kd.remainder/body.playerstats.stats[1].value);
      var calculatedKD = new String(kd.quotient)+tempString.substring(tempString.indexOf("."));

      bot.sendMessage({
        to: channelID,
        message: "Your wish is my command " + "<@!" + userID + ">" + "!",
        embed: {
          title: "Steam",
          url: "http://steamcommunity.com/id/" + customUrl,
          thumbnail: {
            url: profilePic + ""
          },
          fields: [{
            name: "Name",
            value: name + ""
          }, {
            name: "Achievements",
            value: "Has " + body.playerstats.achievements.length + " achievements!"
          }, {
            name: "Total Time Played",
            value: numberWithCommas( String(bigInt("" + body.playerstats.stats[2].value).divide(3600))) + " hrs played."
          },
          {
            name: "K/D",
            value: "K/D is "+ numberWithCommas(String(body.playerstats.stats[0].value)) + "/"+numberWithCommas(String(body.playerstats.stats[1].value))+" = " + calculatedKD
          },
          {
            name: "Bombs",
            value: "Planted "+ numberWithCommas(String(body.playerstats.stats[3].value)) + " bombs and defused "+numberWithCommas(String(body.playerstats.stats[4].value))+" bombs."
          },
          {
            name: "Wins/Money/Damage",
            value: "Won "+ numberWithCommas(String(body.playerstats.stats[5].value)) + " times, earned $"+numberWithCommas(String(body.playerstats.stats[7].value))+", and done "+ numberWithCommas(String(body.playerstats.stats[6].value))+" damage."
          },
          {
            name: "Misc. Kill Stats",
            value: "Killed "+ numberWithCommas(String(body.playerstats.stats[25].value)) + " with headshots, "+numberWithCommas(String(body.playerstats.stats[26].value))+" with enemy weapons, "+numberWithCommas(String(body.playerstats.stats[9].value))+" with the knife, and "+ numberWithCommas(String(body.playerstats.stats[10].value))+" with HE nades."
          },
          {
            name: "Other Stats",
            value: "Played "+ numberWithCommas(String(body.playerstats.stats[48].value)) + " rounds, shot "+numberWithCommas(String(body.playerstats.stats[47].value))+" times, hit "+numberWithCommas(String(body.playerstats.stats[46].value))+" shots, killed "+ numberWithCommas(String(body.playerstats.stats[42].value))+" zoomed in snipers, donated " + numberWithCommas(String(body.playerstats.stats[38].value))+" weapons, and recieved "+ numberWithCommas(String(body.playerstats.stats[102].value))+" MVPs."
          }]
        }
      }, function(error, response) {
        console.log(error);
        console.log(response);
      });
    });

  });


}
function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}



function doBanStatus(channelID, steam64ID, profilePic, name, customUrl, userID) {

  https.get("https://api.steampowered.com/isteamuser/GetPlayerBans/v1/?key=" + auth.steamKey + "&steamids=" + steam64ID, res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      body = JSON.parse(body);
      if (body.players[0] == undefined) {
        console.log("profile not found");
        bot.sendMessage({
          to: channelID,
          message: "No Steam profile found."

        });
        return;
      }
      var fieldsArray = [];
      if (body.players[0].CommunityBanned) {
        fieldsArray.push({
          name: "Community",
          value: "Banned"
        });
      }
      if (body.players[0].VACBanned) {
        fieldsArray.push({
          name: "VAC",
          value: body.players[0].NumberOfVACBans + " bans. " + body.players[0].DaysSinceLastBan + " days since last VAC ban."
        });
      }
      if (body.players[0].NumberOfGameBans > 0) {
        fieldsArray.push({
          name: "Game Bans",
          value: body.players[0].NumberOfGameBans + " bans"
        });
      }
      console.log(body.players[0].EconomyBan);
      if ((new String(body.players[0].EconomyBan)).valueOf() !== "none".valueOf()) {
        fieldsArray.push({
          name: "Economy",
          value: "Banned"
        });
      }
      if (fieldsArray.length == 0) {
        fieldsArray.push({
          name: "Bans",
          value: "None"
        });
      }
      fieldsArray.unshift({
        name: "Name",
        value: name + ""
      });
      bot.sendMessage({
        to: channelID,
        message: "Your wish is my command " + "<@!" + userID + ">" + "!",
        embed: {
          title: "Steam",
          url: "http://steamcommunity.com/id/" + customUrl,
          thumbnail: {
            url: profilePic + ""
          },
          fields: fieldsArray
        }
      }, function(error, response) {
        console.log(error);
        console.log(response);
      });
    });

  });


}

function refreshDotaData() {

  https.get("https://raw.githubusercontent.com/odota/dotaconstants/master/build/heroes.json", res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {

      console.log("Hero Data Retrieved");
      fileData("heroes.json", body);
      console.log("Hero Data Written");
    });
  });
  https.get("https://raw.githubusercontent.com/odota/dotaconstants/master/build/items.json", res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {

      console.log("Item Data Retrieved");
      fileData("items.json", body);
      console.log("Item Data Written");
    });
  });
  https.get("https://raw.githubusercontent.com/odota/dotaconstants/master/build/abilities.json", res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      console.log("Ability Data Retrieved");
      fileData("abilities.json", body);
      console.log("Ability Data Written");
    });
  });
}


function fileData(savPath, newData) {

	fs.exists(savPath, function (exists) {
        if(exists)
        {
					fs.readFile(savPath, 'utf8', function(err, data) {
						if (err) throw err;
						//Do your processing, MD5, send a satellite to the moon, etc.
						console.log("Data:" + data);
						fs.writeFile(savPath, newData, function(err) {
							if (err) throw err;
							console.log('complete');
						});
					});
        }else
        {
            fs.writeFile(savPath, {flag: 'wx'}, function (err, data)
            {
							fs.readFile(savPath, 'utf8', function(err, data) {
								if (err) throw err;
								//Do your processing, MD5, send a satellite to the moon, etc.
								console.log("Data:" + data);
								fs.writeFile(savPath, newData, function(err) {
									if (err) throw err;
									console.log('complete');
								});
							});
            })
        }
    });

}



bot.on('message', function(user, userID, channelID, message, evt) {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`

  if (message.substring(0, 1) == '!') {
    var userObj = userCommands.find(x => x.ID === userID);
    if (typeof userObj !== 'undefined') {
      if (Date.now() - userObj.time < 5000) {
        bot.sendMessage({
          to: userID,
          message: "Hey " + "<@!" + userID + ">" + ", you are sending commands too fast. I hope you aren't spamming, because that's mean."
        });
        console.log("spam blocked");
        return;
      } else {
        userObj.time = Date.now();
      }
    } else {

      userCommands.push({
        ID: userID,
        time: Date.now()
      });
    }
    var args = message.substring(1).split(' ');
    var cmd = args[0].toLowerCase();

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
          message: "Hey " + "<@!" + userID + ">" + ", here's what I can do. You can say:\n \n `!ping` to see if the bot is online.\n \n `!herostats <hero-id>` to see hero stats.\n \n `!dotaprofile <steam id (custom or not)>` to get basic dota info.\n \n `!csgostats <steam id (custom or not)>` to get csgo info.\n \n `!banstatus <steam id (custom or not)>` to get ban info.\n \n **PRO TIP**: i will only accept 1 message per 5 seconds from each user because Dhruv will spam me otherwise."
        });
        break;
      case 'dotaprofile':

        var playerID = message.substring(message.indexOf(' ') + 1);
        console.log(playerID);
        var steam64ID = 0;

        https.get("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + auth.steamKey + "&vanityurl=" + playerID, res => {
          res.setEncoding("utf8");
          let bodySteam = "";
          res.on("data", steamData => {
            bodySteam += steamData;
          });
          res.on("end", () => {
            bodySteam = JSON.parse(bodySteam);
            console.log("sucess = " + bodySteam.response.success);
            if (bodySteam.response.success === 1) {
              console.log("steamid = " + bodySteam.response.steamid);
              steam64ID = (bodySteam.response.steamid);
              var steam32ID = converter.to32(bodySteam.response.steamid);
              console.log("steam32ID=" + steam32ID);
              doProfileStats(steam32ID, channelID, playerID, userID);

            } else {

              https.get("https://api.steampowered.com/isteamuser/getplayersummaries/v0002/?key=" + auth.steamKey + "&steamids=" + playerID, res => {
                res.setEncoding("utf8");
                let bodySteam2 = "";
                res.on("data", steamData2 => {
                  bodySteam2 += steamData2;
                });
                res.on("end", () => {
                  //console.log(bodySteam2);
                  bodySteam2 = JSON.parse(bodySteam2);

                  if (bodySteam2.response.players.length == 0) {
                    bot.sendMessage({
                      to: channelID,
                      message: "No players found."

                    });
                    return;
                  } else {
                    steam64ID = playerID;
                    var steam32ID = converter.to32(playerID);
                    console.log("steam32ID=" + steam32ID);

                    doProfileStats(steam32ID, channelID, steam64ID, userID);
                  }
                });
              });
            }



          });
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

            if ((heroID > 114 || heroID <= 0) && !(heroID == 119 || heroID == 120)) {

              bot.sendMessage({
                to: channelID,
                message: "Hey " + "<@!" + userID + ">" + ", that's not a valid hero."

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
            messageSend = "Hey " + "<@!" + userID + ">" + ", " +
              body[index].localized_name

              +
              " is a " +
              body[index].attack_type

              .toLowerCase() + " " + attribute + " hero with " +
              body[index].legs

              +
              " legs.";
            bot.sendMessage({
              to: channelID,
              message: messageSend

            });
          });
        });
        break;
      case 'csgostats':

        var playerID = message.substring(message.indexOf(' ') + 1);
        console.log(playerID);
        var steam64ID = 0;

        https.get("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + auth.steamKey + "&vanityurl=" + playerID, res => {
          res.setEncoding("utf8");
          let bodySteam = "";
          res.on("data", steamData => {
            bodySteam += steamData;
          });
          res.on("end", () => {
            bodySteam = JSON.parse(bodySteam);
            console.log("sucess = " + bodySteam.response.success);
            var searchID = playerID;
            if (bodySteam.response.success === 1) {
              console.log("steamid = " + bodySteam.response.steamid);
              steam64ID = (bodySteam.response.steamid);
              searchID = steam64ID;
            }

            https.get("https://api.steampowered.com/isteamuser/getplayersummaries/v0002/?key=" + auth.steamKey + "&steamids=" + searchID, res => {
              res.setEncoding("utf8");
              let bodySteam2 = "";
              res.on("data", steamData2 => {
                bodySteam2 += steamData2;
              });
              res.on("end", () => {
                //console.log(bodySteam2);
                bodySteam2 = JSON.parse(bodySteam2);

                if (bodySteam2.response.players.length == 0) {
                  bot.sendMessage({
                    to: channelID,
                    message: "No players found."

                  });
                  return;
                } else {
                  steam64ID = playerID;
                  console.log(steam64ID);
                  doCSGOStats(channelID, searchID, bodySteam2.response.players[0].avatarfull, bodySteam2.response.players[0].personaname, playerID, userID);
                }
              });
            });


          });
        });

        break;


      case 'banstatus':

        var playerID = message.substring(message.indexOf(' ') + 1);
        console.log(playerID);
        var steam64ID = 0;

        https.get("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + auth.steamKey + "&vanityurl=" + playerID, res => {
          res.setEncoding("utf8");
          let bodySteam = "";
          res.on("data", steamData => {
            bodySteam += steamData;
          });
          res.on("end", () => {
            bodySteam = JSON.parse(bodySteam);
            console.log("sucess = " + bodySteam.response.success);
            var searchID = playerID;
            if (bodySteam.response.success === 1) {
              console.log("steamid = " + bodySteam.response.steamid);
              steam64ID = (bodySteam.response.steamid);
              searchID = steam64ID;
            }

            https.get("https://api.steampowered.com/isteamuser/getplayersummaries/v0002/?key=" + auth.steamKey + "&steamids=" + searchID, res => {
              res.setEncoding("utf8");
              let bodySteam2 = "";
              res.on("data", steamData2 => {
                bodySteam2 += steamData2;
              });
              res.on("end", () => {
                //console.log(bodySteam2);
                bodySteam2 = JSON.parse(bodySteam2);

                if (bodySteam2.response.players.length == 0) {
                  bot.sendMessage({
                    to: channelID,
                    message: "No players found."

                  });
                  return;
                } else {
                  steam64ID = playerID;
                  console.log(steam64ID);
                  doBanStatus(channelID, searchID, bodySteam2.response.players[0].avatarfull, bodySteam2.response.players[0].personaname, playerID, userID);
                }
              });
            });


          });
        });

        break;

      case 'refreshdotadata':
			console.log(userID);
        if (userID == auth.adminID) {
          console.log("Refresh Started")
          refreshDotaData();
        }


        break;
    }
  }
});
