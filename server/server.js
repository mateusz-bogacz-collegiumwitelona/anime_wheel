const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Dodajemy CORS
app.use(cors());

// Serwowanie statycznych plików z folderu public
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint proxy dla MAL API
app.get('/api/anime/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: "Parametr 'query' jest wymagany." });
        }

        const response = await axios.get('https://api.myanimelist.net/v2/anime', {
            params: {
                q: query,
                limit: 12,
                fields: 'id,title,main_picture,synopsis,mean,media_type,num_episodes,start_season,status'
            },
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania danych.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});