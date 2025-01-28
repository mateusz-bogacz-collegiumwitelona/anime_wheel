const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const { searchAnime: searchShinden } = require('shinden-pl-api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const rateLimiter = {
    tokens: 10,
    lastRefill: Date.now(),
    refillRate: 1000, 
    maxTokens: 10,
    
    async getToken() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const refillTokens = Math.floor(timePassed / this.refillRate);
        
        if (refillTokens > 0) {
            this.tokens = Math.min(this.maxTokens, this.tokens + refillTokens);
            this.lastRefill = now;
        }
        
        if (this.tokens > 0) {
            this.tokens--;
            return true;
        }
        
        return false;
    }
};

async function retry(fn, retries = 3, initialDelay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            while (!(await rateLimiter.getToken())) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            
            const delay = initialDelay * Math.pow(2, i);
            console.log(`Próba ${i + 1} nieudana, ponawiam za ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

const shindenCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(title) {
    return title.toLowerCase().trim();
}

function getFromCache(title) {
    const key = getCacheKey(title);
    const cached = shindenCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        return cached.data;
    }
    shindenCache.delete(key);
    return null;
}

function setInCache(title, data) {
    const key = getCacheKey(title);
    shindenCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

async function safeSearchShinden(title) {
    const cached = getFromCache(title);
    if (cached) return cached;

    try {
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        const shindenData = await retry(async () => {
            const data = await searchShinden(title);
            if (!data || !data._searchResults) {
                throw new Error('Invalid response from Shinden');
            }
            return data;
        }, 3);

        if (shindenData && shindenData._searchResults) {
            const results = shindenData._searchResults.map(result => ({
                title: result._title.trim(),
                type: result._type,
                status: result._status,
                rating: result._rating,
                url: result._seriesURL.href
            }));
            
            setInCache(title, results);
            return results;
        }
    } catch (err) {
        console.error(`Error fetching Shinden data for ${title}:`, err);
        setInCache(title, []);
        return [];
    }
    return [];
}

app.get('/api/anime/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: "Parametr 'query' jest wymagany." });
        }

        const malResponse = await axios.get('https://api.myanimelist.net/v2/anime', {
            params: {
                q: query,
                limit: 12,
                fields: 'id,title,main_picture,synopsis,mean,media_type,num_episodes,start_season,status'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
            }
        });

        let shindenResults = [];
        try {
            shindenResults = await safeSearchShinden(query);
        } catch (shindenError) {
            console.error('Shinden API error:', shindenError);
        }

        res.json({
            data: malResponse.data.data,
            shindenData: shindenResults
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania danych.' });
    }
});

app.get('/api/anime/random', async (req, res) => {
    try {
        const malResponse = await axios.get('https://api.myanimelist.net/v2/anime/ranking', {
            params: {
                ranking_type: 'all',
                limit: 100,
                fields: 'id,title,main_picture,synopsis,mean,media_type,num_episodes,start_season,status'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
            }
        });

        const shuffled = malResponse.data.data
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);

        let shindenResults = [];
        for (const anime of shuffled) {
            try {
                const results = await safeSearchShinden(anime.node.title);
                shindenResults = [...shindenResults, ...results];
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error processing ${anime.node.title}:`, error);
            }
        }

        res.json({
            data: shuffled,
            shindenData: shindenResults
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania losowych anime.' });
    }
});

app.get('/api/anime/top', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const malResponse = await axios.get('https://api.myanimelist.net/v2/anime/ranking', {
            params: {
                ranking_type: 'all',
                limit,
                offset,
                fields: 'id,title,main_picture,synopsis,mean,media_type,num_episodes,start_season,status'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
            }
        });

        const malData = malResponse.data.data;
        const batchSize = 5; 
        let shindenResults = [];

        for (let i = 0; i < malData.length; i += batchSize) {
            const batch = malData.slice(i, i + batchSize);
            const batchPromises = batch.map(anime => safeSearchShinden(anime.node.title));
            const batchResults = await Promise.all(batchPromises);
            shindenResults = [...shindenResults, ...batchResults.flat()];

            if (i + batchSize < malData.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        res.json({
            data: malResponse.data.data,
            shindenData: shindenResults,
            paging: {
                previous: offset > 0 ? `/api/anime/top?limit=${limit}&offset=${Math.max(0, offset - limit)}` : null,
                next: `/api/anime/top?limit=${limit}&offset=${parseInt(offset) + parseInt(limit)}`
            }
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania top anime.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});