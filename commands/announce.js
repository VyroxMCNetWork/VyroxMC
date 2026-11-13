
const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("announce")
        .setDescription("Send an announcement as VyroxMC.")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Channel to send the announcement in")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("message")
                .setDescription("Announcement message")
                .setRequired(true)
                .setMaxLength(2000)),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(
            PermissionFlagsBits.Administrator
        )) {
            return interaction.reply({
                content: "❌ You need Administrator permission.",
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel("channel");
        const message = interaction.options.getString("message");

        if (!channel.isTextBased() || !channel.send) {
            return interaction.reply({
                content: "❌ Please select a text channel.",
                ephemeral: true
            });
        }

        try {
            await channel.send({
                content: message,
                allowedMentions: {
                    parse: ["users", "roles"]
                }
            });

            await interaction.reply({
                content: `✅ Announcement sent in ${channel}.`,
                ephemeral: true
            });

        } catch (error) {
            console.error("Announcement error:", error);

            await interaction.reply({
                content: "❌ Couldn't send the announcement. Check the bot's channel permissions.",
                ephemeral: true
            });
        }
    }
};
