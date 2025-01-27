const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/anime/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({error: "Paramter 'query' jest wymagany."});
        }

        const response = await axios.get('https://api.myanimelist.net/v2/anime', {
            params: {
                q: query,
                limit: 12,
                fields: 'title, synosis, mean'
            },
            headers: {
                'X-MAL-Client-ID': process.env.MAL_CLIENT_ID,
            }
        });

        const animeList = response.data.data.map(item => ({
            title: item.node.title,
            synopsis: item.node.synopsis,
            mean: item.node.mean
        }));

        res.json(animeList);
    }catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: 'Wystąpił błąd podczas pobierania danych.'});
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});