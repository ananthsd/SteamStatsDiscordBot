"use strict";
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var converter = require('steam-id-convertor');
var bigInt = require("big-integer");
var fs = require("fs");
var schedule = require('node-schedule');
const leven = require('leven');
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
bot.on('disconnect', function(erMsg, code) {
  console.log('----- Bot disconnected from Discord with code', code, 'for reason:', erMsg, '-----');
  bot.connect();
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

          https.get("https://api.opendota.com/api/players/" + steam32ID + "/recentMatches", res => {
            res.setEncoding("utf8");
            let tempData = "";
            res.on("data", data3 => {
              tempData += data3;
            });
            res.on("end", () => {
              tempData = JSON.parse(tempData);
              // console.log(tempData);
              var match = tempData[0];
              //console.log("match"+match);
              var rankString = "";
              console.log("rank:" + body.rank_tier + "");
              if (body.rank_tier !== null) {
                rankString += "Actual: ";
                if ((body.rank_tier + "").substring(0, 1) === '1') {
                  rankString += "Herald [";
                }
                if ((body.rank_tier + "").substring(0, 1) === '2') {
                  rankString += "Guardian ["
                }
                if ((body.rank_tier + "").substring(0, 1) === '3') {
                  rankString += "Crusader ["
                }
                if ((body.rank_tier + "").substring(0, 1) === '4') {
                  rankString += "Archon ["
                }
                if ((body.rank_tier + "").substring(0, 1) === '5') {
                  rankString += "Legend ["
                }
                if ((body.rank_tier + "").substring(0, 1) === '6') {
                  rankString += "Ancient ["
                }
                if ((body.rank_tier + "").substring(0, 1) === '7') {
                  rankString += "Divine ["
                }
                rankString += (body.rank_tier + "").substring(1) + "]; "
              }
              var fieldsArray = [{
                name: "Name",
                value: body.profile.personaname + ""
              }, {
                name: "MMR",
                value: rankString + "Estimated: " + body.mmr_estimate.estimate + ""
              }, {
                name: "Win/Loss",
                value: "Wins: " + wins + " Losses: " + loss
              }];
              if (match !== undefined) {
                var matchInfo = "";
                if (match.radiant_win === 'true') {
                  matchInfo += "**RADIENT VICTORY:**\n";
                } else {
                  matchInfo += "**DIRE VICTORY:**\n";
                }
                matchInfo += "[" + match.match_id + "](https://www.opendota.com/matches/" + match.match_id + ")\nk-d-a: " + match.kills + "-" + match.deaths + "-" + match.assists + "\n" + match.xp_per_min + " xpm and " + match.gold_per_min + " gpm";

                fieldsArray.push({
                  name: "Last Match",
                  value: matchInfo
                });
              }
              if (body.playerstats === undefined) {
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
                    fields: fieldsArray
                  }
                }, function(error, response) {
                  console.log(error);
                  console.log(response);
                });

              }

            });

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
      var kd = bigInt("" + body.playerstats.stats[0].value).divmod("" + body.playerstats.stats[1].value);
      console.log("kd: " + new String(kd.quotient));
      var tempString = new String(kd.remainder / body.playerstats.stats[1].value);
      var calculatedKD = new String(kd.quotient) + tempString.substring(tempString.indexOf("."));

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
              value: numberWithCommas(String(bigInt("" + body.playerstats.stats[2].value).divide(3600))) + " hrs played."
            },
            {
              name: "K/D",
              value: "K/D is " + numberWithCommas(String(body.playerstats.stats[0].value)) + "/" + numberWithCommas(String(body.playerstats.stats[1].value)) + " = " + calculatedKD
            },
            {
              name: "Bombs",
              value: "Planted " + numberWithCommas(String(body.playerstats.stats[3].value)) + " bombs and defused " + numberWithCommas(String(body.playerstats.stats[4].value)) + " bombs."
            },
            {
              name: "Wins/Money/Damage",
              value: "Won " + numberWithCommas(String(body.playerstats.stats[5].value)) + " times, earned $" + numberWithCommas(String(body.playerstats.stats[7].value)) + ", and did " + numberWithCommas(String(body.playerstats.stats[6].value)) + " damage."
            },
            {
              name: "Misc. Kill Stats",
              value: "Killed " + numberWithCommas(String(body.playerstats.stats[25].value)) + " with headshots, " + numberWithCommas(String(body.playerstats.stats[26].value)) + " with enemy weapons, " + numberWithCommas(String(body.playerstats.stats[9].value)) + " with the knife, and " + numberWithCommas(String(body.playerstats.stats[10].value)) + " with HE nades."
            },
            {
              name: "Other Stats",
              value: "Played " + numberWithCommas(String(body.playerstats.stats[48].value)) + " rounds, shot " + numberWithCommas(String(body.playerstats.stats[47].value)) + " times, hit " + numberWithCommas(String(body.playerstats.stats[46].value)) + " shots, killed " + numberWithCommas(String(body.playerstats.stats[42].value)) + " zoomed in snipers, donated " + numberWithCommas(String(body.playerstats.stats[38].value)) + " weapons, and recieved " + numberWithCommas(String(body.playerstats.stats[102].value)) + " MVPs."
            }
          ]
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
      //  body = "[" + body.substring(body.indexOf("{") + 1, body.lastIndexOf("}")) + "]";
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
      //  body = "[" + body.substring(body.indexOf("{") + 1, body.lastIndexOf("}")) + "]";
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
      //  body = "[" + body.substring(body.indexOf("{") + 1, body.lastIndexOf("}")) + "]";
      fileData("abilities.json", body);
      console.log("Ability Data Written");
    });
  });
}


