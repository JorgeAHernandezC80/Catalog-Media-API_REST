const express = require('express');
const router = express.Router();
const { crearTipo, obtenerTipos } = require('../controllers/tipoController');

router.post('/tipos', crearTipo);
router.get('/tipos', obtenerTipos);

module.exports = router;
