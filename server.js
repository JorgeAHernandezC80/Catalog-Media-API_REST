import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { conectarDB } from './config/db-connection.js';
import generoRoutes from './routes/genero.routes.js';
import directorRoutes from './routes/director.routes.js';
import productoraRoutes from './routes/productora.routes.js';
import tipoRoutes from './routes/tipo.routes.js';
import mediaRoutes from './routes/media.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas con versión
app.use('/api/v1/generos', generoRoutes);
app.use('/api/v1/directores', directorRoutes);
app.use('/api/v1/productoras', productoraRoutes);
app.use('/api/v1/tipos', tipoRoutes);
app.use('/api/v1/media', mediaRoutes);

// Ruta de verificación
app.get('/', (req, res) => {
  res.json({ mensaje: 'API REST de IU Digital levantada correctamente.' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await conectarDB();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

start();