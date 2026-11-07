// Importación de las dependencias necesarias desde mongoose
import { Schema, model } from 'mongoose';

// Definición del esquema para el modelo 'Tipo'
const TipoSchema = new Schema({
    nombre: { 
        type: String, 
        required: [true, 'El nombre es obligatorio'], 
        trim: true 
    },
    descripcion: { 
        type: String, 
        trim: true 
    }
}, { 
    timestamps: true 
});

// Exportación por defecto con el nombre del modelo 'Tipo' y el esquema TipoSchema
export default model('Tipo', TipoSchema);