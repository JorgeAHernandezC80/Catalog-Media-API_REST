const mongoose = require('mongoose');

// Función asíncrona encargada de establecer la conexión con MongoDB local o en la nube
const conectarDB = async () => {
    try {
        // Usa la variable de entorno o un fallback local con IP 127.0.0.1 para evitar problemas de conexión en Node 17+
        const dbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/catalog_media_db';
        
        await mongoose.connect(dbURI);
        
        console.log('🔌 Conexión exitosa a la base de datos de la IU Digital');
    } catch (error) {
        console.error('Error crítico al intentar conectar con MongoDB:', error.message);
        process.exit(1); // Detiene de inmediato la ejecución de la API si no hay base de datos
    }
};

module.exports = { conectarDB };
