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

//7. Manejo de rutas inexistentes y errores.
// Van al final, después de todas las rutas, porque Express los usa solo si
// ninguna ruta anterior respondió.

// 7.1 Ruta que no existe: respondemos en JSON en vez de la página HTML de Express.
app.use((req, res) => {
  res.status(404).json({ message: `La ruta ${req.method} ${req.originalUrl} no existe en la API.` });
});

// 7.2 Errores que no atrapó ningún controlador (por ejemplo, un JSON mal escrito).
// Express reconoce este middleware como manejador de errores porque recibe 4 parámetros.
// Así el cliente nunca ve el detalle interno del error ni las rutas del servidor.
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido. Revisa comas, comillas y llaves.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'El cuerpo de la petición es demasiado grande.' });
  }
  // El detalle completo queda solo en los logs del servidor.
  console.error('Error no controlado:', error);
  const estado = error.status ?? error.statusCode ?? 500;
  res.status(estado >= 400 && estado < 600 ? estado : 500).json({ message: 'Error interno del servidor.' });
});

//8. Definir el puerto
const PORT = process.env.PORT || 5000;

//9. Función de arranque asíncrona
const start = async () => {
  try {
    await conectarDB();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error.message);
    // exitCode en vez de process.exit(): así el proceso termina con error, pero
    // primero alcanza a enviar el mensaje a los logs (en Render se perdía).
    process.exitCode = 1;
  }
};

//10. Ejecutar la función de arranque
start();