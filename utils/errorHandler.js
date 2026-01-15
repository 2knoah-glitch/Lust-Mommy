const fs = require('fs');
const path = require('path');

class ErrorHandler {
    constructor() {
        this.logFile = path.join(__dirname, '../logs/error.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(error, context = '') {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ${context}: ${error.stack || error}\n`;
        
        console.error(errorMessage);
        fs.appendFileSync(this.logFile, errorMessage);
    }

    handleInteractionError(error, interaction) {
        this.log(error, `Interaction: ${interaction.commandName}`);
        if (!interaction.replied) {
            interaction.reply({ content: '❌ An error occurred', ephemeral: true }).catch(() => {});
        }
    }

    handleAPIError(error, source) {
        this.log(error, `API: ${source}`);
    }
}

module.exports = new ErrorHandler();
