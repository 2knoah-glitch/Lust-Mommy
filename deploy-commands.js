const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'kick',
        description: 'Kick a user',
        options: [{
            name: 'user',
            type: 6,
            description: 'User to kick',
            required: true
        }]
    },
    {
        name: 'ban',
        description: 'Ban a user',
        options: [{
            name: 'user',
            type: 6,
            description: 'User to ban',
            required: true
        }]
    },
    {
        name: 'masskick',
        description: 'Mass kick by role',
        options: [{
            name: 'role',
            type: 8,
            description: 'Role to mass kick',
            required: true
        }]
    },
    {
        name: 'massban',
        description: 'Mass ban by IDs',
        options: [{
            name: 'ids',
            type: 3,
            description: 'Comma-separated user IDs',
            required: true
        }]
    },
    {
        name: 'loli',
        description: 'Loli content'
    },
    {
        name: 'shotacon',
        description: 'Shotacon content'
    },
    {
        name: 'yaoi',
        description: 'Yaoi content'
    },
    {
        name: 'yuri',
        description: 'Yuri content'
    },
    {
        name: 'hentai',
        description: 'Hentai content'
    },
    {
        name: 'ping',
        description: 'Check bot latency'
    },
    {
        name: 'serverinfo',
        description: 'Get server information'
    },
    {
        name: 'userinfo',
        description: 'Get user information',
        options: [{
            name: 'user',
            type: 6,
            description: 'User to inspect',
            required: false
        }]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Commands deployed!');
    } catch (error) {
        console.error('❌ Command deployment failed:', error);
    }
})();
