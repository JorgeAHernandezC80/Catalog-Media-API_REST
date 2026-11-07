import { Router } from 'express';
const router = Router();

// Importamos el controlador con las funciones que manejarán las rutas de media (media.controller.js)
import { 
    createMedia, 
    obtenerCatalogo, 
    obtenerMediaPorId,
    actualizarMedia,
    eliminarMedia 
} from '../controllers/media.controller.js';

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

export default router;