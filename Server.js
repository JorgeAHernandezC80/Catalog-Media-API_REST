const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carga las variables del archivo .env primero

// Importamos la función de conexión desde la carpeta config
const { conectarDB } = require('./config/db-connection');

// Importación de rutas 
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

// Uso de rutas con sus prefijos semánticos correspondientes
// Esto mapea cada módulo de manera independiente evitando colisiones
app.use('/api/generos', generoRoutes);
app.use('/api/directores', directorRoutes);
app.use('/api/productoras', productoraRoutes);
app.use('/api/tipos', tipoRoutes);
app.use('/api/media', mediaRoutes);

// Ruta inicial de verificación
app.get('/', (req, res) => {
  res.json({ mensaje: 'API REST de IU Digital levantada correctamente.' });
});

// El servidor se levanta AL FINAL, una vez todo está configurado
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});
