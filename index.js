
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
    "1570727962863607908",
    "1570728049379647629",
    "1570728360064057484"
];

// VYROXMC LEVEL SYSTEM
const LEVEL_CHANNEL_ID = "1564678166767739012";
const LEVELS_FILE = path.join(__dirname, "levels.json");

// STAFF APPLICATION SETTINGS
const APPLICATION_SERVER_ID = "1570765318513754173";
const APPLICATION_REVIEW_CHANNEL_ID = "1570775196779020318";
const ACCEPTED_MODERATOR_ROLE_ID = "1570769043366088875";

const APPLICATION_REVIEWER_ROLES = [
    "1570768938629988402", // Senior Admin
    "1570765719606657094", // Founder & Owner
    "1570765803496939550", // Owner
    "1570774256814399518"  // Co-Owner
];

// Temporary application drafts stored while the bot is running
const applicationDrafts = new Map();

const APPLICATION_QUESTIONS = [
    {
        title: "Question 1 — Minecraft IGN",
        question: "What is your Minecraft username (IGN)?",
        arabic: "ما هو اسم المستخدم الخاص بك في ماينكرافت؟"
    },
    {
        title: "Question 2 — Age",
        question: "How old are you?",
        arabic: "كم عمرك؟"
    },
    {
        title: "Question 3 — Previous Experience",
        question: "Have you ever been a staff member or administrator on any Minecraft server? If yes, please state the server name and your previous position.",
        arabic: "هل سبق لك أن كنت عضواً في طاقم الإدارة أو مسؤولاً في أي سيرفر ماينكرافت؟ إذا كانت إجابتك نعم، يرجى ذكر اسم السيرفر ومنصبك السابق."
    },
    {
        title: "Question 4 — Languages",
        question: "Which languages do you speak? Please list all languages you know. Knowing English is mandatory.",
        arabic: "ما هي اللغات التي تتحدثها؟ يرجى ذكر جميع اللغات التي تعرفها. معرفة اللغة الإنجليزية إلزامية."
    },
    {
        title: "Question 5 — Why Should We Choose You?",
        question: "Why should we choose you for the VyroxMC Staff Team? What makes you suitable for this position?",
        arabic: "لماذا يجب علينا اختيارك لتكون ضمن فريق إدارة VyroxMC؟ وما الذي يجعلك مناسباً لهذا المنصب؟"
    }
];

// LEVEL FUNCTIONS
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

// APPLICATION PERMISSION FUNCTIONS
function isApplicationReviewer(interaction) {
    if (
        interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return true;
    }

    const roles = interaction.member?.roles?.cache;

    if (!roles) return false;

    return APPLICATION_REVIEWER_ROLES.some(roleId =>
        roles.has(roleId)
    );
}

function makeApplicationReviewEmbed(user, answers) {
    return new EmbedBuilder()
        .setColor("#8B5CF6")
        .setAuthor({
            name: "VYROXMC NETWORK — STAFF APPLICATIONS"
        })
        .setTitle("📋 New Moderator Application")
        .setDescription(
            `A new staff application has been submitted by ${user}.\n\n` +
            "Please review all answers carefully before making a decision."
        )
        .addFields(
            {
                name: "👤 Applicant",
                value: `${user.tag}\n${user.id}`,
                inline: false
            },
            {
                name: "1. Minecraft IGN / اسم المستخدم",
                value: answers[0].slice(0, 1024)
            },
            {
                name: "2. Age / العمر",
                value: answers[1].slice(0, 1024)
            },
            {
                name: "3. Previous Experience / الخبرة السابقة",
                value: answers[2].slice(0, 1024)
            },
            {
                name: "4. Languages / اللغات",
                value: answers[3].slice(0, 1024)
            },
            {
                name: "5. Why Choose You? / لماذا نختارك؟",
                value: answers[4].slice(0, 1024)
            }
        )
        .setFooter({
            text: "VyroxMC Network • Staff Recruitment"
        })
        .setTimestamp();
}

// LOAD COMMANDS
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

// BOT READY
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

    // Application answers do not count toward chat levels
    if (message.channel.topic?.startsWith("vyroxmc-application:")) {
        return;
    }

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

// TICKET CLOSE BUTTON
function createCloseRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("vyroxmc_close_ticket")
            .setLabel("Close Ticket")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
    );
}

