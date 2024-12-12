const express = require('express')

const app = express()
const { getStats, getStatus } = require('../controllers/AppController');


app.get('/status', getStatus);
app.get('/stats', getStats);

module.exports = app;




