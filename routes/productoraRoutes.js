const { Router } = require('express');
const router = Router();
const { 
    crearProductora, 
    obtenerProductoras, 
    obtenerProductoraPorId, 
    actualizarProductora, 
    eliminarProductora 
} = require('../controllers/productoraController');

// 1. CREAR una nueva productora
router.post('/', crearProductora);

// 2. OBTENER todas las productoras
router.get('/', obtenerProductoras);

// 3. OBTENER una productora por ID
router.get('/:id', obtenerProductoraPorId);

// 4. ACTUALIZAR una productora por ID
router.put('/:id', actualizarProductora);

// 5. ELIMINAR una productora por ID
router.delete('/:id', eliminarProductora);

module.exports = router;
