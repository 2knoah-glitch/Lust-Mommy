class HealthMonitor {
    constructor() {
        this.metrics = {
            commandsProcessed: 0,
            errors: 0,
            apiCalls: 0,
            uptime: 0
        };
        
        this.startTime = Date.now();
        this.startMonitoring();
    }

    incrementMetric(metric) {
        this.metrics[metric]++;
    }

    getMetrics() {
        this.metrics.uptime = Date.now() - this.startTime;
        return {
            ...this.metrics,
            uptime: this.formatUptime(this.metrics.uptime),
            commandSuccessRate: this.metrics.commandsProcessed > 0 ? 
                ((this.metrics.commandsProcessed - this.metrics.errors) / this.metrics.commandsProcessed * 100).toFixed(2) + '%' : '0%'
        };
    }

    formatUptime(ms) {
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        return `${days}d ${hours}h ${minutes}m`;
    }

    startMonitoring() {
        setInterval(() => {
            const metrics = this.getMetrics();
            console.log('Health Metrics:', metrics);
        }, 300000); // Log every 5 minutes
    }
}

module.exports = new HealthMonitor();
