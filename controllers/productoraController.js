const Productora = require('../models/Productora');

// 1. CREAR una nueva productora
const crearProductora = async (req, res) => {
    try {
        const nuevaProductora = new Productora(req.body);
        await nuevaProductora.save();
        res.status(201).json(nuevaProductora);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 2. OBTENER todas las productoras
const obtenerProductoras = async (req, res) => {
    try {
        const productoras = await Productora.find();
        res.status(200).json(productoras);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. OBTENER una productora por ID
const obtenerProductoraPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const productora = await Productora.findById(id);
        if (!productora) return res.status(404).json({ message: 'No se encontró la productora con ese ID' });
        res.status(200).json(productora);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 4. ACTUALIZAR una productora por ID
const actualizarProductora = async (req, res) => {
    try {
        const { id } = req.params;
        const productoraActualizada = await Productora.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!productoraActualizada) return res.status(404).json({ message: 'No se encontró la productora para actualizar' });
        res.status(200).json(productoraActualizada);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 5. ELIMINAR una productora por ID
const eliminarProductora = async (req, res) => {
    try {
        const { id } = req.params;
        const productoraEliminada = await Productora.findByIdAndDelete(id);
        if (!productoraEliminada) return res.status(404).json({ message: 'No se encontró la productora para eliminar' });
        res.status(200).json({ message: 'Productora eliminada correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Exportación de los métodos del controlador para utilizarlos en el archivo de rutas
module.exports = {
    crearProductora,
    obtenerProductoras,
    obtenerProductoraPorId,
    actualizarProductora,
    eliminarProductora
};
