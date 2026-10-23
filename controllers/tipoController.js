const Tipo = require('../models/Tipo');

const crearTipo = async (req, res) => {
  try {
    const nuevo = new Tipo(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerTipos = async (req, res) => {
  try {
    const lista = await Tipo.find();
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearTipo, obtenerTipos };
