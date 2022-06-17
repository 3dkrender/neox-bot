const Discord = require("discord.js");
const express = require('express');
const bodyParser = require('body-parser');
var moment = require('moment');

const { mongoose } = require('./db.js');
const { Giveaway } = require('./models/giveaway')
const config = require("./config");
const package = require("./package.json");

const channelConfig = '🧟│bot-test';
const channelGiveaway = '🤖│botdev';

const bot = new Discord.Client({
    disableEveryone: true
});

bot.login(config.token);

const app = express();
app.use(bodyParser.json());

const giveaway = [];

bot.on("ready", async () => {
    console.log(`Bot is ready ${bot.user.username}`);
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);

    } catch (e) {
        console.log(e.stack);
    }

});

bot.on("message", async msg => {

    try {

        //console.log(msg.author.bot);
        if (msg.author.bot) {
            //console.log(msg.embeds.length);
            if (msg.channel.name === channelConfig) return;
            if (msg.content.indexOf(':tada: Congratulations') === 0) return;
            if (msg.content.indexOf(':tada: Giveaway') === 0) return;

            if(msg.embeds.length === 0) return;

            if (msg.embeds[0].title == ':tada: 3DK Render Giveaway :tada:') {

                var giveawayID = msg.embeds[0].footer.text.split(" ")[1];
                console.log(` giveawayID: ${giveawayID}`);
                await msg.react('🎉');

                Giveaway.findOne(
                    { status: 'ongoing', gid: giveawayID },
                    (err, data) => {
                        if (err) {
                            console.log(err);
                        }

                        if (data) {

                            // This will be repeated every for 5 times with 10 second intervals:
                            setIntervalX(function () {
                                msg.edit({
                                    "embed": {
                                        "title": ":tada: 3DK Render Giveaway :tada:",
                                        "description": msg.embeds[0].description,
                                        "url": "",
                                        "color": 2146335,
                                        "footer": {
                                            "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                            "text": msg.embeds[0].footer.text
                                        },
                                        "fields": [
                                            {
                                                "name": "React with :tada: to enter the Giveaway",
                                                "value": `Time Remaining: ${timeRemaining(data.endTime)}`
                                            },
                                            {
                                                "name": msg.embeds[0].fields[1].name,
                                                "value": msg.embeds[0].fields[1].value
                                            }
                                        ]
                                    }
                                });
                            }, 10000, (data.duration * 6) - 1);

                            // Create a reaction collector
                            const filter = (reaction) => reaction.emoji.name === '🎉'
                            msg.awaitReactions(filter, {
                                time: data.duration * 60000
                            })
                                .then(collected => {

                                    var winnersArray = [];
                                    console.log(`giveawayData : ${data}`);
                                    //console.log(`Collected ${collected.size} reactions`);
                                    var users = collected.get('🎉').users;
                                    //console.log(users);
                                    var humanUsers = users.filter(u => !u.bot);
                                    //console.log(`Human Array: ${humanUsers.array()}`);
                                    console.log(`User Length: ${users.array().length}`);
                                    console.log(`Human Length: ${humanUsers.array().length}`);

                                    if (users.array().length === 1) {

                                        msg.edit({
                                            "embed": {
                                                "title": ":tada: 3DK Render Giveaway :tada:",
                                                "description": msg.embeds[0].description,
                                                "url": "",
                                                "color": 2146335,
                                                "footer": {
                                                    "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                                    "text": msg.embeds[0].footer.text
                                                },
                                                "fields": [
                                                    {
                                                        "name": ":tada: Giveaway has ended",
                                                        "value": `Could not determine a winner!`
                                                    }
                                                ]
                                            }
                                        });

                                        msg.channel.send(`:tada: Giveaway has Ended. A winner could not be determined!`);

                                        console.log(winnersArray);
                                        Giveaway.updateOne({ _id: data.id }, { winners: winnersArray, status: "completed" }, (err) => {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                        return;

                                    }

                                    if (humanUsers.array().length <= data.winnerCount) {

                                        humanUsers.forEach((user) => {
                                            winnersArray.push(`<@${user.id}>`)
                                            console.log(`${user.username}`);
                                        })
                                    }
                                    else {

                                        var randomWinners = humanUsers.random(data.winnerCount);
                                        console.log(randomWinners);
                                        //console.log(humanUsers);

                                        randomWinners.forEach((user) => {
                                            winnersArray.push(`<@${user.id}>`)
                                            console.log(`${user.username}`);
                                        })

                                    }

                                    msg.edit({
                                        "embed": {
                                            "title": ":tada: 3DK Render Giveaway :tada:",
                                            "description": msg.embeds[0].description,
                                            "url": "",
                                            "color": 2146335,
                                            "footer": {
                                                "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                                "text": msg.embeds[0].footer.text
                                            },
                                            "fields": [
                                                {
                                                    "name": ":tada: Giveaway has ended",
                                                    "value": `Congratulations ${winnersArray}`
                                                },
                                                {
                                                    "name": msg.embeds[0].fields[1].name,
                                                    "value": msg.embeds[0].fields[1].value
                                                }
                                            ]
                                        }
                                    });

                                    msg.channel.send(`:tada: Congratulations ${winnersArray}. You have been randomly selected as the winner for the giveaway.`);

                                    console.log(winnersArray);
                                    Giveaway.updateOne({ _id: data.id }, { winners: winnersArray, status: "completed" }, (err) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });

                                })
                                .catch(console.error);

                        }

                        else {
                            msg.channel.send(`There was an error in completing the giveaway. Please contact administrator.`);
                        }
                    }
                )



            }




        }

        if (msg.channel.type === "dm") return;

        // if (msg.channel.name === "post-promotion" || msg.channel.name === "hunts" || msg.channel.name === "dragon-posts" || msg.channel.name === "whaleshares-post-promotion" || msg.channel.name === "giveaway-post-candidates") {
        //     checkPosts(msg);
        // }
        if (msg.channel.name === channelGiveaway) {
            //console.log(msg);
            if (msg.content.indexOf('$3dk') === 0) {
                msg.reply(`Hi I'm the Neox Bot version ${package.version}.`);
                //msg.react('🎉');
            }
        }

        if (msg.channel.name === channelGiveaway) {

            Giveaway.findOne(
                { status: 'started', initiatorID: msg.author.id },
                (err, data) => {
                    if (err) {
                        console.log(err);
                    }

                    if (data) {
                        //console.log(data);
                        if (msg.content.indexOf('$3dk gcreate') == 0) {

                            msg.channel.send(`You have already initiated a giveaway. You cannot initiate one more in parallel. If you would like to cancel the current giveaway, reply with a command  ` + '`' + `cancel` + '`' + ``);

                        }

                        if (msg.content.indexOf('cancel') == 0) {

                            Giveaway.updateOne({ "_id": data.id }, {status: "deleted" }, (err, data) => {

                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    msg.channel.send(`Previous giveaway has been successfully marked as deleted. You can now start a new giveaway with the command ` + '`' + `$3dk gcreate` + '`' + `.`);
                                }

                            });

                        }
                        else {

                            if (data.channel == "") {

                                if (msg.content.indexOf('<#') == 0) {

                                    Giveaway.updateOne({ _id: data.id }, { channel: msg.content }, (err, data) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            msg.channel.send(`:tada: Sweet! The giveaway will be in ${msg.content}! Next, how long should the giveaway last? \n Please enter the duration of the giveaway in minutes. Please enter a value between 1 and 60. ` + '`' + `Eg: 3` + '`' + `.`);
                                            return;
                                        }
                                    })
                                    return;

                                }

                                else {

                                    msg.channel.send(`This is not a valid channel. In order to select a channel, please enter ` + '`' + `#` + '`' + ` followed by the channel name and choose the channel.`);
                                    return;

                                }



                                //data.channel = msg.content;
                                //console.log(giveaway);                            

                            }

                            console.log(`duration: ${data.duration}`);

                            if (data.duration == null) {

                                var minutes = parseInt(msg.content);

                                if (isNaN(minutes)) {
                                    msg.channel.send(`The entered value ` + '`' + `${msg.content}` + '`' + ` is not a valid number. Please enter again.`);
                                    return;
                                } else {

                                    Giveaway.update({ _id: data.id }, { duration: msg.content }, (err, data) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            msg.channel.send(`:tada: Neat! This giveaway will last ` + '`' + `${msg.content}` + '`' + ` minutes! Now, how many winners should there be? \n Please enter a value between 1 and 10. ` + '`' + `Eg: 2` + '`' + `.`);
                                            return;
                                        }
                                    })

                                    return;
                                }

                            }

                            if (data.winnerCount == null) {

                                var winners = parseInt(msg.content);

                                if (isNaN(winners)) {
                                    msg.channel.send(`The entered value ` + '`' + `${msg.content}` + '`' + ` is not a valid number. Please enter again.`);
                                    return;
                                } else {

                                    Giveaway.update({ _id: data.id }, { winnerCount: msg.content }, (err, data) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            msg.channel.send(`:tada: Ok! ` + '`' + `${msg.content}` + '`' + ` winner it is! Finally, what do you want to give away? \n Please enter the giveaway prize. This will also begin the giveaway.`);
                                            return;
                                        }
                                    })
                                    return;

                                }
                            }

                            if (data.prize == "") {

                                Giveaway.findOne().sort({ gid: -1 })
                                    .then((seq) => {

                                        var update = {
                                            prize: msg.content,
                                            gid: seq.gid + 1,
                                            status: 'ongoing',
                                            startTime: new Date(),
                                            endTime: moment(new Date()).add(data.duration, 'm').toDate()
                                        };
                                        Giveaway.findOneAndUpdate({ _id: data.id }, update, { new: true }, (err, value) => {
                                            if (err) {
                                                console.log(err);
                                            }
                                            else {
                                                //console.log(value);
                                                msg.channel.send(`Done! The giveaway for ` + '`' + `${msg.content}` + '`' + ` is starting in ${value.channel}!`);
                                                var ch = value.channel.replace(/[^0-9\.]/g, '');
                                                var gift = ":gift: "
                                                var footer = `No: ${value.gid} | Ends at • ${moment(new Date()).add(value.duration, 'm').format('MMMM Do YYYY, h:mm:ss a')}`;
                                                var timeRemaining = `Time Remaining: ${value.duration} minutes`;
                                                bot.channels.get(ch).send({
                                                    "embed": {
                                                        "title": ":tada: 3DK Render Giveaway :tada:",
                                                        "description": value.prize,
                                                        "url": "",
                                                        "color": 2146335,
                                                        "footer": {
                                                            "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                                            "text": footer
                                                        },
                                                        "fields": [
                                                            {
                                                                "name": "React with :tada: to enter the Giveaway",
                                                                "value": timeRemaining
                                                            },
                                                            {
                                                                "name": `${value.winnerCount} Winners`,
                                                                "value": gift.repeat(value.winnerCount)
                                                            }
                                                        ]
                                                    }
                                                });
                                                return;
                                            }
                                        })
                                    }
                                    )
                                    .catch((err) => {
                                        console.log(err);
                                    })


                            }

                            else {
                                msg.channel.send(`The command is not valid.`);
                            }

                        }


                    } else {
                        if (msg.content.indexOf('$3dk gcreate') == 0) {
                            console.log('no data');
                            var giveaway = new Giveaway({
                                initiatorID: msg.author.id,
                                initiatorUsername: msg.author.username,
                                createdTimestamp: msg.createdTimestamp,
                                startTime: "",
                                endTime: "",
                                channel: "",
                                duration: "",
                                winnerCount: "",
                                winners: "",
                                prize: "",
                                gid: "",
                                status: "started"
                            });
                            giveaway.save((err, doc) => {
                                if (!err) {
                                    msg.channel.send(`:tada: Alright! Let's set up your giveaway! First, what channel do you want the giveaway in?`);
                                    return;
                                }
                                else {
                                    console.log('Error in Saving Giveaway: ' + JSON.stringify(err, undefined, 2));
                                    msg.channel.send(`There was an error while initiating the Giveaway. Please contact Administrator.`);
                                }
                            })
                        }
                        else {
                            // msg.channel.send(`This is not a valid command. Please use ` + '`' + `$3dk gcreate` + '`' + ` to initiate a giveaway.`);
                        }

                    }

                },
            )
            return;

        }
        return;

    } catch (e) {
        console.log(e.stack);
    }

});


function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = setInterval(function () {

        callback();

        if (++x === repetitions) {
            clearInterval(intervalID);
        }
    }, delay);
}

function timeRemaining(endTime) {
    var now = moment();
    var created = moment(endTime);
    // get the difference between the moments
    var diff = now.diff(created);
    var value = "";
    //express as a duration
    var diffDuration = moment.duration(diff);

    var minutes = diffDuration.minutes() * -1;
    var seconds = diffDuration.seconds() * -1;

    //console.log("Days:", diffDuration.days());
    //console.log("Hours:", diffDuration.hours());
    //console.log("Minutes:", diffDuration.minutes() * -1);
    //console.log("Seconds:", diffDuration.seconds() * -1);

    if (diffDuration.minutes() === 0) {
        console.log(`${seconds} seconds`);
        value = `${seconds} seconds`;
        return value;

    }
    if (diffDuration.minutes() === 1) {
        value = minutes + " minute, " + seconds + " seconds";
        return value;
    }
    else {
        console.log(minutes + " minutes, " + seconds + " seconds");
        value = minutes + " minutes, " + seconds + " seconds";
        return value;
    }

}