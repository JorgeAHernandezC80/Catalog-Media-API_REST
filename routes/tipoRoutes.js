const { Router } = require('express');
const router = Router();
const { 
    crearTipo, 
    obtenerTipos, 
    obtenerTipoPorId, 
    actualizarTipo, 
    eliminarTipo 
} = require('../controllers/tipoController');

// 1. CREAR un nuevo tipo
router.post('/', crearTipo);

// 2. OBTENER todos los tipos
router.get('/', obtenerTipos);

// 3. OBTENER un tipo por ID
router.get('/:id', obtenerTipoPorId);

// 4. ACTUALIZAR un tipo por ID
router.put('/:id', actualizarTipo);

// 5. ELIMINAR un tipo por ID
router.delete('/:id', eliminarTipo);

module.exports = router;
