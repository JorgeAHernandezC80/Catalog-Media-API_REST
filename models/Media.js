const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  serial: {
    type: String,
    unique: true,
    required: [true, 'El serial único es obligatorio']
  },
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true
  },
  sinopsis: { 
    type: String,
    required: [true, 'La sinopsis es obligatoria']
  },
  url: { 
    type: String,
    required: [true, 'La URL del recurso es obligatoria']
  },
  portada: { 
    type: String 
  },
  anhoEstreno: { 
    type: Number,
    required: [true, 'El año de estreno es obligatorio']
  },

  // LA REGLA CRÍTICA: LAS CUATRO RELACIONES OBLIGATORIAS
  genero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Genero',
    required: [true, 'Debe estar vinculada a un Género']
  },
  director: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Director',
    required: [true, 'Debe estar vinculada a un Director']
  },
  productora: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Productora',
    required: [true, 'Debe estar vinculada a una Productora']
  },
  tipo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tipo',
    required: [true, 'Debe estar vinculada a un Tipo']
  }
}, { timestamps: true });

module.exports = mongoose.model('Media', MediaSchema);
