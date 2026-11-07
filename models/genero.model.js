// Importación de las dependencias necesarias desde mongoose
import { Schema, model } from 'mongoose';

// Definición del esquema para el modelo 'Genero'
const GeneroSchema = new Schema({
    nombre: { 
        type: String, 
        required: [true, 'El nombre es obligatorio'], 
        trim: true 
    },
    estado: { 
        type: String, 
        required: true, 
        enum: ['Activo', 'Inactivo'], 
        default: 'Activo' 
    },
    descripcion: { 
        type: String, 
        trim: true 
    }
}, { 
    timestamps: true 
});

// Exportación por defecto con el nombre del modelo 'Genero' y el esquema GeneroSchema
export default model('Genero', GeneroSchema);