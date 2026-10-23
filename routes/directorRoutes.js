const { Router } = require('express');
const router = Router();
const { 
    crearDirector, 
    obtenerDirectores, 
    obtenerDirectorPorId, 
    actualizarDirector, 
    eliminarDirector 
} = require('../controllers/directorController');

// 1. CREAR un nuevo director
router.post('/', crearDirector);

// 2. OBTENER todos los directores
router.get('/', obtenerDirectores);

// 3. OBTENER un director por ID
router.get('/:id', obtenerDirectorPorId);

// 4. ACTUALIZAR un director por ID
router.put('/:id', actualizarDirector);

// 5. ELIMINAR un director por ID
router.delete('/:id', eliminarDirector);

module.exports = router;
