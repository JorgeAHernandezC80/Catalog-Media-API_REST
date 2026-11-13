// Carga los datos iniciales definidos en el caso de estudio:
// - Géneros: acción, aventura, ciencia ficción, drama y terror
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
    { nombre: 'Ciencia ficción', estado: 'Activo', descripcion: 'Historias basadas en avances científicos o futuros posibles' },
    { nombre: 'Drama', estado: 'Activo', descripcion: 'Historias centradas en conflictos humanos y emocionales' },
    { nombre: 'Terror', estado: 'Activo', descripcion: 'Producciones que buscan generar miedo o suspenso' }
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