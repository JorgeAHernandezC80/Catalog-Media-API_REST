const { Router } = require('express');
const router = Router();
const { 
    crearGenero, 
    obtenerGeneros, 
    obtenerGeneroPorId, 
    actualizarGenero, 
    eliminarGenero 
} = require('../controllers/generoController');

// 1. CREAR un nuevo género
router.post('/', crearGenero);

// 2. OBTENER todos los géneros
router.get('/', obtenerGeneros);

// 3. OBTENER un género por ID
router.get('/:id', obtenerGeneroPorId);

// 4. ACTUALIZAR un género por ID
router.put('/:id', actualizarGenero);

// 5. ELIMINAR un género por ID
router.delete('/:id', eliminarGenero);

module.exports = router;
