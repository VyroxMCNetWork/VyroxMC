
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const config = require("../config");

const allowedRoles = [
    config.ROLES.SENIOR_ADMIN,
    config.ROLES.ADMIN,
    config.ROLES.MOD,
    config.ROLES.HELPER
];

const SUPPORT_SERVER_ID = "1570515782927126789";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Send the VyroxMC support server invite."),

    async execute(interaction, client) {
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

        const supportGuild = await client.guilds.fetch(
            SUPPORT_SERVER_ID
        ).catch(() => null);

        const serverIcon = supportGuild?.iconURL({
            size: 512,
            extension: "png"
        });

        const embed = new EmbedBuilder()
            .setColor("#8B5CF6")
            .setAuthor({
                name: "VYROXMC SUPPORT",
                ...(serverIcon ? { iconURL: serverIcon } : {})
            })
            .setDescription(
                "**🎫 VYROXMC SUPPORT**\n\n" +
                "Need help? Join our support server below!\n\n" +
                "🔗 **[JOIN SUPPORT SERVER](https://discord.gg/Sx9JDdH33X)**"
            )
            .setFooter({
                text: "VyroxMC Network",
                ...(serverIcon ? { iconURL: serverIcon } : {})
            });

        if (serverIcon) {
            embed.setThumbnail(serverIcon);
        }

        await interaction.reply({
            embeds: [embed]
        });
    }
};
