const { Schema, model } = require('mongoose');

const ProductoraSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    estado: { type: String, required: true, enum: ['Activo', 'Inactivo'], default: 'Activo' },
    eslogan: { type: String, trim: true },
    descripcion: { type: String, trim: true }
}, { timestamps: true });

module.exports = model('Productora', ProductoraSchema);
