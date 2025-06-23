require("dotenv").config();
const { token } = process.env;
const Discord = require("discord.js");
const fs = require("fs");
const { Ollama } = require("@langchain/ollama");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { LLMChain } = require("langchain/chains");

const ollama = new Ollama({
  model: "llama3",
  requestOptions: {
    timeout: 120000, // 60 seconds,
  },
});

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageTyping,
    Discord.GatewayIntentBits.MessageContent,
  ],
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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  if (msg.mentions.has(client.user)) {
    let channelmessages = "";
    const fetchedMessages = await msg.channel.messages.fetch({ limit: 5 });
    fetchedMessages.forEach((message) => {
      channelmessages +=
        message.author.username + ": " + message.content + "\n";
    });

    await msg.channel.sendTyping();
    // create prompt then use ollama to get a reply
    const prompt = ChatPromptTemplate.fromTemplate(
      `<|begin_of_text|>
      <|system|>
     Your a discord AI bot
      <|user|>
      {lastmessages}
      Here is the message you need to reply to: {message}
      <|assistant|`
    );
    console.log("Last 5 messages : " + channelmessages);
    const chain = new LLMChain({
      llm: ollama,
      prompt: prompt,
    });
    chain
      .invoke({ message: msg.content, lastmessages: channelmessages })
      .then((res) => {
        console.log(res);
        msg.channel.send(res.text);
      });
  }
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || msg.mentions.has(client.user)) return;

  // create prompt then use ollama to get a reply
  const prompt = ChatPromptTemplate.fromTemplate(
    `<|begin_of_text|>
      <|system|>
      Your a discord AI bot
      <|user|>
      {lastmessages}
      Here is the message you need to reply to: {message}
      <|assistant|`
  );
  const chain = new LLMChain({
    llm: ollama,
    prompt: prompt,
  });
  // Get last 10 messages in the channel
  let channelmessages = "";
  const fetchedMessages = await msg.channel.messages.fetch({ limit: 5 });
  fetchedMessages.forEach((message) => {
    channelmessages += message.author.username + ": " + message.content + "\n";
  });
  await msg.channel.sendTyping();
  console.log("Last 5 messages : " + channelmessages);
  console.log("replying...");
  chain
    .invoke({ message: msg.content, lastmessages: channelmessages })
    .then((res) => {
      console.log(res);
      msg.channel.send(res.text);
    });
});

// Randomly send a message after a certain time
