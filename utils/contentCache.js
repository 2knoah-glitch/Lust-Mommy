const NodeCache = require('node-cache');
const axios = require('axios');

class ContentCache {
    constructor() {
        this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minute cache
        this.queue = new Map();
    }

    async getContent(type, forceRefresh = false) {
        const cached = this.cache.get(type);
        
        if (cached && !forceRefresh) {
            return cached[Math.floor(Math.random() * cached.length)];
        }
        
        // Prevent duplicate requests
        if (this.queue.has(type)) {
            return this.queue.get(type);
        }
        
        const promise = this.fetchAndCache(type);
        this.queue.set(type, promise);
        
        const result = await promise;
        this.queue.delete(type);
        
        return result;
    }

    async fetchAndCache(type) {
        const sources = {
            loli: ['https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=loli&json=1'],
            shotacon: ['https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=shotacon&json=1'],
            yaoi: ['https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=yaoi&json=1'],
            yuri: ['https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=yuri&json=1'],
            hentai: ['https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=hentai&json=1']
        };

        const validSources = [];
        
        for (const source of sources[type]) {
            try {
                const response = await axios.get(source, { timeout: 8000 });
                if (response.data && response.data.length > 0) {
                    validSources.push(...response.data.map(post => post.file_url || post.source));
                }
            } catch (error) {
                continue;
            }
        }
        
        if (validSources.length > 0) {
            this.cache.set(type, validSources);
            return validSources[Math.floor(Math.random() * validSources.length)];
        }
        
        return null;
    }
}

module.exports = new ContentCache();