// INTERACTION HANDLER
client.on("interactionCreate", async interaction => {

    // ==========================================
    // CREATE SUPPORT TICKET
    // ==========================================
    if (
        interaction.isButton() &&
        interaction.customId === "vyroxmc_create_ticket"
    ) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = interaction.guild;
            const user = interaction.user;

            if (!guild) {
                return interaction.editReply(
                    "❌ This only works inside the server."
                );
            }

            const existingTicket = guild.channels.cache.find(channel =>
                channel.topic === `vyroxmc-ticket:${user.id}`
            );

            if (existingTicket) {
                return interaction.editReply(
                    `❌ You already have an open ticket: ${existingTicket}`
                );
            }

            let staffRoles;

            if (guild.id === OTHER_TICKET_SERVER_ID) {
                staffRoles = OTHER_SERVER_STAFF_ROLES;
            } else {
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
                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks
                    ]
                },
                ...staffRoles
                    .filter(roleId => guild.roles.cache.has(roleId))
                    .map(roleId => ({
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
                .setFooter({
                    text: "VyroxMC Network • Support Department",
                    iconURL: serverIcon || undefined
                })
                .setTimestamp();

            if (serverIcon) {
                welcomeEmbed.setThumbnail(serverIcon);
            }

            await ticketChannel.send({
                content: `${user}`,
                embeds: [welcomeEmbed]
            });

            await interaction.editReply(
                `✅ Your private ticket has been created: ${ticketChannel}`
            );

            // ASK FOR IGN
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
                    },
                    {
                        name: "💜 What's Next?",
                        value: "Please wait for our staff team to come and help you!"
                    }
                )
                .setFooter({
                    text: "VyroxMC Network • Thank you for your patience",
                    iconURL: serverIcon || undefined
                })
                .setTimestamp();

            if (serverIcon) {
                finalEmbed.setThumbnail(serverIcon);
            }

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

    // ==========================================
    // CLOSE SUPPORT TICKET
    // ==========================================
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

    // ==========================================
    // APPLY FOR VYROXMC STAFF
    // ==========================================
    if (
        interaction.isButton() &&
        interaction.customId === "vyroxmc_staff_apply"
    ) {
        if (interaction.guildId !== APPLICATION_SERVER_ID) {
            return interaction.reply({
                content: "❌ Staff applications are only available in the VyroxMC application server.",
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const user = interaction.user;

        const existingApplication = guild.channels.cache.find(channel =>
            channel.topic === `vyroxmc-application:${user.id}`
        );

        if (existingApplication) {
            return interaction.editReply(
                `❌ You already have an open application: ${existingApplication}`
            );
        }

        let applicationChannel;

        try {
            const reviewerRoles = APPLICATION_REVIEWER_ROLES
                .filter(roleId => guild.roles.cache.has(roleId));

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
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ManageChannels
                    ]
                },
                ...reviewerRoles.map(roleId => ({
                    id: roleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }))
            ];

            const safeName = user.username
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "")
                .slice(0, 18) || "user";

            applicationChannel = await guild.channels.create({
                name: `application-${safeName}`,
                type: ChannelType.GuildText,
                topic: `vyroxmc-application:${user.id}`,
                permissionOverwrites
            });

            await interaction.editReply(
                `✅ Your private application has been created: ${applicationChannel}`
            );

            const introEmbed = new EmbedBuilder()
                .setColor("#8B5CF6")
                .setTitle("🌹 VYROXMC NETWORK — STAFF APPLICATION")
                .setDescription(
                    `Welcome ${user}!\n\n` +
                    "Thank you for your interest in joining the **VyroxMC Staff Team**.\n\n" +
                    "You will be asked **5 questions**, one at a time.\n" +
                    "Please answer each question honestly and in detail.\n\n" +
                    "🇬🇧 English is mandatory.\n" +
                    "🇸🇦 اللغة الإنجليزية إلزامية.\n\n" +
                    "⏳ You have 10 minutes to answer each question."
                )
                .setFooter({
                    text: "VyroxMC Network • Staff Recruitment"
                })
                .setTimestamp();

            await applicationChannel.send({
                content: `${user}`,
                embeds: [introEmbed]
            });

            const answers = [];

            for (let i = 0; i < APPLICATION_QUESTIONS.length; i++) {
                const question = APPLICATION_QUESTIONS[i];

                const questionEmbed = new EmbedBuilder()
                    .setColor("#8B5CF6")
                    .setTitle(`📝 ${question.title}`)
                    .setDescription(
                        `**🇬🇧 English:**\n${question.question}\n\n` +
                        `**🇸🇦 العربية:**\n${question.arabic}\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━\n` +
                        `**Question ${i + 1} of 5**\n` +
                        "Please type your answer below."
                    );

                await applicationChannel.send({
                    embeds: [questionEmbed]
                });

                const collected = await applicationChannel.awaitMessages({
                    filter: message =>
                        message.author.id === user.id &&
                        !message.author.bot,
                    max: 1,
                    time: 600000
                });

                if (collected.size === 0) {
                    await applicationChannel.send({
                        content:
                            `${user} Your application timed out because you did not answer in time. ` +
                            "Please contact staff if you still need help."
                    });
                    return;
                }

                const answer = collected.first().content.trim();

                if (!answer) {
                    await applicationChannel.send(
                        "❌ Please send a text answer."
                    );
                    i--;
                    continue;
                }

                if (i === 3 && !/english|إنجليزي|انجليزي|الإنجليزية|الانجليزية/i.test(answer)) {
                    await applicationChannel.send(
                        "❌ English is mandatory. Please answer again and include English in your languages.\n" +
                        "❌ اللغة الإنجليزية إلزامية. يرجى إعادة الإجابة وذكر اللغة الإنجليزية."
                    );
                    i--;
                    continue;
                }

                answers.push(answer.slice(0, 1000));

                await applicationChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#22C55E")
                            .setDescription(`✅ **Answer ${i + 1} saved!**`)
                    ]
                });
            }

            applicationDrafts.set(applicationChannel.id, {
                applicantId: user.id,
                answers,
                submitted: false
            });

            const readyEmbed = new EmbedBuilder()
                .setColor("#8B5CF6")
                .setTitle("✅ Application Questions Completed")
                .setDescription(
                    `${user}, you have answered all 5 questions!\n\n` +
                    "Please check that your answers are correct.\n\n" +
                    "When you are ready, click **Submit Application** below.\n\n" +
                    "After submitting, your application will be sent to the VyroxMC Management Team."
                )
                .setFooter({
                    text: "VyroxMC Network • Staff Recruitment"
                });

            const submitRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("vyroxmc_staff_submit")
                    .setLabel("Submit Application")
                    .setEmoji("📨")
                    .setStyle(ButtonStyle.Success)
            );

            await applicationChannel.send({
                content: `${user}`,
                embeds: [readyEmbed],
                components: [submitRow]
            });

        } catch (error) {
            console.error("Staff application creation error:", error);

            await interaction.editReply(
                applicationChannel
                    ? `⚠️ Your application channel was created: ${applicationChannel}. Please contact staff because setup did not finish.`
                    : "❌ Could not create your application. Please contact staff."
            ).catch(() => {});
        }

        return;
    }

    // ==========================================
    // SUBMIT STAFF APPLICATION
    // ==========================================
    if (
        interaction.isButton() &&
        interaction.customId === "vyroxmc_staff_submit"
    ) {
        const channel = interaction.channel;
        const user = interaction.user;

        if (interaction.guildId !== APPLICATION_SERVER_ID) {
            return interaction.reply({
                content: "❌ This button only works in the application server.",
                ephemeral: true
            });
        }

        if (!channel?.topic?.startsWith("vyroxmc-application:")) {
            return interaction.reply({
                content: "❌ This is not a valid application channel.",
                ephemeral: true
            });
        }

        const applicantId = channel.topic.split(":")[1];

        if (user.id !== applicantId) {
            return interaction.reply({
                content: "❌ Only the applicant can submit this application.",
                ephemeral: true
            });
        }

        const draft = applicationDrafts.get(channel.id);

        if (!draft || draft.applicantId !== user.id) {
            return interaction.reply({
                content: "❌ Application answers could not be found. Please contact staff.",
                ephemeral: true
            });
        }

        if (draft.submitted) {
            return interaction.reply({
                content: "❌ This application has already been submitted.",
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const reviewChannel = await interaction.guild.channels
                .fetch(APPLICATION_REVIEW_CHANNEL_ID)
                .catch(() => null);

            if (!reviewChannel || !reviewChannel.isTextBased()) {
                return interaction.editReply(
                    "❌ The application review channel could not be found. Please contact staff."
                );
            }

            const reviewEmbed = makeApplicationReviewEmbed(
                user,
                draft.answers
            );

            const reviewButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`vyroxmc_application_accept:${user.id}`)
                    .setLabel("Accept")
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`vyroxmc_application_decline:${user.id}`)
                    .setLabel("Decline")
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger)
            );

            await reviewChannel.send({
                content: `📥 **New Staff Application** — ${user}`,
                embeds: [reviewEmbed],
                components: [reviewButtons]
            });

            draft.submitted = true;
            applicationDrafts.set(channel.id, draft);

            await channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#22C55E")
                        .setTitle("📨 Application Submitted Successfully")
                        .setDescription(
                            "Your application has been sent to the VyroxMC Management Team.\n\n" +
                            "Please wait while your application is reviewed.\n\n" +
                            "You will be notified when a decision has been made."
                        )
                        .setFooter({
                            text: "VyroxMC Network • Thank you for applying"
                        })
                        .setTimestamp()
                ],
                components: []
            });

            await interaction.editReply(
                "✅ Your application has been submitted successfully!"
            );

        } catch (error) {
            console.error("Staff application submission error:", error);

            await interaction.editReply(
                "❌ Could not submit your application. Please try again or contact staff."
            ).catch(() => {});
        }

        return;
    }

    // ==========================================
    // ACCEPT OR DECLINE STAFF APPLICATION
    // ==========================================
    if (
        interaction.isButton() &&
        (
            interaction.customId.startsWith("vyroxmc_application_accept:") ||
            interaction.customId.startsWith("vyroxmc_application_decline:")
        )
    ) {
        if (interaction.guildId !== APPLICATION_SERVER_ID) {
            return interaction.reply({
                content: "❌ This only works in the application server.",
                ephemeral: true
            });
        }

        if (!isApplicationReviewer(interaction)) {
            return interaction.reply({
                content: "❌ You are not authorized to review staff applications.",
                ephemeral: true
            });
        }

        const [action, applicantId] = interaction.customId.split(":");

        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;

        try {
            const applicant = await guild.members
                .fetch(applicantId)
                .catch(() => null);

            if (!applicant) {
                return interaction.editReply(
                    "❌ This applicant is no longer in the server."
                );
            }

            const isAccept = action === "vyroxmc_application_accept";

            if (isAccept) {
                const moderatorRole = await guild.roles
                    .fetch(ACCEPTED_MODERATOR_ROLE_ID)
                    .catch(() => null);

                if (!moderatorRole) {
                    return interaction.editReply(
                        "❌ The Moderator role could not be found."
                    );
                }

                await applicant.roles.add(
                    moderatorRole,
                    `Staff application accepted by ${interaction.user.tag}`
                );
            }

            const decisionEmbed = EmbedBuilder.from(
                interaction.message.embeds[0]
            )
                .setColor(isAccept ? "#22C55E" : "#EF4444")
                .addFields({
                    name: "📌 Application Decision",
                    value: isAccept
                        ? `✅ Accepted by ${interaction.user}`
                        : `❌ Declined by ${interaction.user}`
                });

            const disabledButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("vyroxmc_application_decision_done")
                    .setLabel(isAccept ? "Accepted" : "Declined")
                    .setStyle(isAccept ? ButtonStyle.Success : ButtonStyle.Danger)
                    .setDisabled(true)
            );

            await interaction.message.edit({
                embeds: [decisionEmbed],
                components: [disabledButtons]
            });

            const applicationChannel = guild.channels.cache.find(channel =>
                channel.topic === `vyroxmc-application:${applicantId}`
            );

            if (applicationChannel) {
                const resultEmbed = new EmbedBuilder()
                    .setColor(isAccept ? "#22C55E" : "#EF4444")
                    .setTitle(
                        isAccept
                            ? "🎉 Your Application Has Been Accepted!"
                            : "Application Update"
                    )
                    .setDescription(
                        isAccept
                            ? "Congratulations! Your application to join the **VyroxMC Staff Team** has been accepted.\n\n" +
                              "You have been given the Moderator role. Welcome to the team!"
                            : "Thank you for applying to the **VyroxMC Staff Team**.\n\n" +
                              "Unfortunately, your application has not been accepted at this time.\n\n" +
                              "We appreciate your interest in VyroxMC."
                    )
                    .setFooter({
                        text: "VyroxMC Network • Staff Recruitment"
                    })
                    .setTimestamp();

                await applicationChannel.send({
                    content: `${applicant}`,
                    embeds: [resultEmbed]
                }).catch(console.error);
            }

            await applicant.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(isAccept ? "#22C55E" : "#EF4444")
                        .setTitle(
                            isAccept
                                ? "🎉 VyroxMC Staff Application Accepted"
                                : "VyroxMC Staff Application Update"
                        )
                        .setDescription(
                            isAccept
                                ? "Congratulations! Your application has been accepted. You have been given the Moderator role in the VyroxMC application server."
                                : "Thank you for applying. Unfortunately, your application has not been accepted at this time."
                        )
                        .setTimestamp()
                ]
            }).catch(() => {});

            await interaction.editReply(
                isAccept
                    ? `✅ ${applicant.user.tag} has been accepted and given the Moderator role.`
                    : `❌ ${applicant.user.tag}'s application has been declined.`
            );

        } catch (error) {
            console.error("Application decision error:", error);

            await interaction.editReply(
                "❌ Something went wrong while processing this application."
            ).catch(() => {});
        }

        return;
    }

    // ==========================================
    // SLASH COMMANDS
    // ==========================================
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
