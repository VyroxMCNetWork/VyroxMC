
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const config = require("../config");

const allowedRoles = [
    config.ROLES.SENIOR_ADMIN,
    config.ROLES.ADMIN,
    config.ROLES.MOD
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a member.")
        .addUserOption(option =>
            option.setName("member")
                .setDescription("Member to warn")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Warning reason")
                .setRequired(true)
                .setMaxLength(1000))
        .addAttachmentOption(option =>
            option.setName("screenshot")
                .setDescription("Optional evidence screenshot")
                .setRequired(false)),

    async execute(interaction) {
        const isAdmin = interaction.memberPermissions.has(
            PermissionFlagsBits.Administrator
        );

        const hasStaffRole = allowedRoles.some(role =>
            interaction.member.roles.cache.has(role)
        );

        if (!isAdmin && !hasStaffRole) {
            return interaction.reply({
                content: "❌ You don't have permission.",
                ephemeral: true
            });
        }

        // Acknowledge immediately to prevent Unknown Interaction
        await interaction.deferReply({ ephemeral: true });

        try {
            const user = interaction.options.getUser("member");
            const reason = interaction.options.getString("reason");
            const screenshot = interaction.options.getAttachment("screenshot");

            if (
                user.id === interaction.user.id ||
                user.id === interaction.guild.ownerId
            ) {
                return interaction.editReply(
                    "❌ You cannot warn this member."
                );
            }

            const member = await interaction.guild.members.fetch(user.id)
                .catch(() => null);

            if (!member) {
                return interaction.editReply(
                    "❌ Member not found in this server."
                );
            }

            if (
                screenshot &&
                !screenshot.contentType?.startsWith("image/")
            ) {
                return interaction.editReply(
                    "❌ Please upload an image screenshot."
                );
            }

            const dmEmbed = new EmbedBuilder()
                .setColor("#F59E0B")
                .setTitle("⚠️ Official VyroxMC Warning")
                .setDescription(
                    `You have received a warning in **${interaction.guild.name}**.`
                )
                .addFields({
                    name: "Reason",
                    value: reason.slice(0, 1024)
                })
                .setFooter({
                    text: "Please follow the server rules."
                })
                .setTimestamp();

            if (screenshot) {
                dmEmbed.setImage(screenshot.url);
            }

            const dmSent = await user.send({
                embeds: [dmEmbed]
            }).then(() => true).catch(() => false);

            const resultEmbed = new EmbedBuilder()
                .setColor("#A855F7")
                .setTitle("⚠️ Warning Issued")
                .addFields(
                    {
                        name: "Member",
                        value: `${user.tag} (${user.id})`
                    },
                    {
                        name: "Reason",
                        value: reason.slice(0, 1024)
                    },
                    {
                        name: "Screenshot",
                        value: screenshot ? "Attached" : "Not provided"
                    },
                    {
                        name: "DM Status",
                        value: dmSent ? "Delivered" : "Could not deliver"
                    }
                )
                .setFooter({
                    text: "VyroxMC Moderation"
                })
                .setTimestamp();

            return interaction.editReply({
                embeds: [resultEmbed]
            });

        } catch (error) {
            console.error("Warn command error:", error);

            return interaction.editReply(
                "❌ Something went wrong while issuing the warning."
            ).catch(() => {});
        }
    }
};
