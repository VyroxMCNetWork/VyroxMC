
require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Collection,
    ActivityType,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// OTHER SERVER TICKET SETTINGS
const OTHER_TICKET_SERVER_ID = "1570515782927126789";

const OTHER_SERVER_STAFF_ROLES = [
    "1570727962863607908", // Senior Mod
    "1570728049379647629", // Mod
    "1570728360064057484"  // Assistance
];

// VYROXMC LEVEL SYSTEM SETTINGS
const LEVEL_CHANNEL_ID = "1564678166767739012";
const LEVELS_FILE = path.join(__dirname, "levels.json");

function loadLevels() {
    try {
        return fs.existsSync(LEVELS_FILE)
            ? JSON.parse(fs.readFileSync(LEVELS_FILE, "utf8"))
            : {};
    } catch (error) {
        console.error("Could not load levels:", error);
        return {};
    }
}

function saveLevels(levels) {
    fs.writeFileSync(LEVELS_FILE, JSON.stringify(levels, null, 2));
}

function getLevel(data) {
    return Math.floor((data.messages || 0) / 30) +
        (data.bonusLevels || 0);
}

// Load commands
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            delete require.cache[require.resolve(filePath)];

            const command = require(filePath);

            if (!command.data || !command.execute) continue;

            client.commands.set(command.data.name, command);
            console.log(`[LOADED] /${command.data.name}`);
        } catch (error) {
            console.error(`[ERROR] Loading ${file}:`, error);
        }
    }
}

client.once("ready", () => {
    console.log("=================================");
    console.log("       VYROXMC NETWORK");
    console.log("=================================");
    console.log(`Bot: ${client.user.tag}`);
    console.log(`Bot ID: ${client.user.id}`);
    console.log(`Servers: ${client.guilds.cache.size}`);
    console.log(`Commands: ${client.commands.size}`);
    console.log("Status: ONLINE");
    console.log("=================================");

    client.user.setPresence({
        activities: [{
            name: "VyroxMC Network",
            type: ActivityType.Watching
        }],
        status: "online"
    });
});

// COUNT MESSAGES AND GIVE LEVELS
client.on("messageCreate", async message => {
    if (!message.guild || message.author.bot) return;

    const levels = loadLevels();
    const key = `${message.guild.id}-${message.author.id}`;

    if (!levels[key]) {
        levels[key] = {
            messages: 0,
            bonusLevels: 0
        };
    }

    const data = levels[key];
    const oldLevel = getLevel(data);

    data.messages = (data.messages || 0) + 1;

    const newLevel = getLevel(data);

    try {
        saveLevels(levels);
    } catch (error) {
        console.error("Could not save levels:", error);
        return;
    }

    if (newLevel > oldLevel) {
        const channel = await message.guild.channels
            .fetch(LEVEL_CHANNEL_ID)
            .catch(() => null);

        if (!channel || !channel.isTextBased()) return;

        const avatar = message.author.displayAvatarURL({
            size: 128
        });

        const levelMessage = new EmbedBuilder()
            .setColor("#8B5CF6")
            .setAuthor({
                name: `${message.author.username} reached Level ${newLevel}`,
                iconURL: avatar
            })
            .setDescription("✨ Keep chatting. Keep climbing.");

        await channel.send({
            embeds: [levelMessage]
        }).catch(console.error);
    }
});

// Ticket close button
function createCloseRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("vyroxmc_close_ticket")
            .setLabel("Close Ticket")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
    );
}

