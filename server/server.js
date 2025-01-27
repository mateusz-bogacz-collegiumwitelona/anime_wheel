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

// Endpoint proxy dla MAL i Shinden API
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
            const shindenData = await searchShinden(query);
            // Konwertuj wyniki Shinden do prostszego formatu
            shindenResults = shindenData._searchResults.map(result => ({
                title: result._title.trim(),
                type: result._type,
                status: result._status,
                rating: result._rating,
                url: result._seriesURL.href
            }));
        } catch (shindenError) {
            console.error('Shinden API error:', shindenError);
        }

        // Połącz dane
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

