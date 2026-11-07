import { Router } from 'express';
const router = Router();

// Importamos el controlador con las funciones que manejarán las rutas de género (genero.controller.js)
import { 
    crearGenero, 
    obtenerGeneros, 
    obtenerGeneroPorId, 
    actualizarGenero, 
    eliminarGenero 
} from '../controllers/genero.controller.js';

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

export default router;