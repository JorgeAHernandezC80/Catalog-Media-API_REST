// 1. Usar import/export (ES Modules) en lugar de require/module.exports
import { Router } from 'express';
const router = Router();

// 2. Importamos el controlador con las funciones que manejarán las rutas de director (director.controller.js)
import { 
    crearDirector, 
    obtenerDirectores, 
    obtenerDirectorPorId, 
    actualizarDirector, 
    eliminarDirector 
} from '../controllers/director.controller.js';

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

// 3. Exportar con export default
export default router;