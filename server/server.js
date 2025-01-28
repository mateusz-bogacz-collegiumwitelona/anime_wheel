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

// Funkcja pomocnicza do ponawiania prób
async function retry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`Próba ${i + 1} nieudana, ponawiam za ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            // Zwiększamy opóźnienie z każdą próbą
            delay *= 2;
        }
    }
}

// Cache dla wyników Shinden
const shindenCache = new Map();

// Funkcja pomocnicza do dodania opóźnienia
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Funkcja do bezpiecznego wyszukiwania w Shinden z cache
async function safeSearchShinden(title) {
    // Sprawdź cache
    if (shindenCache.has(title)) {
        return shindenCache.get(title);
    }

    try {
        // Zwiększamy podstawowe opóźnienie do 1-2s
        await delay(1000 + Math.random() * 1000);
        
        // Używamy systemu retry dla zapytań do Shinden
        const shindenData = await retry(async () => {
            const data = await searchShinden(title);
            if (!data || !data._searchResults) {
                throw new Error('Invalid response from Shinden');
            }
            return data;
        }, 3, 2000);

        if (shindenData && shindenData._searchResults) {
            const results = shindenData._searchResults.map(result => ({
                title: result._title.trim(),
                type: result._type,
                status: result._status,
                rating: result._rating,
                url: result._seriesURL.href
            }));
            // Zapisz w cache
            shindenCache.set(title, results);
            return results;
        }
    } catch (err) {
        console.error(`Error fetching Shinden data for ${title}:`, err);
        // Zapisz pusty wynik do cache, żeby nie próbować ponownie
        shindenCache.set(title, []);
        return [];
    }
    return [];
}

// Endpoint proxy dla MAL i Shinden API - wyszukiwanie
app.get('/api/anime/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: "Parametr 'query' jest wymagany." });
        }

        // Pobierz dane z MAL
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

        // Pobierz dane z Shinden
        let shindenResults = [];
        try {
            shindenResults = await safeSearchShinden(query);
        } catch (shindenError) {
            console.error('Shinden API error:', shindenError);
        }

        const response = {
            data: malResponse.data.data,
            shindenData: shindenResults
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania danych.' });
    }
});

// Endpoint do losowych anime
app.get('/api/anime/random', async (req, res) => {
    try {
        // Pobierz top 100 anime z MAL
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

        // Losowo wybierz 6 anime
        const shuffled = malResponse.data.data
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);

        // Pobierz dane z Shinden sekwencyjnie
        let shindenResults = [];
        for (const anime of shuffled) {
            try {
                const results = await safeSearchShinden(anime.node.title);
                shindenResults = [...shindenResults, ...results];
                // Dodatkowe opóźnienie między kolejnymi anime
                await delay(500);
            } catch (error) {
                console.error(`Error processing ${anime.node.title}:`, error);
            }
        }

        const response = {
            data: shuffled,
            shindenData: shindenResults
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania losowych anime.' });
    }
});

// Endpoint do listy top anime
app.get('/api/anime/top', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        // Pobierz top anime z MAL
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

        // Pobierz dane z Shinden równolegle dla grup po 6 anime
        const malData = malResponse.data.data;
        const batchSize = 6;
        let shindenResults = [];

        for (let i = 0; i < malData.length; i += batchSize) {
            const batch = malData.slice(i, i + batchSize);
            const batchPromises = batch.map(anime => safeSearchShinden(anime.node.title));
            const batchResults = await Promise.all(batchPromises);
            shindenResults = [...shindenResults, ...batchResults.flat()];
        }

        const response = {
            data: malResponse.data.data,
            shindenData: shindenResults,
            paging: {
                previous: offset > 0 ? `/api/anime/top?limit=${limit}&offset=${Math.max(0, offset - limit)}` : null,
                next: `/api/anime/top?limit=${limit}&offset=${parseInt(offset) + parseInt(limit)}`
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania top anime.' });
    }
});

// Endpoint do listy sezonów
app.get('/api/anime/seasons', async (req, res) => {
    try {
        const { year = new Date().getFullYear(), season = 'winter' } = req.query;

        // Pobierz anime z danego sezonu z MAL
        const malResponse = await axios.get(`https://api.myanimelist.net/v2/anime/season/${year}/${season}`, {
            params: {
                limit: 100,
                fields: 'id,title,main_picture,synopsis,mean,media_type,num_episodes,start_season,status'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
            }
        });

        // Pobierz dane z Shinden równolegle dla grup po 6 anime
        const malData = malResponse.data.data;
        const batchSize = 6;
        let shindenResults = [];

        for (let i = 0; i < malData.length; i += batchSize) {
            const batch = malData.slice(i, i + batchSize);
            const batchPromises = batch.map(anime => safeSearchShinden(anime.node.title));
            const batchResults = await Promise.all(batchPromises);
            shindenResults = [...shindenResults, ...batchResults.flat()];
        }

        const response = {
            data: malResponse.data.data,
            shindenData: shindenResults,
            season: {
                year,
                season
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania anime z sezonu.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});