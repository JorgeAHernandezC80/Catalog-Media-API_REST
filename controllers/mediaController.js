const Media = require('../models/Media');
const Genero = require('../models/Genero');
const Director = require('../models/Director');
const Productora = require('../models/Productora');
const Tipo = require('../models/Tipo');

const crearMedia = async (req, res) => {
  try {
    const { serial, titulo, genero, director, productora, tipo } = req.body;

    // REGLA CRÍTICA: Validamos la existencia real de los IDs foráneos en la BD
    const [existeGenero, existeDirector, existeProductora, existeTipo] = await Promise.all([
      Genero.findById(genero),
      Director.findById(director),
      Productora.findById(productora),
      Tipo.findById(tipo)
    ]);

    if (!existeGenero) return res.status(404).json({ error: 'Validación Fallida: El id de Género no existe.' });
    if (!existeDirector) return res.status(404).json({ error: 'Validación Fallida: El id de Director no existe.' });
    if (!existeProductora) return res.status(404).json({ error: 'Validación Fallida: El id de Productora no existe.' });
    if (!existeTipo) return res.status(404).json({ error: 'Validación Fallida: El id de Tipo no existe.' });

    // Validar duplicado de serial
    const existeSerial = await Media.findOne({ serial });
    if (existeSerial) {
      return res.status(400).json({ error: 'El serial proporcionado ya está registrado.' });
    }

    const nuevaMedia = new Media(req.body);
    await nuevaMedia.save();

    return res.status(201).json({ mensaje: 'Recurso Media creado exitosamente', data: nuevaMedia });

  } catch (error) {
    return res.status(500).json({ error: 'Error al procesar la regla crítica', detalle: error.message });
  }
};

const obtenerMedia = async (req, res) => {
  try {
    // Al usar .populate() unimos la información completa de los módulos vinculados
    const catalogo = await Media.find()
      .populate('genero', 'nombre estado')
      .populate('director', 'nombres estado')
      .populate('productora', 'nombre')
      .populate('tipo', 'nombre');

    return res.status(200).json(catalogo);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar catálogo', detalle: error.message });
  }
};

module.exports = { crearMedia, obtenerMedia };
