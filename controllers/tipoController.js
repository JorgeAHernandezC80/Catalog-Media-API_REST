const Tipo = require('../models/Tipo');

// 1. CREAR un nuevo tipo
const crearTipo = async (req, res) => {
    try {
        const nuevoTipo = new Tipo(req.body);
        await nuevoTipo.save();
        res.status(201).json(nuevoTipo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 2. OBTENER todos los tipos
const obtenerTipos = async (req, res) => {
    try {
        const tipos = await Tipo.find();
        res.status(200).json(tipos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. OBTENER un tipo por ID
const obtenerTipoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const tipo = await Tipo.findById(id);
        if (!tipo) return res.status(404).json({ message: 'No se encontró el tipo con ese ID' });
        res.status(200).json(tipo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 4. ACTUALIZAR un tipo por ID
const actualizarTipo = async (req, res) => {
    try {
        const { id } = req.params;
        const tipoActualizado = await Tipo.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!tipoActualizado) return res.status(404).json({ message: 'No se encontró el tipo para actualizar' });
        res.status(200).json(tipoActualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 5. ELIMINAR un tipo por ID
const eliminarTipo = async (req, res) => {
    try {
        const { id } = req.params;
        const tipoEliminado = await Tipo.findByIdAndDelete(id);
        if (!tipoEliminado) return res.status(404).json({ message: 'No se encontró el tipo para eliminar' });
        res.status(200).json({ message: 'Tipo eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Exportación de los métodos del controlador para utilizarlos en el archivo de rutas
module.exports = {
    crearTipo,
    obtenerTipos,
    obtenerTipoPorId,
    actualizarTipo,
    eliminarTipo
};
