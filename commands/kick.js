
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const config = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a member from VyroxMC.")
        .addUserOption(option =>
            option.setName("member")
                .setDescription("Member to kick")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the kick")
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

        const botMember = interaction.guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                content: "❌ I need Kick Members permission.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("member");
        const reason = interaction.options.getString("reason");

        if (user.id === interaction.user.id ||
            user.id === interaction.guild.ownerId) {
            return interaction.reply({
                content: "❌ You cannot kick this member.",
                ephemeral: true
            });
        }

        const member = await interaction.guild.members.fetch(user.id)
            .catch(() => null);

        if (!member || !member.kickable) {
            return interaction.reply({
                content: "❌ This member cannot be kicked. Check role hierarchy.",
                ephemeral: true
            });
        }

        const dmEmbed = new EmbedBuilder()
            .setColor("#FF4444")
            .setTitle("⚠️ VyroxMC Moderation")
            .setDescription(`You have been kicked from **${interaction.guild.name}**.`)
            .addFields({
                name: "Reason",
                value: reason.slice(0, 1024)
            })
            .setTimestamp();

        const dmSent = await user.send({ embeds: [dmEmbed] })
            .then(() => true)
            .catch(() => false);

        try {
            await member.kick(reason);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#A855F7")
                        .setTitle("✅ Member Kicked")
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
            console.error("Kick error:", error);

            await interaction.reply({
                content: "❌ Failed to kick this member.",
                ephemeral: true
            });
        }
    }
};
