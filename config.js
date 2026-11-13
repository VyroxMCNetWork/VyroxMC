
module.exports = {

    // =================================
    //         VYROXMC CONFIG
    // =================================

    BOT_NAME: "VyroxMC",

    // Replace this with YOUR Discord user ID
    OWNER_ID: "YOUR_DISCORD_USER_ID",

    // =================================
    //          STAFF ROLE IDS
    // =================================

    ROLES: {
        SENIOR_ADMIN: "1568536379993104474",

        ADMIN: "1570497210842349578",

        MOD: "1568536537749127168",

        HELPER: "1570497798422667264"
    },

    // =================================
    //          COMMAND PERMISSIONS
    // =================================

    PERMISSIONS: {

        kick: [
            "SENIOR_ADMIN"
        ],

        ban: [
            "SENIOR_ADMIN"
        ],

        timeout: [
            "SENIOR_ADMIN",
            "ADMIN",
            "MOD"
        ],

        warn: [
            "SENIOR_ADMIN",
            "ADMIN",
            "MOD"
        ],

        ticket: [
            "SENIOR_ADMIN",
            "ADMIN",
            "MOD",
            "HELPER"
        ],

        announce: [
            "OWNER"
        ],

        setupTicket: [
            "DISCORD_ADMINISTRATOR"
        ]

    },

    // =================================
    //          SUPPORT SERVER
    // =================================

    SUPPORT_INVITE: "https://discord.gg/Sx9JDdH33X",

    // =================================
    //          BOT SETTINGS
    // =================================

    STATUS: "online",

    ACTIVITY: "VyroxMC Network"

};
