class ConfigValidator {
    validate(config) {
        const errors = [];
        
        if (!config.token || config.token === 'YOUR_BOT_TOKEN') {
            errors.push('DISCORD_TOKEN is missing or invalid');
        }
        
        if (!config.clientId || config.clientId === 'YOUR_CLIENT_ID') {
            errors.push('CLIENT_ID is missing or invalid');
        }
        
        if (!Array.isArray(config.highRoles) || config.highRoles.length === 0) {
            errors.push('HIGH_ROLES must be a non-empty array');
        }
        
        if (!Array.isArray(config.superAdmins) || config.superAdmins.length === 0) {
            errors.push('SUPER_ADMINS must be a non-empty array');
        }
        
        if (!Array.isArray(config.nsfwChannels) || config.nsfwChannels.length === 0) {
            errors.push('NSFW_CHANNELS must be a non-empty array');
        }
        
        return errors;
    }
    
    validateId(id, type) {
        if (!id || typeof id !== 'string') return false;
        return /^\d{17,20}$/.test(id);
    }
}

module.exports = new ConfigValidator();
