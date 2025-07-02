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

  const isMention = msg.mentions.has(client.user) || true;
  const shouldRespond = isMention; // Add your logic here
  if (!shouldRespond) return;

  await msg.channel.sendTyping();

  // Fetch last 5 messages
  const fetchedMessages = await msg.channel.messages.fetch({ limit: 5 });
  const cleanedMessages = [];

  fetchedMessages.forEach((message) => {
    // Skip long messages (over 300 characters) or embeds/attachments
    if (
      message.content.length > 300 ||
      message.embeds.length > 0 ||
      message.attachments.size > 0
    )
      return;

    // Clean message content
    let content = message.content.replace(/```[\s\S]*?```/g, "[code block]");
    content = content.replace(/\n/g, " ").slice(0, 300); // Trim to 300 chars
    cleanedMessages.push(`${message.author.username}: ${content}`);
  });

  const lastMessages = cleanedMessages.reverse().join("\n");

  // Create prompt
  const prompt = ChatPromptTemplate.fromTemplate(
    `<|begin_of_text|>
      <|system|>
     Your a discord AI bot
      <|user|>
      Last 5 messages of this conversation:
      {lastmessages}
      Here is the message you need to reply to: {message}
      <|assistant|`
  );

  const chain = new LLMChain({
    llm: ollama,
    prompt: prompt,
  });

  try {
    const res = await chain.invoke({
      message: msg.content.slice(0, 500), // Limit message length
      lastmessages: lastMessages,
    });

    if (res?.text) {
      msg.channel.send(res.text);
    } else {
      msg.channel.send("Sorry, I couldn't generate a reply.");
    }
  } catch (error) {
    console.error("Error invoking LLM:", error);
    msg.channel.send("Oops! Something went wrong with the AI.");
  }
});
