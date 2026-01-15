const fs = require('fs');
const path = require('path');

class BackupConfig {
    constructor() {
        this.backupDir = './backups';
        this.ensureBackupDir();
    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.backupDir, `config-backup-${timestamp}.json`);
        
        const backupData = {
            env: process.env,
            timestamp: new Date().toISOString(),
            version: require('../package.json').version
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        return backupFile;
    }

    restoreBackup(backupFile) {
        if (!fs.existsSync(backupFile)) {
            throw new Error('Backup file not found');
        }

        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        // Implement restore logic based on backup structure
        return backupData;
    }

    autoBackup() {
        // Auto backup every 24 hours
        setInterval(() => {
            this.createBackup();
            console.log('Auto-backup completed');
        }, 24 * 60 * 60 * 1000);
    }
}

module.exports = new BackupConfig();
