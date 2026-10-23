const mongoose = require('mongoose');

const DirectorSchema = new mongoose.Schema({
  nombres: { type: String, required: [true, 'Los nombres son obligatorios'], trim: true },
  estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' }
}, { timestamps: true });

module.exports = mongoose.model('Director', DirectorSchema);
