const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// Configuration from environment
const config = {
    token: process.env.DISCORD_TOKEN,
    highRoles: process.env.HIGH_ROLES?.split(',') || [],
    superAdmins: process.env.SUPER_ADMINS?.split(',') || [],
    nsfwChannels: process.env.NSFW_CHANNELS?.split(',') || [],
    logChannel: process.env.LOG_CHANNEL
};

// Content sources with multiple APIs
const contentSources = {
    loli: [
        'https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=loli&json=1',
        'https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=loli&json=1',
        'https://yande.re/post.json?tags=loli',
        'https://danbooru.donmai.us/posts.json?tags=loli'
    ],
    shotacon: [
        'https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=shotacon&json=1',
        'https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=shotacon&json=1',
        'https://yande.re/post.json?tags=shotacon'
    ],
    yaoi: [
        'https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=yaoi&json=1',
        'https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=yaoi&json=1',
        'https://yande.re/post.json?tags=yaoi'
    ],
    yuri: [
        'https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=yuri&json=1',
        'https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=yuri&json=1',
        'https://yande.re/post.json?tags=yuri'
    ],
    hentai: [
        'https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=hentai&json=1',
        'https://gelbooru.com/index.php?page=dapi&s=post&q=index&tags=hentai&json=1',
        'https://yande.re/post.json?tags=hentai'
    ]
};

// Content fetching with fallback
async function fetchContent(type) {
    const sources = contentSources[type];
    if (!sources) return null;
    
    for (const source of sources.sort(() => Math.random() - 0.5)) {
        try {
            const response = await axios.get(source, { timeout: 5000 });
            if (response.data && response.data.length > 0) {
                const post = response.data[Math.floor(Math.random() * response.data.length)];
                return post.file_url || post.source || post.image;
            }
        } catch (error) {
            continue;
        }
    }
    return null;
}

// Permission checks
function hasHighRole(member) {
    return member.roles.cache.some(role => config.highRoles.includes(role.id));
}

function isSuperAdmin(userId) {
    return config.superAdmins.includes(userId);
}

function isNSFWChannel(channelId) {
    return config.nsfwChannels.includes(channelId);
}

// Welcome message
client.on('guildCreate', (guild) => {
    const channel = guild.systemChannel || guild.channels.cache.find(ch => ch.type === 0);
    if (!channel) return;
    
    const embed = new EmbedBuilder()
        .setColor(0xFF00FF)
        .setTitle("🏠 Lust Mommy has arrived!")
        .setDescription("aww who's mommy's good map or who's mommy's good aam😈")
        .addFields(
            { name: 'Moderation Commands', value: '`/kick`, `/ban`, `/masskick`, `/massban`' },
            { name: 'NSFW Commands', value: '`/loli`, `/shotacon`, `/yaoi`, `/yuri`, `/hentai`' },
            { name: 'Utility Commands', value: '`/serverinfo`, `/userinfo`, `/ping`' }
        )
        .setTimestamp();
    
    channel.send({ embeds: [embed] });
});

// Command handling
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        switch (interaction.commandName) {
            case 'kick':
                if (!hasHighRole(interaction.member)) {
                    return interaction.reply({ content: '❌ Insufficient permissions', ephemeral: true });
                }
                const kickUser = interaction.options.getUser('user');
                await interaction.guild.members.kick(kickUser);
                interaction.reply(`✅ Kicked ${kickUser.tag}`);
                break;

            case 'ban':
                if (!hasHighRole(interaction.member)) {
                    return interaction.reply({ content: '❌ Insufficient permissions', ephemeral: true });
                }
                const banUser = interaction.options.getUser('user');
                await interaction.guild.members.ban(banUser);
                interaction.reply(`✅ Banned ${banUser.tag}`);
                break;

            case 'masskick':
                if (!isSuperAdmin(interaction.user.id)) {
                    return interaction.reply({ content: '❌ Super admin only', ephemeral: true });
                }
                const massKickRole = interaction.options.getRole('role');
                const members = await interaction.guild.members.fetch();
                const toKick = members.filter(m => m.roles.cache.has(massKickRole.id));
                toKick.forEach(m => m.kick());
                interaction.reply(`✅ Kicked ${toKick.size} members`);
                break;

            case 'massban':
                if (!isSuperAdmin(interaction.user.id)) {
                    return interaction.reply({ content: '❌ Super admin only', ephemeral: true });
                }
                const ids = interaction.options.getString('ids').split(',').map(id => id.trim());
                for (const id of ids) {
                    await interaction.guild.members.ban(id);
                }
                interaction.reply(`✅ Banned ${ids.length} users`);
                break;

            case 'loli':
            case 'shotacon':
            case 'yaoi':
            case 'yuri':
            case 'hentai':
                if (!isNSFWChannel(interaction.channel.id)) {
                    return interaction.reply({ content: '❌ NSFW commands only in NSFW channels', ephemeral: true });
                }
                const content = await fetchContent(interaction.commandName);
                if (content) {
                    interaction.reply(content);
                } else {
                    interaction.reply('❌ Failed to fetch content');
                }
                break;

            case 'ping':
                interaction.reply('🏓 Pong!');
                break;

            case 'serverinfo':
                const embed = new EmbedBuilder()
                    .setTitle('Server Info')
                    .addFields(
                        { name: 'Members', value: interaction.guild.memberCount.toString(), inline: true },
                        { name: 'Channels', value: interaction.guild.channels.cache.size.toString(), inline: true },
                        { name: 'Created', value: interaction.guild.createdAt.toDateString(), inline: true }
                    );
                interaction.reply({ embeds: [embed] });
                break;
        }
    } catch (error) {
        interaction.reply('❌ Command failed');
    }
});

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online!`);
    client.user.setActivity('mommy\'s commands', { type: ActivityType.Watching });
});

client.login(config.token);
