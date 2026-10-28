const { Schema, model } = require('mongoose');

// Valida que la URL tenga un formato real (http/https), aceptando rutas,
// parámetros (?v=...) y mayúsculas, que el regex anterior rechazaba.
const esUrlValida = (valor) => {
    if (!valor) return true; // 'required' se encarga de los valores vacíos
    try {
        const url = new URL(valor);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const MediaSchema = new Schema({
    serial: {
        type: String,
        required: [true, 'El serial es un campo crítico y obligatorio'],
        unique: true, // Caso de estudio (I): el serial es único
        trim: true
    },
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true
    },
    sinopsis: {
        type: String,
        required: [true, 'La sinopsis es obligatoria'],
        trim: true
    },
    url: {
        type: String,
        required: [true, 'La URL de la producción es obligatoria'],
        unique: true, // Caso de estudio (IV): la URL de la película es única
        trim: true,
        validate: {
            validator: esUrlValida,
            message: 'Por favor, ingresa una URL con un formato válido (http o https)'
        }
    },
    portada: {
        type: String,
        trim: true,
        validate: {
            validator: esUrlValida,
            message: 'La portada debe ser una URL válida (http o https)'
        }
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
    timestamps: true // Caso de estudio (VI, VII): fecha de creación y actualización
});

module.exports = model('Media', MediaSchema);
