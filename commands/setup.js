
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require("discord.js");

const APPLICATION_SERVER_ID = "1570765318513754173";
const APPLICATION_REVIEW_CHANNEL_ID = "1570775196779020318";

const APPLICATION_REVIEWER_ROLES = [
    "1570768938629988402", // Senior Admin
    "1570765719606657094", // Founder & Owner
    "1570765803496939550", // Owner
    "1570774256814399518"  // Co-Owner
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Set up VyroxMC server systems.")

        .addSubcommand(subcommand =>
            subcommand
                .setName("ticket")
                .setDescription("Create the VyroxMC support ticket panel.")
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("staff")
                .setDescription("Create the VyroxMC staff application panel.")
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // ======================================
        // TICKET SETUP
        // ======================================
        if (subcommand === "ticket") {
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
                .setTitle("🎫 VYROXMC SUPPORT CENTER")
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
                .setFooter({
                    text: "VyroxMC Network • Official Support",
                    iconURL: serverIcon || undefined
                })
                .setTimestamp();

            if (serverIcon) {
                embed.setThumbnail(serverIcon);
            }

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

            return;
        }

        // ======================================
        // STAFF APPLICATION SETUP
        // ======================================
        if (subcommand === "staff") {
            if (interaction.guildId !== APPLICATION_SERVER_ID) {
                return interaction.reply({
                    content: "❌ Staff application setup can only be used in the VyroxMC Moderator Applications server.",
                    ephemeral: true
                });
            }

            await interaction.deferReply({
                ephemeral: true
            });

            try {
                const guild = interaction.guild;

                const reviewChannel = await guild.channels
                    .fetch(APPLICATION_REVIEW_CHANNEL_ID)
                    .catch(() => null);

                if (!reviewChannel || !reviewChannel.isTextBased()) {
                    return interaction.editReply(
                        "❌ I couldn't find the application review channel. Please check the channel ID."
                    );
                }

                // Lock the review channel
                await reviewChannel.permissionOverwrites.edit(
                    guild.id,
                    {
                        ViewChannel: false
                    }
                );

                // Give the management roles access
                for (const roleId of APPLICATION_REVIEWER_ROLES) {
                    if (guild.roles.cache.has(roleId)) {
                        await reviewChannel.permissionOverwrites.edit(
                            roleId,
                            {
                                ViewChannel: true,
                                ReadMessageHistory: true,
                                SendMessages: true
                            }
                        );
                    }
                }

                // Ensure the bot can access the review channel
                await reviewChannel.permissionOverwrites.edit(
                    interaction.client.user.id,
                    {
                        ViewChannel: true,
                        ReadMessageHistory: true,
                        SendMessages: true,
                        EmbedLinks: true
                    }
                );

                const serverIcon = guild.iconURL({
                    size: 512,
                    extension: "png"
                });

                const embed = new EmbedBuilder()
                    .setColor("#8B5CF6")
                    .setAuthor({
                        name: "VYROXMC NETWORK",
                        iconURL: serverIcon || undefined
                    })
                    .setTitle("🛡️ VYROXMC STAFF RECRUITMENT")
                    .setDescription(
                        "Interested in becoming part of the **VyroxMC Staff Team**?\n\n" +
                        "We are looking for responsible, active and dedicated members to help our network grow.\n\n" +
                        "━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                        "📋 **STAFF APPLICATION**\n\n" +
                        "Click the button below to begin your application.\n\n" +
                        "You will be asked 5 questions, one at a time, in a private application channel.\n\n" +
                        "🇬🇧 English is mandatory.\n" +
                        "🇸🇦 اللغة الإنجليزية إلزامية.\n\n" +
                        "Please answer honestly and provide as much detail as possible.\n\n" +
                        "━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                        "💜 **Good luck, and thank you for your interest in VyroxMC!**"
                    )
                    .setFooter({
                        text: "VyroxMC Network • Staff Recruitment",
                        iconURL: serverIcon || undefined
                    })
                    .setTimestamp();

                if (serverIcon) {
                    embed.setThumbnail(serverIcon);
                }

                const button = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("vyroxmc_staff_apply")
                        .setLabel("Apply for Staff")
                        .setEmoji("🛡️")
                        .setStyle(ButtonStyle.Primary)
                );

                await interaction.channel.send({
                    embeds: [embed],
                    components: [button]
                });

                await interaction.editReply(
                    "✅ VyroxMC staff application panel created successfully!\n\n" +
                    `📋 Applications will be sent to ${reviewChannel}.`
                );

            } catch (error) {
                console.error("Staff setup error:", error);

                await interaction.editReply(
                    "❌ Could not set up the staff application system. Check the bot's permissions and Railway logs."
                ).catch(() => {});
            }

            return;
        }
    }
};
