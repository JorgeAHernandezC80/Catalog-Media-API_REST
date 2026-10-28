const Genero = require('../models/Genero');
const Media = require('../models/Media');

// 1. CREAR un nuevo género
const crearGenero = async (req, res) => {
    try {
        const nuevoGenero = new Genero(req.body);
        await nuevoGenero.save();
        res.status(201).json(nuevoGenero);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 2. OBTENER todos los géneros
const obtenerGeneros = async (req, res) => {
    try {
        const generos = await Genero.find();
        res.status(200).json(generos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. OBTENER un género por ID
const obtenerGeneroPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const genero = await Genero.findById(id);
        if (!genero) {
            return res.status(404).json({ message: 'No se encontró el género con ese ID' });
        }
        res.status(200).json(genero);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 4. ACTUALIZAR un género por ID
const actualizarGenero = async (req, res) => {
    try {
        const { id } = req.params;
        const generoActualizado = await Genero.findByIdAndUpdate(id, req.body, { 
            returnDocument: 'after',
            runValidators: true 
        });
        if (!generoActualizado) {
            return res.status(404).json({ message: 'No se encontró el género para actualizar' });
        }
        res.status(200).json(generoActualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 5. ELIMINAR un género por ID
const eliminarGenero = async (req, res) => {
    try {
        const { id } = req.params;
        // Integridad referencial: no se elimina si hay producciones que lo usan
        const enUso = await Media.exists({ genero: id });
        if (enUso) {
            return res.status(409).json({ message: 'No se puede eliminar: hay producciones asociadas a este género. Cámbielo a Inactivo o reasigne las producciones.' });
        }

        const generoEliminado = await Genero.findByIdAndDelete(id);
        if (!generoEliminado) {
            return res.status(404).json({ message: 'No se encontró el género para eliminar' });
        }
        res.status(200).json({ message: 'Género eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Exportación de los métodos del controlador para utilizarlos en el archivo de rutas
module.exports = {
    crearGenero,
    obtenerGeneros,
    obtenerGeneroPorId,
    actualizarGenero,
    eliminarGenero
};
