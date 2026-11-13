
require("dotenv").config();

const {
    REST,
    Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const commands = [];
const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"))) {
    const command = require(path.join(commandsPath, file));

    if (command.data && command.execute) {
        commands.push(command.data.toJSON());
        console.log(`[READY] /${command.data.name}`);
    }
}

if (!process.env.TOKEN || !process.env.CLIENT_ID) {
    console.error("Missing TOKEN or CLIENT_ID in .env");
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registering VyroxMC commands globally...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("=================================");
        console.log("VYROXMC COMMANDS REGISTERED!");
        console.log(`Total commands: ${commands.length}`);
        console.log("Commands registered globally.");
        console.log("=================================");
    } catch (error) {
        console.error("Command registration failed:", error);
    }
})();
