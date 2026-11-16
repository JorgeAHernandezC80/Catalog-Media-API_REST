// Se importan los modelos de Director y Media para manejar las operaciones CRUD y verificar la integridad referencial al eliminar un director.

// 1. Importamos los modelos con su respectiva ruta
import Director from '../models/director.model.js';
import Media from '../models/media.model.js';
import { Types } from 'mongoose';

// 1. CREAR un nuevo director
export const crearDirector = async (req, res) => {
    try {
        const nuevoDirector = new Director(req.body);
        await nuevoDirector.save();
        res.status(201).json(nuevoDirector);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 2. OBTENER todos los directores
export const obtenerDirectores = async (req, res) => {
    try {
        const directores = await Director.find();
        res.status(200).json(directores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. OBTENER un director por ID
export const obtenerDirectorPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const director = await Director.findById(id);
        if (!director) return res.status(404).json({ message: 'No se encontró el director con ese ID' });
        res.status(200).json(director);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 4. ACTUALIZAR un director por ID
export const actualizarDirector = async (req, res) => {
    try {
        const { id } = req.params;
        const directorActualizado = await Director.findByIdAndUpdate(
            id, 
            req.body, 
            { returnDocument: 'after', runValidators: true }
        );
        if (!directorActualizado) return res.status(404).json({ message: 'No se encontró el director para actualizar' });
        res.status(200).json(directorActualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 5. ELIMINAR un director por ID
export const eliminarDirector = async (req, res) => {
    try {
        const { id } = req.params;
        // Revisamos el ID antes de consultar. Lo necesitamos convertido a ObjectId
        // para la guarda de transición de abajo, y si no es válido es mejor avisar con 400.
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'El ID del director no es válido' });
        }
        const idObjeto = new Types.ObjectId(id);

        // Integridad referencial: no se elimina si hay producciones que lo usan.
        // Primera guarda: busca al director en la lista nueva 'directores'.
        // Segunda guarda (de transición): producciones viejas pueden tener todavía el campo
        // antiguo 'director' (uno solo). Se puede quitar cuando se corra scripts/migrar-directores.js.
        // Como el esquema ya no declara 'director', forzamos strictQuery: false (para que
        // Mongoose no quite el filtro) y pasamos el ID ya convertido a ObjectId.
        const enUso = await Media.exists({ directores: id })
            || await Media.exists({ director: idObjeto }).setOptions({ strictQuery: false });
        if (enUso) {
            return res.status(409).json({ message: 'No se puede eliminar: hay producciones asociadas a este director. Cámbielo a Inactivo o reasigne las producciones.' });
        }

        const directorEliminado = await Director.findByIdAndDelete(id);
        if (!directorEliminado) return res.status(404).json({ message: 'No se encontró el director para eliminar' });
        res.status(200).json({ message: 'Director eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};