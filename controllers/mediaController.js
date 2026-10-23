const Media = require('../models/Media');
const Genero = require('../models/Genero');
const Director = require('../models/Director');
const Productora = require('../models/Productora');
const Tipo = require('../models/Tipo');

// 1. CREAR una nueva producción (Película o Serie) con validación de llaves foráneas
const createMedia = async (req, res) => {
    try {
        const { genero, director, productora, tipo } = req.body;

        // Regla de Negocio Crítica: Verificar la existencia real de cada ID de referencia
        const generoExiste = await Genero.findById(genero);
        if (!generoExiste) {
            return res.status(404).json({ message: 'El Género especificado no existe.' });
        }

        const directorExiste = await Director.findById(director);
        if (!directorExiste) {
            return res.status(404).json({ message: 'El Director especificado no existe.' });
        }

        const productoraExiste = await Productora.findById(productora);
        if (!productoraExiste) {
            return res.status(404).json({ message: 'La Productora especificada no existe.' });
        }

        const tipoExiste = await Tipo.findById(tipo);
        if (!tipoExiste) {
            return res.status(404).json({ message: 'El Tipo especificado no existe.' });
        }

        // Si todas las referencias son válidas, se procede a guardar el documento
        const nuevaMedia = new Media(req.body);
        await nuevaMedia.save();
        
        res.status(201).json(nuevaMedia);
    } catch (error) {
        // Captura errores de validación de campos obligatorios o serial duplicado (Error E11000)
        res.status(400).json({ error: error.message });
    }
};

// 2. OBTENER todo el catálogo con población de datos relacionales
const obtenerCatalogo = async (req, res) => {
    try {
        const catalogo = await Media.find()
            .populate('genero', 'nombre estado')
            .populate('director', 'nombres estado')
            .populate('productora', 'nombre eslogan')
            .populate('tipo', 'nombre');

        res.status(200).json(catalogo);
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error al obtener el catálogo de medios', 
            error: error.message 
        });
    }
};

// 3. OBTENER el detalle completo de una producción por su ID
const obtenerMediaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const contenido = await Media.findById(id)
            .populate('genero')
            .populate('director')
            .populate('productora')
            .populate('tipo');

        if (!contenido) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'No se encontró ninguna producción con ese ID' 
            });
        }

        res.status(200).json(contenido);
    } catch (error) {
        res.status(400).json({ 
            status: 'error', 
            message: 'ID no válido o error en la consulta', 
            error: error.message 
        });
    }
};

// Exportación de los métodos del controlador para utilizarlos en el archivo de rutas
module.exports = {
    createMedia,
    obtenerCatalogo,
    obtenerMediaPorId
};
