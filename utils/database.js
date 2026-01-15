const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database('./data/bot.db');
        this.init();
    }

    init() {
        this.db.serialize(() => {
            // Server settings table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS server_settings (
                    guild_id TEXT PRIMARY KEY,
                    nsfw_channels TEXT,
                    log_channel TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Command usage statistics
            this.db.run(`
                CREATE TABLE IF NOT EXISTS command_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    guild_id TEXT,
                    user_id TEXT,
                    command TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Blacklist table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS blacklist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE,
                    guild_id TEXT UNIQUE,
                    reason TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Bot settings table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS bot_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        });
    }

    async logCommand(guildId, userId, command) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO command_stats (guild_id, user_id, command) VALUES (?, ?, ?)',
                [guildId, userId, command],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getCommandStats(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT command, COUNT(*) as count FROM command_stats WHERE guild_id = ? GROUP BY command',
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}

module.exports = new Database();
