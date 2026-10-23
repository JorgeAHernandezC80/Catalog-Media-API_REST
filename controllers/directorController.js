const Director = require('../models/Director');

const crearDirector = async (req, res) => {
  try {
    const nuevo = new Director(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerDirectores = async (req, res) => {
  try {
    const lista = await Director.find();
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearDirector, obtenerDirectores };
