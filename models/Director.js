const { Schema, model } = require('mongoose');

const DirectorSchema = new Schema({
    nombres: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    estado: { type: String, required: true, enum: ['Activo', 'Inactivo'], default: 'Activo' }
}, { timestamps: true });

module.exports = model('Director', DirectorSchema);
