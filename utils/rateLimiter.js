class RateLimiter {
    constructor() {
        this.limits = new Map();
        this.cooldowns = new Map();
    }

    // Rate limit by user per command
    checkRateLimit(userId, command, limit = 5, windowMs = 60000) {
        const key = `${userId}:${command}`;
        const now = Date.now();
        
        if (!this.limits.has(key)) {
            this.limits.set(key, []);
        }
        
        const timestamps = this.limits.get(key);
        const windowStart = now - windowMs;
        
        // Remove old timestamps
        while (timestamps.length && timestamps[0] < windowStart) {
            timestamps.shift();
        }
        
        // Check if over limit
        if (timestamps.length >= limit) {
            return false;
        }
        
        timestamps.push(now);
        return true;
    }

    // Cooldown system for specific users/commands
    setCooldown(userId, command, durationMs) {
        const key = `${userId}:${command}`;
        this.cooldowns.set(key, Date.now() + durationMs);
    }

    checkCooldown(userId, command) {
        const key = `${userId}:${command}`;
        const cooldownEnd = this.cooldowns.get(key);
        
        if (!cooldownEnd) return null;
        
        if (Date.now() >= cooldownEnd) {
            this.cooldowns.delete(key);
            return null;
        }
        
        return Math.ceil((cooldownEnd - Date.now()) / 1000);
    }
}

module.exports = new RateLimiter();
