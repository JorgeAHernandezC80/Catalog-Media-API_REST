import { Router } from 'express';
const router = Router();

// Importamos el controlador con las funciones que manejarán las rutas de tipo (tipo.controller.js)
import { 
    crearTipo, 
    obtenerTipos, 
    obtenerTipoPorId, 
    actualizarTipo, 
    eliminarTipo 
} from '../controllers/tipo.controller.js';

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

export default router;