// Importación de las dependencias necesarias desde mongoose
import { Schema, model } from 'mongoose';

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

// Límite de géneros por producción. Lo dejamos en una constante para no
// repetir el número en el validador y en el mensaje de error.
const MAX_GENEROS = 5;

// Valida la lista de géneros: debe tener entre 1 y MAX_GENEROS elementos y
// ninguno repetido. Mongoose pone [] por defecto en los arreglos, por eso
// 'required' no sirve aquí y revisamos el largo a mano.
const validadoresGeneros = [
    {
        validator: (lista) => Array.isArray(lista) && lista.length >= 1,
        message: 'La producción debe estar asociada al menos a un Género'
    },
    {
        validator: (lista) => !Array.isArray(lista) || lista.length <= MAX_GENEROS,
        message: `La producción no puede tener más de ${MAX_GENEROS} géneros`
    },
    {
        // Comparamos como texto porque dos ObjectId iguales son objetos distintos
        validator: (lista) => {
            if (!Array.isArray(lista)) return true;
            const textos = lista.map((id) => String(id));
            return new Set(textos).size === textos.length;
        },
        message: 'La lista de géneros no puede tener géneros repetidos'
    }
];

// Definición del esquema para el modelo 'Media'
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
    // Una producción puede tener varios géneros (de 1 a 5, sin repetir)
    generos: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Genero' }],
        validate: validadoresGeneros
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

// Exportación por defecto con el nombre del modelo 'Media' y el esquema MediaSchema
export default model('Media', MediaSchema);