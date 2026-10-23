const Genero = require('../models/Genero');

const crearGenero = async (req, res) => {
  try {
    const nuevo = new Genero(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerGeneros = async (req, res) => {
  try {
    const lista = await Genero.find();
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearGenero, obtenerGeneros };
