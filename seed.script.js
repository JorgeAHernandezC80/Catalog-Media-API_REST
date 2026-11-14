// Carga los datos iniciales definidos en el caso de estudio:
// - Géneros (20, todos en estado Activo): Acción, Aventura, Animación, Biográfico,
//   Ciencia ficción, Comedia, Crimen, Documental, Drama, Familiar, Fantasía, Bélico,
//   Histórico, Misterio, Musical, Romance, Suspenso, Terror, Western y Deportivo.
//   Cada género es uno solo; no se usan géneros combinados (por ejemplo "Acción y Ciencia ficción"),
//   porque una producción puede tener varios géneros por separado.
// - Tipos: serie y película
// Se puede ejecutar varias veces: no duplica registros que ya existen.
// Uso: npm run seed

import 'dotenv/config';
import mongoose from 'mongoose';
import Genero from './models/genero.model.js';
import Tipo from './models/tipo.model.js';

const GENEROS = [
    { nombre: 'Acción', estado: 'Activo', descripcion: 'Producciones con ritmo intenso, peleas y persecuciones' },
    { nombre: 'Aventura', estado: 'Activo', descripcion: 'Viajes, exploración y búsqueda de objetivos' },
    { nombre: 'Animación', estado: 'Activo', descripcion: 'Historias contadas con dibujos, modelos o imágenes animadas por computador' },
    { nombre: 'Biográfico', estado: 'Activo', descripcion: 'Relatos sobre la vida de personas reales' },
    { nombre: 'Ciencia ficción', estado: 'Activo', descripcion: 'Historias basadas en avances científicos o futuros posibles' },
    { nombre: 'Comedia', estado: 'Activo', descripcion: 'Producciones pensadas para divertir y hacer reír' },
    { nombre: 'Crimen', estado: 'Activo', descripcion: 'Historias sobre delitos, criminales e investigaciones policiales' },
    { nombre: 'Documental', estado: 'Activo', descripcion: 'Producciones que muestran hechos y personas de la realidad' },
    { nombre: 'Drama', estado: 'Activo', descripcion: 'Historias centradas en conflictos humanos y emocionales' },
    { nombre: 'Familiar', estado: 'Activo', descripcion: 'Contenido apto para ver en familia, con niños y adultos' },
    { nombre: 'Fantasía', estado: 'Activo', descripcion: 'Mundos imaginarios con magia, criaturas y elementos sobrenaturales' },
    { nombre: 'Bélico', estado: 'Activo', descripcion: 'Historias ambientadas en guerras y conflictos armados' },
    { nombre: 'Histórico', estado: 'Activo', descripcion: 'Relatos ambientados en épocas o hechos del pasado' },
    { nombre: 'Misterio', estado: 'Activo', descripcion: 'Tramas con enigmas que se resuelven poco a poco' },
    { nombre: 'Musical', estado: 'Activo', descripcion: 'Producciones donde las canciones y el baile hacen parte de la historia' },
    { nombre: 'Romance', estado: 'Activo', descripcion: 'Historias centradas en relaciones amorosas' },
    { nombre: 'Suspenso', estado: 'Activo', descripcion: 'Tramas que mantienen la tensión y la incertidumbre del espectador' },
    { nombre: 'Terror', estado: 'Activo', descripcion: 'Producciones que buscan generar miedo o suspenso' },
    { nombre: 'Western', estado: 'Activo', descripcion: 'Historias del viejo oeste con vaqueros, pueblos y desiertos' },
    { nombre: 'Deportivo', estado: 'Activo', descripcion: 'Historias sobre deportistas, equipos y competencias' }
];


const TIPOS = [
    { nombre: 'Serie', descripcion: 'Producción dividida en temporadas y episodios' },
    { nombre: 'Película', descripcion: 'Producción de largometraje de una sola entrega' }
];

const sembrar = async (Modelo, datos) => {
    for (const dato of datos) {
        await Modelo.updateOne(
            { nombre: dato.nombre },
            { $setOnInsert: dato },
            { upsert: true }
        );
    }
    console.log(`✔ ${Modelo.modelName}: ${await Modelo.countDocuments()} registros`);
};

const ejecutar = async () => {
    const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog_media_db';
    try {
        await mongoose.connect(dbURI);
        await sembrar(Genero, GENEROS);
        await sembrar(Tipo, TIPOS);
        console.log('🌱 Datos iniciales cargados correctamente');
    } catch (error) {
        console.error('Error al cargar los datos iniciales:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

ejecutar();