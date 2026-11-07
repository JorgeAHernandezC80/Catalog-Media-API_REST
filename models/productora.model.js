// Importación de las dependencias necesarias desde mongoose
import { Schema, model } from 'mongoose';

// Definición del esquema para el modelo 'Productora'
const ProductoraSchema = new Schema({
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
    eslogan: { 
        type: String, 
        trim: true 
    },
    descripcion: { 
        type: String, 
        trim: true 
    }
}, { 
    timestamps: true 
});

// Exportación por defecto con el nombre del modelo 'Productora' y el esquema ProductoraSchema
export default model('Productora', ProductoraSchema);