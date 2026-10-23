const express = require('express');
const router = express.Router();
const { crearMedia, obtenerMedia } = require('../controllers/mediaController');

router.post('/media', crearMedia);
router.get('/media', obtenerMedia);

module.exports = router;
