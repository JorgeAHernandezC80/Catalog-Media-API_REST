const { Router } = require('express');
const router = Router();
const { 
    createMedia, 
    obtenerCatalogo, 
    obtenerMediaPorId,
    actualizarMedia,
    eliminarMedia 
} = require('../controllers/mediaController');

// 1. CREAR una nueva producción (Película o Serie)
router.post('/', createMedia);

// 2. OBTENER todo el catálogo con población de datos relacionales
router.get('/', obtenerCatalogo);

// 3. OBTENER el detalle completo de una producción por su ID
router.get('/:id', obtenerMediaPorId);

// 4. ACTUALIZAR una producción por ID validando referencias existentes
router.put('/:id', actualizarMedia);

// 5. ELIMINAR una producción por ID del catálogo
router.delete('/:id', eliminarMedia);

module.exports = router;
