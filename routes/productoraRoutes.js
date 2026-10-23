const express = require('express');
const router = express.Router();
const { crearProductora, obtenerProductoras } = require('../controllers/productoraController');

router.post('/productoras', crearProductora);
router.get('/productoras', obtenerProductoras);

module.exports = router;
