import express from 'express';

const { getStats, getStatus } = require('./controllers/AppController');

require('dotenv').config();

const app = express();

app.get('/status', getStatus);
app.get('/stats', getStats);

app.listen(process.env.PORT, () => { console.log(`Server running on port ${process.env.PORT}`); });
