
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const OWNER_ID = "1570526214953640058";
const LEVELS_FILE = path.join(__dirname, "..", "levels.json");

function loadLevels() {
    try {
        return fs.existsSync(LEVELS_FILE)
            ? JSON.parse(fs.readFileSync(LEVELS_FILE, "utf8"))
            : {};
    } catch {
        return {};
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("level")
        .setDescription("Manage member levels")
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Add levels to a member")
                .addUserOption(option =>
                    option.setName("member")
                        .setDescription("Choose a member")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("Number of levels to add")
                        .setMinValue(1)
                        .setMaxValue(1000)
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({
                content: "❌ Only the VyroxMC owner can use this command.",
                ephemeral: true
            });
        }

        const member = interaction.options.getUser("member");
        const amount = interaction.options.getInteger("amount");

        const levels = loadLevels();
        const key = `${interaction.guildId}-${member.id}`;

        if (!levels[key]) {
            levels[key] = {
                messages: 0,
                bonusLevels: 0
            };
        }

        levels[key].bonusLevels =
            (levels[key].bonusLevels || 0) + amount;

        try {
            fs.writeFileSync(
                LEVELS_FILE,
                JSON.stringify(levels, null, 2)
            );
        } catch (error) {
            console.error("Level save error:", error);

            return interaction.reply({
                content: "❌ Could not save the levels.",
                ephemeral: true
            });
        }

        const currentLevel =
            Math.floor((levels[key].messages || 0) / 30) +
            levels[key].bonusLevels;

        return interaction.reply({
            content: `✨ Added **${amount} levels** to ${member}!\nThey are now **Level ${currentLevel}**.`,
            ephemeral: true
        });
    }
};
