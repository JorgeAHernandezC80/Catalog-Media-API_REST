const { Schema, model } = require('mongoose');

const MediaSchema = new Schema({
    serial: {
        type: String,
        required: [true, 'El serial es un campo crítico y obligatorio'],
        unique: true, // Regla crítica: No se pueden duplicar seriales en el catálogo
        trim: true
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
        required: [true, 'La URL de la producción es obligatoria'],
        match: [
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 
            'Por favor, ingresa una URL con un formato válido'
        ]
    },
    portada: {
        type: String,
        trim: true
    },
    anoEstreno: {
        type: Number,
        required: [true, 'El año de estreno es obligatorio'],
        min: [1888, 'El año de estreno no puede ser anterior a la creación del cine (1888)']
    },
    // RELACIONES CRÍTICAS (Integridad Referencial)
    genero: {
        type: Schema.Types.ObjectId,
        ref: 'Genero',
        required: [true, 'La producción debe estar asociada a un Género']
    },
    director: {
        type: Schema.Types.ObjectId,
        ref: 'Director',
        required: [true, 'La producción debe tener un Director asignado']
    },
    productora: {
        type: Schema.Types.ObjectId,
        ref: 'Productora',
        required: [true, 'La productora es obligatoria']
    },
    tipo: {
        type: Schema.Types.ObjectId,
        ref: 'Tipo',
        required: [true, 'Debe especificar el Tipo (Película o Serie)']
    }
}, {
    timestamps: true // Crea automáticamente campos 'createdAt' y 'updatedAt'
});

module.exports = model('Media', MediaSchema);
