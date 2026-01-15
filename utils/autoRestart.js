class AutoRestart {
    constructor() {
        this.restartCount = 0;
        this.maxRestarts = 5;
        this.restartWindow = 60000; // 1 minute window
        this.restartTimes = [];
    }

    shouldRestart() {
        const now = Date.now();
        // Remove old restart times
        this.restartTimes = this.restartTimes.filter(time => now - time < this.restartWindow);
        
        if (this.restartTimes.length >= this.maxRestarts) {
            console.error('Too many restarts, exiting...');
            process.exit(1);
        }
        
        this.restartTimes.push(now);
        return true;
    }

    scheduleRestart(delayMs = 5000) {
        if (this.shouldRestart()) {
            console.log(`Auto-restarting in ${delayMs}ms...`);
            setTimeout(() => {
                process.exit(0);
            }, delayMs);
        }
    }
}

module.exports = new AutoRestart();
