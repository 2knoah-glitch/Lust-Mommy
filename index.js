const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
require('dotenv').config();

// Import utility modules
const errorHandler = require('./utils/errorHandler');
const configValidator = require('./utils/configValidator');
const rateLimiter = require('./utils/rateLimiter');
const contentCache = require('./utils/contentCache');

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

// Validate configuration on startup
const configErrors = configValidator.validate(config);
if (configErrors.length > 0) {
    console.error('❌ Configuration errors:', configErrors);
    process.exit(1);
}

// Permission checks with enhanced validation
function hasHighRole(member) {
    return config.highRoles.some(roleId => configValidator.validateId(roleId, 'role') && 
        member.roles.cache.has(roleId));
}

function isSuperAdmin(userId) {
    return config.superAdmins.some(adminId => configValidator.validateId(adminId, 'user') && 
        adminId === userId);
}

function isNSFWChannel(channelId) {
    return config.nsfwChannels.some(channel => configValidator.validateId(channel, 'channel') && 
        channel === channelId);
}

// Enhanced welcome message
client.on('guildCreate', async (guild) => {
    try {
        const channel = guild.systemChannel || 
            guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
        
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(0xFF00FF)
            .setTitle(`🏠 ${config.botName} has arrived!`)
            .setDescription("aww who's mommy's good map or who's mommy's good aam😈")
            .addFields(
                { name: '🔧 Moderation', value: '`/kick`, `/ban`, `/masskick`, `/massban`' },
                { name: '🎨 NSFW Content', value: '`/loli`, `/shotacon`, `/yaoi`, `/yuri`, `/hentai`' },
                { name: 'ℹ️ Utility', value: '`/serverinfo`, `/userinfo`, `/ping`, `/help`' }
            )
            .setFooter({ text: `Bot ID: ${client.user.id}` })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch (error) {
        errorHandler.log(error, 'Guild Create');
    }
});

// Enhanced command handling with rate limiting and error handling
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user, member } = interaction;

    try {
        // Rate limiting check
        if (!rateLimiter.checkRateLimit(user.id, commandName)) {
            return interaction.reply({ 
                content: '⏳ Command rate limited. Try again later.', 
                ephemeral: true 
            });
        }

        // Cooldown check for NSFW commands
        const cooldown = rateLimiter.checkCooldown(user.id, commandName);
        if (cooldown) {
            return interaction.reply({ 
                content: `⏰ Command on cooldown. Wait ${cooldown} seconds.`, 
                ephemeral: true 
            });
        }

        switch (commandName) {
            case 'kick':
                if (!hasHighRole(member)) {
                    return interaction.reply({ content: '❌ High role required', ephemeral: true });
                }
                const kickUser = interaction.options.getUser('user');
                await interaction.guild.members.kick(kickUser);
                await interaction.reply(`✅ Kicked ${kickUser.tag}`);
                break;

            case 'ban':
                if (!hasHighRole(member)) {
                    return interaction.reply({ content: '❌ High role required', ephemeral: true });
                }
                const banUser = interaction.options.getUser('user');
                await interaction.guild.members.ban(banUser);
                await interaction.reply(`✅ Banned ${banUser.tag}`);
                break;

            case 'masskick':
                if (!isSuperAdmin(user.id)) {
                    return interaction.reply({ content: '❌ Super admin only', ephemeral: true });
                }
                const massKickRole = interaction.options.getRole('role');
                const members = await interaction.guild.members.fetch();
                const toKick = members.filter(m => m.roles.cache.has(massKickRole.id));
                toKick.forEach(m => m.kick().catch(() => {}));
                await interaction.reply(`✅ Kicked ${toKick.size} members`);
                break;

            case 'massban':
                if (!isSuperAdmin(user.id)) {
                    return interaction.reply({ content: '❌ Super admin only', ephemeral: true });
                }
                const ids = interaction.options.getString('ids').split(',').map(id => id.trim());
                for (const id of ids.slice(0, 25)) { // Limit to 25
                    await interaction.guild.members.ban(id).catch(() => {});
                }
                await interaction.reply(`✅ Banned ${ids.length} users`);
                break;

            case 'loli':
            case 'shotacon':
            case 'yaoi':
            case 'yuri':
            case 'hentai':
                if (!isNSFWChannel(interaction.channel.id)) {
                    return interaction.reply({ content: '❌ NSFW channels only', ephemeral: true });
                }
                // Set cooldown for NSFW commands
                rateLimiter.setCooldown(user.id, commandName, 10000); // 10 second cooldown
                
                const content = await contentCache.getContent(commandName);
                if (content) {
                    await interaction.reply(content);
                } else {
                    await interaction.reply('❌ Content unavailable');
                }
                break;

            case 'ping':
                await interaction.reply('🏓 Pong!');
                break;

            case 'serverinfo':
                const serverEmbed = new EmbedBuilder()
                    .setTitle('Server Information')
                    .addFields(
                        { name: 'Members', value: interaction.guild.memberCount.toString(), inline: true },
                        { name: 'Channels', value: interaction.guild.channels.cache.size.toString(), inline: true },
                        { name: 'Roles', value: interaction.guild.roles.cache.size.toString(), inline: true }
                    );
                await interaction.reply({ embeds: [serverEmbed] });
                break;

            case 'help':
                const helpEmbed = new EmbedBuilder()
                    .setTitle(`${config.botName} Help`)
                    .setDescription('All available commands')
                    .addFields(
                        { name: 'Moderation', value: '`/kick`, `/ban`, `/masskick`, `/massban`' },
                        { name: 'NSFW', value: '`/loli`, `/shotacon`, `/yaoi`, `/yuri`, `/hentai`' },
                        { name: 'Utility', value: '`/ping`, `/serverinfo`, `/userinfo`, `/help`' }
                    );
                await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
                break;
        }
    } catch (error) {
        errorHandler.handleInteractionError(error, interaction);
    }
});

client.once('ready', () => {
    console.log(`✅ ${config.botName} is online!`);
    client.user.setActivity('mommy\'s commands', { type: ActivityType.Watching });
});

// Error handling
client.on('error', errorHandler.log);
process.on('unhandledRejection', errorHandler.log);

client.login(config.token);
