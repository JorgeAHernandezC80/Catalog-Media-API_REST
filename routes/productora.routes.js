import { Router } from 'express';
const router = Router();

// Importamos el controlador con las funciones que manejarán las rutas de productoras (productora.controller.js)
import { 
    crearProductora, 
    obtenerProductoras, 
    obtenerProductoraPorId, 
    actualizarProductora, 
    eliminarProductora 
} from '../controllers/productora.controller.js';

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

export default router;