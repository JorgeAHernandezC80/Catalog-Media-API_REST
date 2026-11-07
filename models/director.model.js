// Importación de las dependencias necesarias desde mongoose
import { Schema, model } from 'mongoose';

// Definición del esquema para el modelo Director
const DirectorSchema = new Schema({
    nombres: { 
        type: String, 
        required: [true, 'El nombre es obligatorio'], 
        trim: true 
    },
    estado: { 
        type: String, 
        required: true, 
        enum: ['Activo', 'Inactivo'], 
        default: 'Activo' 
    }
}, { timestamps: true });

// Exportación por defecto con el nombre del modelo 'Director' y el esquema DirectorSchema
export default model('Director', DirectorSchema);