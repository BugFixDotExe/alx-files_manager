const express = require('express')

const app = express()
const AppController = require('../controllers/AppController');


app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);

module.exports = app;




