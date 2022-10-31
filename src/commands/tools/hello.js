const Discord = require("discord.js");

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName("hello")
    .setDescription("This is a test of the first bot command PagMan !"),
  async execute(interaction, client) {
    const message = await interaction.deferReply({
      fetchReply: false,
    });

    const newMessage = `YES I AM HERE AND WORKING, you used`;
    await interaction.editReply({
      content: Discord.bold(newMessage),
    });
  },
};
