const mongoose = require('mongoose');

const GeneroSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'Nombre obligatorio'], trim: true },
  estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
  descripcion: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Genero', GeneroSchema);
