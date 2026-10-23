const { Schema, model } = require('mongoose');

const GeneroSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    estado: { type: String, required: true, enum: ['Activo', 'Inactivo'], default: 'Activo' },
    descripcion: { type: String, trim: true }
}, { timestamps: true });

module.exports = model('Genero', GeneroSchema);

