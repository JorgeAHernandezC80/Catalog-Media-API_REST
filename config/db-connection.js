// Importación de mongoose con ES Modules
import mongoose from 'mongoose';

// Función asíncrona encargada de establecer la conexión con MongoDB local o en la nube
export const conectarDB = async () => {
    try {
        // Usa la variable de entorno MONGODB_URI o un fallback local
        const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog_media_db';
        
        await mongoose.connect(dbURI);
        
        console.log('🔌 Conexión exitosa a la base de datos de la IU Digital');
    } catch (error) {
        console.error('Error crítico al intentar conectar con MongoDB:', error.message);
        process.exit(1); // Detiene de inmediato la ejecución de la API si no hay base de datos
    }
};