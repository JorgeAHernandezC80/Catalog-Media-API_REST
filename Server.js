const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carga las variables del archivo .env primero

// Importamos la función de conexión desde la carpeta config
const { conectarDB } = require('./config/db-connection');

// Importación de rutas (Subidas para seguir las buenas prácticas)
const generoRoutes = require('./routes/generoRoutes');
const directorRoutes = require('./routes/directorRoutes');
const productoraRoutes = require('./routes/productoraRoutes');
const tipoRoutes = require('./routes/tipoRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

const app = express();

// Inicializamos la conexión a MongoDB
conectarDB();

// Middlewares globales (Obligatorio colocarlos antes de las rutas)
app.use(cors());
app.use(express.json());

// Uso de rutas (Ubicadas antes de que el servidor empiece a escuchar)
app.use('/api', generoRoutes);
app.use('/api', directorRoutes);
app.use('/api', productoraRoutes);
app.use('/api', tipoRoutes);
app.use('/api', mediaRoutes);

// Ruta inicial de verificación
app.get('/', (req, res) => {
  res.json({ mensaje: 'API REST de IU Digital levantada correctamente.' });
});

// El servidor se levanta AL FINAL, una vez todo está configurado
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});
