const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    // Intentamos conectar usando la URI de las variables de entorno
    const conexion = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Conectado con éxito: ${conexion.connection.host}`);
  } catch (error) {
    console.error(`❌ Error crítico al conectar a la base de datos: ${error.message}`);
    // Detiene la aplicación por completo si no hay conexión a la base de datos
    process.exit(1); 
  }
};

module.exports = { conectarDB };
