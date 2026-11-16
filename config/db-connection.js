// Importación de mongoose con ES Modules
import mongoose from 'mongoose';

// Función asíncrona encargada de establecer la conexión con MongoDB local o en la nube.
// Si algo falla, lanza el error para que server.js lo muestre y detenga la API.
export const conectarDB = async () => {
    const usaVariable = Boolean(process.env.MONGODB_URI);

    // Usa la variable de entorno MONGODB_URI o un fallback local
    const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog_media_db';

    // En un servidor (Render) no existe MongoDB local, por eso avisamos si falta la variable.
    if (!usaVariable) {
        console.warn('No se encontró la variable MONGODB_URI; se intentará con MongoDB local (127.0.0.1).');
    }

    // Mostramos solo el servidor, nunca el usuario ni la contraseña.
    // Quitamos "mongodb://" o "mongodb+srv://", luego lo que va antes de "@" y después de "/".
    const servidor = dbURI.replace(/^mongodb(\+srv)?:\/\//, '').split('@').pop().split('/')[0];
    console.log(`⏳ Conectando a MongoDB en ${servidor}...`);

    try {
        // Si en 15 segundos no encuentra el servidor, falla con un mensaje claro.
        await mongoose.connect(dbURI, { serverSelectionTimeoutMS: 15000 });
        console.log('🔌 Conexión exitosa a la base de datos de la IU Digital');
    } catch (error) {
        throw new Error(`Error crítico al intentar conectar con MongoDB: ${error.message}`);
    }
};