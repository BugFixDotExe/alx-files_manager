const express = require('express')

const router = express.Router()
const { getStats, getStatus } = require('../controllers/AppController');


router.get('/status', getStatus);
router.get('/stats', getStats);

module.exports = router;




