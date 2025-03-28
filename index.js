require('dotenv').config();
const express = require('express');
const compression = require('compression'); // Подключаем Gzip
const { BigQuery } = require('@google-cloud/bigquery');
const NodeCache = require('node-cache');

const app = express();
const port = 5100;
const cache = new NodeCache({ stdTTL: 60 }); // Кеш на 60 секунд

const API_KEY = process.env.API_KEY;
const PROJECT_ID = process.env.PROJECT_ID;
const CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const bigquery = new BigQuery({
    keyFilename: CREDENTIALS,
    projectId: PROJECT_ID
});

const MAX_LIMIT = 10000; // Ограничение количества строк

app.use(express.json());
app.use(compression()); // 💨 Включаем Gzip для сжатия

app.post('/query', async (req, res) => {
    let { query, apiKey, page = 1, limit = 1000 } = req.body;

    if (apiKey !== API_KEY) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }

    limit = Math.min(limit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    if (!query.toLowerCase().includes('limit')) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const cachedData = cache.get(query);
    if (cachedData) {
        return res.status(200).json({ page, data: cachedData });
    }

    try {
        const [rows] = await bigquery.query({ query, useQueryCache: true });
        cache.set(query, rows);
        return res.status(200).json({ page, data: rows });
    } catch (err) {
        console.error('Error querying BigQuery:', err);
        return res.status(500).json({ error: 'Failed to query BigQuery', details: err.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
