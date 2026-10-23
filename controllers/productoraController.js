const Productora = require('../models/Productora');

const crearProductora = async (req, res) => {
  try {
    const nueva = new Productora(req.body);
    await nueva.save();
    res.status(201).json(nueva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerProductoras = async (req, res) => {
  try {
    const lista = await Productora.find();
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearProductora, obtenerProductoras };
