
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const config = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a member from VyroxMC.")
        .addUserOption(option =>
            option.setName("member")
                .setDescription("Member to ban")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the ban")
                .setRequired(true)),

    async execute(interaction) {
        const isAdmin = interaction.memberPermissions.has(
            PermissionFlagsBits.Administrator
        );

        const isSeniorAdmin = interaction.member.roles.cache.has(
            config.ROLES.SENIOR_ADMIN
        );

        if (!isAdmin && !isSeniorAdmin) {
            return interaction.reply({
                content: "❌ You don't have permission.",
                ephemeral: true
            });
        }

        if (!interaction.guild.members.me.permissions.has(
            PermissionFlagsBits.BanMembers
        )) {
            return interaction.reply({
                content: "❌ I need Ban Members permission.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("member");
        const reason = interaction.options.getString("reason");

        if (user.id === interaction.user.id ||
            user.id === interaction.guild.ownerId) {
            return interaction.reply({
                content: "❌ You cannot ban this member.",
                ephemeral: true
            });
        }

        const member = await interaction.guild.members.fetch(user.id)
            .catch(() => null);

        if (member && !member.bannable) {
            return interaction.reply({
                content: "❌ I cannot ban this member. Check role hierarchy.",
                ephemeral: true
            });
        }

        const dmEmbed = new EmbedBuilder()
            .setColor("#FF3333")
            .setTitle("🔨 VyroxMC Moderation")
            .setDescription(`You have been banned from **${interaction.guild.name}**.`)
            .addFields({
                name: "Reason",
                value: reason.slice(0, 1024)
            })
            .setTimestamp();

        const dmSent = await user.send({ embeds: [dmEmbed] })
            .then(() => true)
            .catch(() => false);

        try {
            await interaction.guild.members.ban(user.id, {
                reason: `${reason} | Moderator: ${interaction.user.tag}`
            });

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#A855F7")
                        .setTitle("🔨 Member Banned")
                        .addFields(
                            { name: "Member", value: `${user.tag} (${user.id})` },
                            { name: "Reason", value: reason.slice(0, 1024) },
                            { name: "DM Status", value: dmSent ? "Sent" : "Could not send" }
                        )
                        .setFooter({ text: "VyroxMC Moderation" })
                        .setTimestamp()
                ],
                ephemeral: true
            });
        } catch (error) {
            console.error("Ban error:", error);

            await interaction.reply({
                content: "❌ Failed to ban this member.",
                ephemeral: true
            });
        }
    }
};
