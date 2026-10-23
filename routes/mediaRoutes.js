const { Router } = require('express');
const router = Router();
const { 
    createMedia, 
    obtenerCatalogo, 
    obtenerMediaPorId 
} = require('../controllers/mediaController');

// POST: / (Se encarga de crear una producción)
router.post('/', createMedia);

// GET: / (Se encarga de listar todo el catálogo completo)
router.get('/', obtenerCatalogo);

// GET: /:id (Se encarga de buscar una producción específica por su ID)
router.get('/:id', obtenerMediaPorId);

module.exports = router;
