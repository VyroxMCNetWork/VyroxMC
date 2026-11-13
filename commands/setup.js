
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Set up VyroxMC server systems.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("ticket")
                .setDescription("Create the VyroxMC support ticket panel.")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand !== "ticket") return;

        const serverIcon = interaction.guild.iconURL({
            size: 512,
            extension: "png"
        });

        const embed = new EmbedBuilder()
            .setColor("#8B5CF6")
            .setAuthor({
                name: "VYROXMC NETWORK",
                iconURL: serverIcon || undefined
            })
            .setTitle("🎫  VYROXMC SUPPORT CENTER")
            .setDescription(
                "Welcome to **VyroxMC Network Support**!\n\n" +
                "Need help with something? Our support team is here for you.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✨ **CREATE A SUPPORT TICKET**\n\n" +
                "Click the button below to open a private support ticket.\n\n" +
                "You'll be asked for your Minecraft username and a description of your issue directly in the ticket chat.\n\n" +
                "🔒 Your ticket is private and can only be viewed by you and our staff team.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "💜 **We're here to help.**"
            )
            .setThumbnail(serverIcon)
            .setFooter({
                text: "VyroxMC Network • Official Support",
                iconURL: serverIcon || undefined
            })
            .setTimestamp();

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("vyroxmc_create_ticket")
                .setLabel("Create a Ticket")
                .setEmoji("🎫")
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
            content: "✅ Your VyroxMC ticket panel has been created.",
            ephemeral: true
        });

        await interaction.channel.send({
            embeds: [embed],
            components: [button]
        });
    }
};
