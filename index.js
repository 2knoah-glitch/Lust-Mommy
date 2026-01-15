const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
require('dotenv').config();

// Import all utility modules
const errorHandler = require('./utils/errorHandler');
const configValidator = require('./utils/configValidator');
const rateLimiter = require('./utils/rateLimiter');
const contentCache = require('./utils/contentCache');
const security = require('./utils/security');
const database = require('./utils/database');
const backupConfig = require('./utils/backupConfig');
const healthMonitor = require('./utils/healthMonitor');
const autoRestart = require('./utils/autoRestart');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// Enhanced configuration
const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    highRoles: process.env.HIGH_ROLES?.split(',') || [],
    superAdmins: process.env.SUPER_ADMINS?.split(',') || [],
    nsfwChannels: process.env.NSFW_CHANNELS?.split(',') || [],
    logChannel: process.env.LOG_CHANNEL,
    botName: process.env.BOT_NAME || 'Lust Mommy'
};

// Validate configuration
const configErrors = configValidator.validate(config);
if (configErrors.length > 0) {
    console.error('Configuration errors:', configErrors);
    process.exit(1);
}

// Start monitoring systems
backupConfig.autoBackup();

// Enhanced permission checks
function checkPermissions(interaction, commandType) {
    try {
        security.validateInteraction(interaction);
        
        switch (commandType) {
            case 'moderation':
                return config.highRoles.some(roleId => 
                    interaction.member.roles.cache.has(roleId));
            case 'massModeration':
                return config.superAdmins.includes(interaction.user.id);
            case 'nsfw':
                return config.nsfwChannels.includes(interaction.channel.id);
            default:
                return true;
        }
    } catch (error) {
        throw new Error(`Security check failed: ${error.message}`);
    }
}

// Enhanced command handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user, guild, channel } = interaction;

    try {
        // Security validation
        security.validateInteraction(interaction);
        
        // Rate limiting
        if (!rateLimiter.checkRateLimit(user.id, commandName)) {
            return interaction.reply({ content: '⏳ Rate limited', ephemeral: true });
        }

        // Log command usage
        await database.logCommand(guild.id, user.id, commandName);
        healthMonitor.incrementMetric('commandsProcessed');

        switch (commandName) {
            case 'kick':
            case 'ban':
                if (!checkPermissions(interaction, 'moderation')) {
                    return interaction.reply({ content: '❌ Insufficient permissions', ephemeral: true });
                }
                // ... command logic
                break;
                
            case 'masskick':
            case 'massban':
                if (!checkPermissions(interaction, 'massModeration')) {
                    return interaction.reply({ content: '❌ Super admin required', ephemeral: true });
                }
                // ... command logic
                break;
                
            case 'loli':
            case 'shotacon':
            case 'yaoi':
            case 'yuri':
            case 'hentai':
                if (!checkPermissions(interaction, 'nsfw')) {
                    return interaction.reply({ content: '❌ NSFW channel required', ephemeral: true });
                }
                rateLimiter.setCooldown(user.id, commandName, 10000);
                // ... content fetching logic
                break;
                
            case 'stats':
                const stats = await database.getCommandStats(guild.id);
                // ... display stats
                break;
                
            case 'health':
                if (!checkPermissions(interaction, 'massModeration')) {
                    return interaction.reply({ content: '❌ Super admin required', ephemeral: true });
                }
                const metrics = healthMonitor.getMetrics();
                // ... display health metrics
                break;
        }
    } catch (error) {
        healthMonitor.incrementMetric('errors');
        errorHandler.handleInteractionError(error, interaction);
    }
});

// Error handling with auto-restart
process.on('unhandledRejection', (error) => {
    healthMonitor.incrementMetric('errors');
    errorHandler.log(error, 'Unhandled Rejection');
    autoRestart.scheduleRestart();
});

process.on('uncaughtException', (error) => {
    healthMonitor.incrementMetric('errors');
    errorHandler.log(error, 'Uncaught Exception');
    autoRestart.scheduleRestart();
});

client.login(config.token);
