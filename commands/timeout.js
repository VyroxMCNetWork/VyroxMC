
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
        .setName("timeout")
        .setDescription("Timeout a member.")
        .addUserOption(option =>
            option.setName("member")
                .setDescription("Member to timeout")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName("minutes")
                .setDescription("Duration in minutes (1-40320)")
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for timeout")
                .setRequired(true)),

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

        if (!interaction.guild.members.me.permissions.has(
            PermissionFlagsBits.ModerateMembers
        )) {
            return interaction.reply({
                content: "❌ I need Moderate Members permission.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("member");
        const minutes = interaction.options.getInteger("minutes");
        const reason = interaction.options.getString("reason");

        const member = await interaction.guild.members.fetch(user.id)
            .catch(() => null);

        if (!member || !member.moderatable ||
            user.id === interaction.user.id ||
            user.id === interaction.guild.ownerId) {
            return interaction.reply({
                content: "❌ This member cannot be timed out.",
                ephemeral: true
            });
        }

        const dmEmbed = new EmbedBuilder()
            .setColor("#F59E0B")
            .setTitle("⏳ VyroxMC Moderation")
            .setDescription(`You have been timed out in **${interaction.guild.name}**.`)
            .addFields(
                { name: "Duration", value: `${minutes} minutes` },
                { name: "Reason", value: reason.slice(0, 1024) }
            )
            .setTimestamp();

        const dmSent = await user.send({ embeds: [dmEmbed] })
            .then(() => true)
            .catch(() => false);

        try {
            await member.timeout(minutes * 60 * 1000, reason);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#A855F7")
                        .setTitle("⏳ Member Timed Out")
                        .addFields(
                            { name: "Member", value: `${user.tag} (${user.id})` },
                            { name: "Duration", value: `${minutes} minutes` },
                            { name: "Reason", value: reason.slice(0, 1024) },
                            { name: "DM Status", value: dmSent ? "Sent" : "Could not send" }
                        )
                        .setTimestamp()
                ],
                ephemeral: true
            });
        } catch (error) {
            console.error("Timeout error:", error);

            await interaction.reply({
                content: "❌ Failed to timeout this member.",
                ephemeral: true
            });
        }
    }
};
