const express = require('express');
const router = express.Router();
const { crearGenero, obtenerGeneros } = require('../controllers/generoController');

router.post('/generos', crearGenero);
router.get('/generos', obtenerGeneros);

module.exports = router;
