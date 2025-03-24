require('dotenv').config(); // Загружаем переменные окружения
const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');

const app = express();
const port = 5100;

// Используем переменные из .env
const API_KEY = process.env.API_KEY;
const PROJECT_ID = process.env.PROJECT_ID;
const CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const bigquery = new BigQuery({
    keyFilename: CREDENTIALS,
    projectId: PROJECT_ID
});

// Middleware для обработки JSON
app.use(express.json());

app.post('/query', async (req, res) => {
    const { query, apiKey } = req.body;

    if (apiKey !== API_KEY) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }

    try {
        const [rows] = await bigquery.query(query);
        return res.status(200).json(rows);
    } catch (err) {
        console.error('Error querying BigQuery:', err);
        return res.status(500).json({ error: 'Failed to query BigQuery', details: err.message });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
/*
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});*/
