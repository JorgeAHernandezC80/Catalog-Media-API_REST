const { Schema, model } = require('mongoose');

const TipoSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    descripcion: { type: String, trim: true }
}, { timestamps: true });

module.exports = model('Tipo', TipoSchema);