function fileData(savPath, newData) {

  fs.exists(savPath, function(exists) {
    if (exists) {
      fs.readFile(savPath, 'utf8', function(err, data) {
        if (err) throw err;
        //Do your processing, MD5, send a satellite to the moon, etc.
        console.log("Data:" + data);
        fs.writeFile(savPath, newData, function(err) {
          if (err) throw err;
          console.log('complete');
        });
      });
    } else {
      fs.writeFile(savPath, {
        flag: 'wx'
      }, function(err, data) {
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

function readDotaHeroFile(path, query, channelID, userID) {
  var query = query.toLowerCase().replace(/\s+/g, '').replace(/-/g, "");
  fs.readFile(path, 'utf8', function(err, data) {
    if (err) throw err;

    data = JSON.parse(data);
    var tempHeroArray = [];

    for (var key in data) {
      if (data.hasOwnProperty(key)) {


        var tempString = data[key].localized_name.toLowerCase().replace(/\s+/g, '').replace(/-/g, "");
        if (tempString.indexOf(query) != -1) {
          tempHeroArray.push(data[key]);
          console.log("hero found:" + data[key].localized_name);
        }

      }
    }
    console.log("length:" + tempHeroArray.length);
    if (tempHeroArray.length == 0) {
      bot.sendMessage({
        to: channelID,
        message: "Sorry " + "<@!" + userID + ">" + ", I could not find a hero with that name.",
      });
      return;
    }
    var bestHero = tempHeroArray[0];

    var bestDist = leven(query, tempHeroArray[0].localized_name.toLowerCase());
    for (var i = 0; i < tempHeroArray.length; i++) {
      if (leven(query, tempHeroArray[i].localized_name.toLowerCase()) < bestDist) {
        bestHero = tempHeroArray[i];
      }
    }
    var attribute = bestHero.primary_attr;
    var colorSet = 0;
    if (attribute.valueOf() == "str") {
      attribute = "strength";
      colorSet = 10038562;
    } else if (attribute.valueOf() == "int") {
      attribute = "intelligence";
      colorSet = 34266;
    } else {
      attribute = "agility";
      colorSet = 306699;
    }
    var roles = bestHero.roles;
    var rolesString = "";
    for (var role in roles) {
      rolesString += roles[role] + "  ";
    }
    var projectileSpeed = "Projectile Speed: " + bestHero.projectile_speed + "\n";
    if (projectileSpeed == "0") {
      projectileSpeed = "";
    }


    bot.sendMessage({
      to: channelID,
      message: "Your wish is my command " + "<@!" + userID + ">" + "!",
      embed: {
        title: bestHero.localized_name,
        url: "https://dota2.gamepedia.com/" + bestHero.localized_name.split(' ').join('_'),
        color: colorSet,
        thumbnail: {
          url: "http://cdn.dota2.com/apps/dota2/images/heroes/" + bestHero.name.substring(bestHero.name.indexOf("hero_") + 5) + "_lg.png"
        },
        fields: [{
          name: "Basic Info",
          value: bestHero.localized_name + " is a " + bestHero.attack_type.toLowerCase() + " " + attribute + " hero."
        }, {
          name: "Roles",
          value: rolesString
        }, {
          name: "Basic Stats",
          value: "Base Health: " + bestHero.base_health + "; Base HP Regen: " + bestHero.base_health_regen + "\nBase Mana: " + bestHero.base_mana + "; Base Mana Regen: " + bestHero.base_mana_regen + "\nBase Armor: " + bestHero.base_armor + "\nBase Magic Resistance: " + bestHero.base_mr
        }, {
          name: "Attribute Stats",
          value: "Base Strength: " + bestHero.base_str + "; Strength Gain: " + bestHero.str_gain + "\nBase Agility: " + bestHero.base_agi + "; Agility Gain: " + bestHero.agi_gain + "\nBase Intelligence: " + bestHero.base_int + "; Intelligence Gain: " + bestHero.int_gain
        }, {
          name: "Attack Stats",
          value: "Base Attack Range: " + bestHero.attack_range + "\n" + projectileSpeed + "Base Attack Rate: " + bestHero.attack_rate + " seconds"
        }, {
          name: "Movement Stats",
          value: "Base Movement Speed: " + bestHero.move_speed + "\nTurn Rate: " + bestHero.turn_rate + " seconds\n" + "Legs: " + bestHero.legs + " legs"
        }]
      }
    }, function(error, response) {
      console.log(error);
      console.log(response);
    });


  });

}

function readDotaItemFile(path, query, channelID, userID) {
  var query = query.toLowerCase().replace(/\s+/g, '').replace(/-/g, "");
  fs.readFile(path, 'utf8', function(err, data) {
    if (err) throw err;

    data = JSON.parse(data);
    var tempItemArray = [];
    var tempKeyArray = [];

    for (var key in data) {
      if (data.hasOwnProperty(key)) {

        console.log(JSON.stringify(data[key]));
        if (data[key].dname !== undefined) {
          var tempString = data[key].dname.toLowerCase().replace(/\s+/g, '').replace(/-/g, "");
          if (tempString.indexOf(query) != -1) {
            if (tempString.indexOf("recipe") == -1) {

              tempItemArray.push(data[key]);
              tempKeyArray.push(key);
              console.log("item found:" + data[key].dname);
            }
          }
        }

      }
    }
    console.log("length:" + tempItemArray.length);
    if (tempItemArray.length == 0) {
      bot.sendMessage({
        to: channelID,
        message: "Sorry " + "<@!" + userID + ">" + ", I could not find an item with that name.",
      });
      return;
    }
    var bestItem = tempItemArray[0];
    var bestItemKey = tempKeyArray[0];
    var bestDist = leven(query, tempItemArray[0].dname.toLowerCase());
    for (var i = 0; i < tempItemArray.length; i++) {
      if (leven(query, tempItemArray[i].dname.toLowerCase()) < bestDist) {
        bestItem = tempItemArray[i];
        bestItemKey = tempKeyArray[i];
      }
    }
    var messageFields = [];
    messageFields.push({
      name: "Cost",
      value: bestItem.cost + " Gold"
    });
    if (bestItem.desc !== "") {
      messageFields.push({
        name: "Description",
        value: bestItem.desc
      });
    }
    if (bestItem.lore !== "") {
      messageFields.push({
        name: "Lore",
        value: bestItem.lore
      });
    }
    if (bestItem.notes !== "") {
      messageFields.push({
        name: "Notes",
        value: bestItem.notes
      });
    }
    if (bestItem.cd !== false) {
      messageFields.push({
        name: "Cooldown",
        value: bestItem.cd + " Seconds"
      });
    }
    if (bestItem.components !== null) {

      var components = "";
      var componentsArray = bestItem.components;
      for (var tempComponent in componentsArray) {
        console.log("comp:" + componentsArray[tempComponent]);
        if (data[componentsArray[tempComponent]] !== undefined) {
          console.log("component: " + data[componentsArray[tempComponent]].dname);
          components += data[componentsArray[tempComponent]].dname + " (" + data[componentsArray[tempComponent]].cost + ")\n";
        }
      }
      console.log("key:" + bestItemKey);
      if (data["recipe_" + bestItemKey] !== undefined) {
        components += "Recipe" + " (" + data["recipe_" + bestItemKey].cost + ")\n";
      }
      console.log("components:" + components);
      messageFields.push({
        name: "Components",
        value: components + ""
      });
    }
    var attribString = "";
    var attribArray = bestItem.attrib;
    for (var attribute in attribArray) {
      if (attribArray[attribute].footer != undefined) {
        attribString += attribArray[attribute].header + "" + attribArray[attribute].value + " " + attribArray[attribute].footer;
      } else {
        attribString += attribArray[attribute].header + " " + attribArray[attribute].value;
      }
      attribString += "\n";
    }
    messageFields.push({
      name: "Item Attributes",
      value: attribString
    });
    //console.log();
    bot.sendMessage({
      to: channelID,
      message: "Your wish is my command " + "<@!" + userID + ">" + "!",
      embed: {
        title: bestItem.dname,
        url: "https://dota2.gamepedia.com/" + bestItem.dname.split(' ').join('_'),
        thumbnail: {
          url: "http://cdn.dota2.com/apps/dota2/images/" + bestItem.img.substring(bestItem.img.indexOf("items/"), bestItem.img.indexOf("?3"))
        },
        fields: messageFields
      }
    }, function(error, response) {
      console.log(error);
      console.log(response);
    });


  });

}

function isInt(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
}

function randomStatNumbers(path, line, min, max, numberOfNumbers, channelID, userID, repeats) {

  fs.readFile(path, 'utf8', function(err, data) {
    if (err) throw err;
    console.log("min:" + min + "; max:" + max + "; min>max:" + min > max + "");
    if (!isInt(line) || !isInt(min) || !isInt(max) || !isInt(numberOfNumbers)) {
      bot.sendMessage({
        to: channelID,
        message: "Hey " + "<@!" + userID + ">" + ", no decimals pls.",
      });
      return;
    }
    max = Math.ceil(parseInt(max));
    min = Math.ceil(parseInt(min));
    if (parseInt(min) > parseInt(max) || line < 101 || line > 150) {
      bot.sendMessage({
        to: channelID,
        message: "Hey " + "<@!" + userID + ">" + ", your parameters are off.",
      });
      return;
    }
    if (repeats == 'false') {
      if ((max - min) < numberOfNumbers) {
        bot.sendMessage({
          to: channelID,
          message: "Hey " + "<@!" + userID + ">" + ", your parameters make it impossible not to have repeats.",
        });
        return;

      }
    }
    console.log("rep:" + repeats);

    if (repeats === undefined || !(repeats.toLowerCase() == 'true' || repeats.toLowerCase() == 'false')) {
      bot.sendMessage({
        to: channelID,
        message: "Hey " + "<@!" + userID + ">" + ", I don't know if you want repeats or not.",
      });
      return;
    }
    if (!isFinite(line) || !isFinite(min) || !isFinite(max) || !isFinite(numberOfNumbers)) {
      bot.sendMessage({
        to: channelID,
        message: "Hey " + "<@!" + userID + ">" + ",  your parameters are weird.",
      });
      return;
    }
    if (parseInt(numberOfNumbers) <= 0) {
      bot.sendMessage({
        to: channelID,
        message: "Hey " + "<@!" + userID + ">" + ",  you wont get any nuumbers this way.",
      });
      return;
    }
    var digits = Math.max(Math.floor(Math.log10(Math.abs(max))), 0) + 1;
    if (((line - 101) * 40 + digits * numberOfNumbers) >= 2000) {
      bot.sendMessage({
        to: channelID,
        message: "Hey " + "<@!" + userID + ">" + ", there aren't enough numbers in the table to satisfy your request.",
      });
      return;

    }
    var numbers = [];
    var numberString = "";
    var preString = "Hey " + "<@!" + userID + ">" + ", your numbers are the following: ";
    var newData = data.substring((line - 101) * 40);
    var x = 0;
    var index = 0;
    console.log("min:" + min + "; max:" + max + "; min>max:" + min > max);
    console.log("digits: " + digits + "; " + "numOfNum: " + numberOfNumbers + "; " + "line: " + line + "; " + "min: " + min + "; " + "max: " + max + "; ");
    while (x < numberOfNumbers) {


      var tempNum = newData.substring(index, index + digits);
      if (tempNum === "") {
        preString = "So uh... There aren't enough numbers left for you to get `" + numberOfNumbers + "` so I'll give you what I have " + "<@!" + userID + ">" + " :(\n";
        break;
      }
      console.log("val:" + x + "vale2:" + tempNum);
      if (parseInt(tempNum) >= parseInt(min) && parseInt(tempNum) <= parseInt(max)) {
        if (repeats == 'false') {
          if (numbers.indexOf(tempNum) == -1) {
            numbers.push(tempNum);
            numberString += " `" + tempNum + "`";
            x++;
          }
        } else {
          numbers.push(tempNum);
          numberString += " `" + tempNum + "`";
          x++;
        }
      }
      index += digits;
    }



    bot.sendMessage({
      to: channelID,
      message: preString + numberString,
    });
    return;




  });

}

function steamStatus(channelID, userID) {

  https.get("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?key=KEY&format=json&appid=", res => {
    res.setEncoding("utf8");
    let bodyAll = "";
    res.on("data", dataAll => {
      bodyAll += dataAll;
    });
    res.on("end", () => {
      bodyAll = JSON.parse(bodyAll);

      https.get("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?key=KEY&format=json&appid=570", res => {
        res.setEncoding("utf8");
        let bodyDota = "";
        res.on("data", dataDota => {
          bodyDota += dataDota;
        });
        res.on("end", () => {
          bodyDota = JSON.parse(bodyDota);

          https.get("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?key=KEY&format=json&appid=730", res => {
            res.setEncoding("utf8");
            let bodyCSGO = "";
            res.on("data", dataCSGO => {
              bodyCSGO += dataCSGO;
            });
            res.on("end", () => {
              bodyCSGO = JSON.parse(bodyCSGO);

              https.get("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?key=KEY&format=json&appid=440", res => {
                res.setEncoding("utf8");
                let bodyTF = "";
                res.on("data", dataTF => {
                  bodyTF += dataTF;
                });
                res.on("end", () => {
                  bodyTF = JSON.parse(bodyTF);

                  https.get("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?key=KEY&format=json&appid=271590", res => {
                    res.setEncoding("utf8");
                    let bodyGTA = "";
                    res.on("data", dataGTA => {
                      bodyGTA += dataGTA;
                    });
                    res.on("end", () => {
                      bodyGTA = JSON.parse(bodyGTA);

                      https.get("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?key=KEY&format=json&appid=578080", res => {
                        res.setEncoding("utf8");
                        let bodyPUBG = "";
                        res.on("data", dataPUBG => {
                          bodyPUBG += dataPUBG;
                        });
                        res.on("end", () => {
                          bodyPUBG = JSON.parse(bodyPUBG);

                          bot.sendMessage({
                            to: channelID,
                            message: "Here are some popular steam games " + "<@!" + userID + ">" + "!",
                            embed: {
                              title: "Player Counts",
                              url: "http://store.steampowered.com/stats/",
                              fields: [{
                                name: "Steam",
                                value: numberWithCommas(bodyAll.response.player_count) + " currently online."
                              }, {
                                name: "Dota 2",
                                value: numberWithCommas(bodyDota.response.player_count) + " currently in game."
                              }, {
                                name: "CSGO",
                                value: numberWithCommas(bodyCSGO.response.player_count) + " currently in game."
                              }, {
                                name: "TF2",
                                value: numberWithCommas(bodyTF.response.player_count) + " currently in game."
                              }, {
                                name: "GTA V",
                                value: numberWithCommas(bodyGTA.response.player_count) + " currently in game."
                              }, {
                                name: "PUBG",
                                value: numberWithCommas(bodyPUBG.response.player_count) + " currently in game."
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
                });
              });
            });
          });
        });
      });
    });
  });
}


function leaderboardMessage(channelID, userID) {

  https.get("https://www.dota2.com/webapi/ILeaderboard/GetDivisionLeaderboard/v0001?division=americas", res => {
    res.setEncoding("utf8");
    let bodyUS = "";
    res.on("data", dataUS => {
      bodyUS += dataUS;
    });
    res.on("end", () => {
      bodyUS = JSON.parse(bodyUS);

      https.get("https://www.dota2.com/webapi/ILeaderboard/GetDivisionLeaderboard/v0001?division=europe", res => {
        res.setEncoding("utf8");
        let bodyEU = "";
        res.on("data", dataEU => {
          bodyEU += dataEU;
        });
        res.on("end", () => {
          bodyEU = JSON.parse(bodyEU);

          https.get("https://www.dota2.com/webapi/ILeaderboard/GetDivisionLeaderboard/v0001?division=se_asia", res => {
            res.setEncoding("utf8");
            let bodySEA = "";
            res.on("data", dataSEA => {
              bodySEA += dataSEA;
            });
            res.on("end", () => {
              bodySEA = JSON.parse(bodySEA);

              https.get("https://www.dota2.com/webapi/ILeaderboard/GetDivisionLeaderboard/v0001?division=china", res => {
                res.setEncoding("utf8");
                let bodyAsia = "";
                res.on("data", dataAsia => {
                  bodyAsia += dataAsia;
                });
                res.on("end", () => {
                  bodyAsia = JSON.parse(bodyAsia);
                  var americasLeaderboardString = "";

                  for (var i = 0; i < 10; i++) {
                    americasLeaderboardString += (i + 1) + ". ";
                    if (bodyUS.leaderboard[i].team_tag !== "" && (bodyUS.leaderboard[i].hasOwnProperty('team_tag') == true)) {
                      americasLeaderboardString += bodyUS.leaderboard[i].team_tag + "."
                    }
                    americasLeaderboardString += bodyUS.leaderboard[i].name + "\n";
                  }
                  americasLeaderboardString = escapeBackTicks(americasLeaderboardString);
                  var europeLeaderboardString = "";

                  for (var i = 0; i < 10; i++) {
                    europeLeaderboardString += (i + 1) + ". ";
                    if (bodyEU.leaderboard[i].team_tag !== "" && (bodyEU.leaderboard[i].hasOwnProperty('team_tag') == true)) {
                      europeLeaderboardString += bodyEU.leaderboard[i].team_tag + "."
                    }
                    europeLeaderboardString += bodyEU.leaderboard[i].name + "\n";
                  }
                  europeLeaderboardString = escapeBackTicks(europeLeaderboardString);
                  var seaLeaderboardString = "";

                  for (var i = 0; i < 10; i++) {
                    seaLeaderboardString += (i + 1) + ". ";
                    if (bodySEA.leaderboard[i].team_tag !== "" && (bodySEA.leaderboard[i].hasOwnProperty('team_tag') == true)) {
                      seaLeaderboardString += bodySEA.leaderboard[i].team_tag + "."
                    }
                    seaLeaderboardString += bodySEA.leaderboard[i].name + "\n";
                  }
                  seaLeaderboardString = escapeBackTicks(seaLeaderboardString);
                  var asiaLeaderboardString = "";

                  for (var i = 0; i < 10; i++) {
                    asiaLeaderboardString += (i + 1) + ". ";
                    if (bodyAsia.leaderboard[i].team_tag !== "" && (bodyAsia.leaderboard[i].hasOwnProperty('team_tag') == true)) {
                      asiaLeaderboardString += bodyAsia.leaderboard[i].team_tag + "."
                    }
                    asiaLeaderboardString += bodyAsia.leaderboard[i].name + "\n";
                  }
                  asiaLeaderboardString = escapeBackTicks(asiaLeaderboardString);
                  bot.sendMessage({
                    to: channelID,
                    message: "Here are the top 10 players in each region " + "<@!" + userID + ">" + "!",
                    embed: {
                      title: "Leaderboards",
                      url: "http://www.dota2.com/leaderboards/",
                      fields: [{
                        name: "Americas",
                        value: americasLeaderboardString
                      }, {
                        name: "Europe",
                        value: europeLeaderboardString
                      }, {
                        name: "South East Asia",
                        value: seaLeaderboardString
                      }, {
                        name: "China",
                        value: asiaLeaderboardString
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
        });
      });
    });
  });
}

function escapeBackTicks(string) {
  var index = string.indexOf('`', index);

  while (string.indexOf('`', index) != -1) {
    //console.log(string.substring(0,index)+" \\  " + string.substring(index));
    string = string.substring(0, index) + ("\\") + string.substring(index);
    if (string.indexOf('`', index+2) == -1) {
      return string;
    }
    index = string.indexOf('`', index+2);
  }
  return string;
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
          message: "Hey " + "<@!" + userID + ">" + ", here's what I can do. You can say:\n \n `!ping` to see if the bot is online.\n \n `!gethero <hero-name>` to see hero info.\n \n `!getitem <item-name>` to see item info.\n \n `!dotaprofile <steam id (custom or not)>` to get basic dota info.\n \n `!csgostats <steam id (custom or not)>` to get csgo info.\n \n `!banstatus <steam id (custom or not)>` to get ban info.\n \n `!randtablenum <Line> <Min> <Max> <Number Of Numbers> <Repeats(true or false)>` to get a random number from the AP Stats Table.\n\n `!playercounts` to see how many players are on steam and in steam games.\n\n `!dotaleaderboards` to see the current dota MMR leaderboards. \n\n **PRO TIP**: i will only accept 1 message per 5 seconds from each user because Dhruv will spam me otherwise."
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

      case 'gethero':
        var heroName = message.substring(message.indexOf(' ') + 1);
        var testHero = readDotaHeroFile("heroes.json", heroName, channelID, userID);

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
      case 'getitem':
        console.log(userID);
        var itemName = message.substring(message.indexOf(' ') + 1);
        var testItem = readDotaItemFile("items.json", itemName, channelID, userID);


        break;
      case 'refreshdotadata':
        console.log(userID);
        if (userID == auth.adminID) {
          console.log("Refresh Started")
          refreshDotaData();
        }


        break;
      case 'randtablenum':
        console.log(userID);

        var input = message.substring(message.indexOf(' ') + 1);
        var params = input.split(" ");


        randomStatNumbers("ap_stat_table_b.txt", params[0], params[1], params[2], params[3], channelID, userID, params[4])


        break;
      case 'playercounts':
        console.log(userID);
        steamStatus(channelID, userID)
        break;
      case 'dotaleaderboards':
        console.log(userID);
        leaderboardMessage(channelID, userID)
        break;
    }
  }
});