// Interaction handler
client.on("interactionCreate", async interaction => {

    // CREATE TICKET BUTTON
    if (
        interaction.isButton() &&
        interaction.customId === "vyroxmc_create_ticket"
    ) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;
            const user = interaction.user;

            if (!guild) {
                return interaction.editReply("❌ This only works inside the server.");
            }

            const existingTicket = guild.channels.cache.find(channel =>
                channel.topic === `vyroxmc-ticket:${user.id}`
            );

            if (existingTicket) {
                return interaction.editReply(
                    `❌ You already have an open ticket: ${existingTicket}`
                );
            }

            // SERVER-SPECIFIC STAFF ROLES
            let staffRoles;

            if (guild.id === OTHER_TICKET_SERVER_ID) {
                // Other server: only these three staff roles
                staffRoles = OTHER_SERVER_STAFF_ROLES;
            } else {
                // Main VyroxMC server: keep original staff roles
                staffRoles = [
                    config.ROLES.SENIOR_ADMIN,
                    config.ROLES.ADMIN,
                    config.ROLES.MOD,
                    config.ROLES.HELPER
                ].filter(Boolean);
            }

            const permissionOverwrites = [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                },
                ...staffRoles.map(roleId => ({
                    id: roleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                }))
            ];

            const safeName = user.username
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "")
                .slice(0, 20) || "user";

            const ticketChannel = await guild.channels.create({
                name: `ticket-${safeName}`,
                type: ChannelType.GuildText,
                topic: `vyroxmc-ticket:${user.id}`,
                permissionOverwrites
            });

            const serverIcon = guild.iconURL({
                size: 256,
                extension: "png"
            });

            const welcomeEmbed = new EmbedBuilder()
                .setColor("#8B5CF6")
                .setAuthor({
                    name: "VYROXMC NETWORK SUPPORT",
                    iconURL: serverIcon || undefined
                })
                .setTitle("🎫 Your Support Ticket")
                .setDescription(
                    `Welcome ${user}!\n\n` +
                    "Thank you for contacting **VyroxMC Support**.\n\n" +
                    "Let's get a few details so our staff team can help you.\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━\n" +
                    "📝 **TICKET SETUP**\n" +
                    "1. Send your Minecraft username.\n" +
                    "2. Describe the issue you're having.\n" +
                    "━━━━━━━━━━━━━━━━━━━━"
                )
                .setThumbnail(serverIcon)
                .setFooter({
                    text: "VyroxMC Network • Support Department",
                    iconURL: serverIcon || undefined
                })
                .setTimestamp();

            await ticketChannel.send({
                content: `${user}`,
                embeds: [welcomeEmbed]
            });

            await interaction.editReply(
                `✅ Your private ticket has been created: ${ticketChannel}`
            );

            // ASK FOR MINECRAFT IGN
            const ignEmbed = new EmbedBuilder()
                .setColor("#8B5CF6")
                .setTitle("👤 Step 1 — Minecraft Username")
                .setDescription(
                    "Please type your **Minecraft username (IGN)** in the chat below.\n\n" +
                    "Example: `Steve123`\n\n" +
                    "⏳ Waiting for your response..."
                );

            await ticketChannel.send({ embeds: [ignEmbed] });

            const ignMessages = await ticketChannel.awaitMessages({
                filter: message =>
                    message.author.id === user.id &&
                    !message.author.bot,
                max: 1,
                time: 300000
            });

            if (ignMessages.size === 0) {
                await ticketChannel.send({
                    content: `${user}`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#F59E0B")
                            .setTitle("⌛ Ticket Setup Paused")
                            .setDescription(
                                "We didn't receive your Minecraft username in time.\n" +
                                "Please contact staff if you still need help."
                            )
                    ],
                    components: [createCloseRow()]
                });
                return;
            }

            const ign = ignMessages.first().content.trim().slice(0, 100);

            // ASK FOR ISSUE
            const issueEmbed = new EmbedBuilder()
                .setColor("#8B5CF6")
                .setTitle("📝 Step 2 — Describe Your Issue")
                .setDescription(
                    `Minecraft IGN: **${ign}**\n\n` +
                    "Now explain the issue you're experiencing.\n" +
                    "Please include as much detail as possible.\n\n" +
                    "⏳ Waiting for your response..."
                );

            await ticketChannel.send({ embeds: [issueEmbed] });

            const issueMessages = await ticketChannel.awaitMessages({
                filter: message =>
                    message.author.id === user.id &&
                    !message.author.bot,
                max: 1,
                time: 300000
            });

            if (issueMessages.size === 0) {
                await ticketChannel.send({
                    content: `${user}`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#F59E0B")
                            .setTitle("⌛ Ticket Setup Paused")
                            .setDescription(
                                "We didn't receive your issue description in time.\n" +
                                "Please contact staff if you still need help."
                            )
                    ],
                    components: [createCloseRow()]
                });
                return;
            }

            const issue = issueMessages.first().content.trim().slice(0, 1000);

            // FINAL TICKET SUMMARY
            const finalEmbed = new EmbedBuilder()
                .setColor("#8B5CF6")
                .setAuthor({
                    name: "VYROXMC NETWORK SUPPORT",
                    iconURL: serverIcon || undefined
                })
                .setTitle("✅ Ticket Successfully Submitted")
                .setDescription(
                    "Your support request has been submitted!\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━"
                )
                .addFields(
                    {
                        name: "👤 Minecraft Username",
                        value: ign
                    },
                    {
                        name: "📝 Issue Description",
                        value: issue
                    },
                    {
                        name: "📌 Ticket Status",
                        value: "🟢 Waiting for Staff"
                    }
                )
                .addFields({
                    name: "💜 What's Next?",
                    value: "Please wait for our staff team to come and help you!"
                })
                .setThumbnail(serverIcon)
                .setFooter({
                    text: "VyroxMC Network • Thank you for your patience",
                    iconURL: serverIcon || undefined
                })
                .setTimestamp();

            await ticketChannel.send({
                content: `${user}`,
                embeds: [finalEmbed],
                components: [createCloseRow()]
            });

        } catch (error) {
            console.error("Ticket creation error:", error);

            await interaction.editReply(
                "❌ Couldn't create your ticket. Please contact staff."
            ).catch(() => {});
        }

        return;
    }

    // CLOSE TICKET BUTTON
    if (
        interaction.isButton() &&
        interaction.customId === "vyroxmc_close_ticket"
    ) {
        const channel = interaction.channel;

        const isSeniorAdmin = interaction.member.roles.cache.has(
            config.ROLES.SENIOR_ADMIN
        );

        const isAdminRole = interaction.member.roles.cache.has(
            config.ROLES.ADMIN
        );

        const hasAdministrator = interaction.memberPermissions.has(
            PermissionFlagsBits.Administrator
        );

        if (!isSeniorAdmin && !isAdminRole && !hasAdministrator) {
            return interaction.reply({
                content: "❌ Only Senior Admins and Admins can close tickets.",
                ephemeral: true
            });
        }

        if (!channel?.topic?.startsWith("vyroxmc-ticket:")) {
            return interaction.reply({
                content: "❌ This is not a valid ticket channel.",
                ephemeral: true
            });
        }

        await interaction.reply({
            content: "🔒 Ticket closed. This channel will be deleted in 3 seconds."
        });

        setTimeout(async () => {
            await channel.delete(
                "Ticket closed by an authorized administrator"
            ).catch(error => {
                console.error("Ticket deletion error:", error);
            });
        }, 3000);

        return;
    }

    // SLASH COMMANDS
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        return interaction.reply({
            content: "❌ This command is unavailable.",
            ephemeral: true
        });
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`Error in /${interaction.commandName}:`, error);

        const response = {
            content: "❌ Something went wrong while executing this command.",
            ephemeral: true
        };

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(response);
            } else {
                await interaction.reply(response);
            }
        } catch (replyError) {
            console.error("Could not send error message:", replyError);
        }
    }
});

client.on("error", error => {
    console.error("[DISCORD ERROR]", error);
});

process.on("unhandledRejection", error => {
    console.error("[UNHANDLED REJECTION]", error);
});

if (!process.env.TOKEN) {
    console.error("Missing TOKEN in environment variables!");
    process.exit(1);
}

client.login(process.env.TOKEN).catch(error => {
    console.error("Bot login failed:", error);
    process.exit(1);
});
