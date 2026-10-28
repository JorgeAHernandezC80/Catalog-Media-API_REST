const Director = require('../models/Director');
const Media = require('../models/Media');

// 1. CREAR un nuevo director
const crearDirector = async (req, res) => {
    try {
        const nuevoDirector = new Director(req.body);
        await nuevoDirector.save();
        res.status(201).json(nuevoDirector);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 2. OBTENER todos los directores
const obtenerDirectores = async (req, res) => {
    try {
        const directores = await Director.find();
        res.status(200).json(directores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. OBTENER un director por ID
const obtenerDirectorPorId = async (req, res) => {
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
const actualizarDirector = async (req, res) => {
    try {
        const { id } = req.params;
        const directorActualizado = await Director.findByIdAndUpdate(id, req.body, { returnDocument: 'after', runValidators: true });
        if (!directorActualizado) return res.status(404).json({ message: 'No se encontró el director para actualizar' });
        res.status(200).json(directorActualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 5. ELIMINAR un director por ID
const eliminarDirector = async (req, res) => {
    try {
        const { id } = req.params;
        // Integridad referencial: no se elimina si hay producciones que lo usan
        const enUso = await Media.exists({ director: id });
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

// Exportación de los métodos del controlador para utilizarlos en el archivo de rutas
module.exports = {
    crearDirector,
    obtenerDirectores,
    obtenerDirectorPorId,
    actualizarDirector,
    eliminarDirector
};
