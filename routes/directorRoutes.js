const express = require('express');
const router = express.Router();
const { crearDirector, obtenerDirectores } = require('../controllers/directorController');

router.post('/directores', crearDirector);
router.get('/directores', obtenerDirectores);

module.exports = router;
