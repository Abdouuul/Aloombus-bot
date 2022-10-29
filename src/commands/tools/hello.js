const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("This is a test of the first bot command PagMan !"),
  async execute(interaction, client) {
    const message = await interaction.deferReply({
      fetchReply: false,
    });

    const newMessage = `YES I AM HERE AND WORKING  https://tenor.com/view/baby-kid-shouting-yes-yess-gif-17369003`;
    await interaction.editReply({
      content: newMessage,
    });
  },
};
