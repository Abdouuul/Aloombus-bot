require("dotenv").config();
const {
    token
} = process.env;
const Discord = require("discord.js");
const fs = require("fs");

const client = new Discord.Client({
    intents: Discord.GatewayIntentBits.Guilds,
});
client.commands = new Discord.Collection();
client.commandArray = [];

const functionsFolders = fs.readdirSync(`./src/functions`);
for (const folder of functionsFolders) {
    const functionFiles = fs
        .readdirSync(`./src/functions/${folder}`)
        .filter((file) => file.endsWith(".js"));

    for (const file of functionFiles)
        require(`./functions/${folder}/${file}`)(client);
}

client.handleEvents();
client.handleCommands();
client.login(token);