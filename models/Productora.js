const mongoose = require('mongoose');

const ProductoraSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'Nombre obligatorio'], trim: true },
  estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
  eslogan: { type: String },
  descripcion: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Productora', ProductoraSchema);
