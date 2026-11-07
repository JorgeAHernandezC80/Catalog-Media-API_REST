//1. Importación de variables de entorno y dependencias necesarias
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

//2. Importación módulos internos
import { conectarDB } from './config/db-connection.js';
import generoRoutes from './routes/genero.routes.js';
import directorRoutes from './routes/director.routes.js';
import productoraRoutes from './routes/productora.routes.js';
import tipoRoutes from './routes/tipo.routes.js';
import mediaRoutes from './routes/media.routes.js';

//3. Crear la aplicación Express
const app = express();

//4. Configurar middlewares globales.Middlewares
app.use(cors());
app.use(express.json());

//5. Montar las rutas con versión
app.use('/api/v1/generos', generoRoutes);
app.use('/api/v1/directores', directorRoutes);
app.use('/api/v1/productoras', productoraRoutes);
app.use('/api/v1/tipos', tipoRoutes);
app.use('/api/v1/media', mediaRoutes);

//6. Ruta de verificación
app.get('/', (req, res) => {
  res.json({ mensaje: 'API REST de IU Digital levantada correctamente.' });
});

//7. Definir el puerto
const PORT = process.env.PORT || 5000;

//8. Función de arranque asíncrona
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

//9. Ejecutar la función de arranque
start();